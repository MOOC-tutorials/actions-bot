const {getConfig} = require('../config/config');

exports.handleInstallation = async function(robot, context){
    const api = context.github;
    const {action, installation, repositories_added} = context.payload;

    if(action === 'added'){
        const {account} = installation;
        for (let index = 0; index < repositories_added.length; index++) {
            const repository = repositories_added[index];
            const repo = repository.name;
            const owner = account.login;
            const config = getConfig(repo);
            if (config && config.initialIssue){
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
