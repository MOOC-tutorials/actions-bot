const {getConfig} = require('../config/config');
const {closeOpenIssues, checkIssuesEnable} = require('../utils/issue');
const {checkGrading} = require('../utils/grade');

exports.handleInstallation = async (robot, context) => {
    const api = context.github;
    const {action, installation} = context.payload;
    //context.log(context.payload);
    const repositories_added = context.payload.repositories_added || context.payload.repositories;
    context.log(action);
    if(action === 'added' || action === 'created'){
        const {account} = installation;
        for (let index = 0; index < repositories_added.length; index++) {
            const repository = repositories_added[index];
            const repo = repository.name;
            const owner = account.login;
            const config = getConfig(repo);
            await checkIssuesEnable(context, owner, repo);
            const grading = await checkGrading(owner, repo);
            if (config && config.initialIssue && !grading){
                const {title, body} = config.initialIssue;
                // Review duplicated issue and close them if any
                await closeOpenIssues(context, owner, repo);
                // Create new initialIssue
                const issueInfo = await api.issues.create({
                    owner, repo, title, body,
                    assignees: [owner],
                    labels: ['bug']
                    });
                    context.log(issueInfo);
            }    
        }
    }
}
