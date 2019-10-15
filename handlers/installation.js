const {getConfig} = require('../config/config');
const {checkIssuesEnable} = require('../utils/issue');

exports.handleInstallation = async function(robot, context){
    const api = context.github;
    const {action, installation} = context.payload;
    const repositories_added = context.payload.repositories_added || context.payload.repositories;
    context.log(action);
    if(action === 'added' || action === 'created'){
        const {account} = installation;
        for (let index = 0; index < repositories_added.length; index++) {
            const repository = repositories_added[index];
            const repo = repository.name;
            const owner = account.login;
            const config = getConfig(repo);
            if (config && config.initialIssue){
                await checkIssuesEnable(context, owner, repo);
               // await checkIssuesEnable(context, 'gcortes-prof', repo);
                const {title, body} = config.initialIssue;
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
