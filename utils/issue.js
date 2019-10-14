const {getConfig} = require('../config/config');

exports.checkIssuesEnable = async function(context, owner, repo){
  const api = context.github;
  await api.repos.update({
    owner,
    repo,
    has_issues: true
  });  
}

exports.conventionIssue = async function(context, commitMessage){
  const api = context.github;
  const {repository} = context.payload;
  const owner = repository.owner.name;
  const repo = repository.name;
  const config = getConfig(repo);

  let {title, body} = config.errorConventionIssue; 
  body += '\nEl último commit tiene el siguiente mensaje: \n`' + commitMessage + '`\n'
          + 'Este issue es solo un recordatorio de la convención de comentarios en los commits y puede ser cerrado.';
  context.log('Convention Issue created');
  const issueInfo = await api.issues.create({
    owner,
    repo,
    title,
    body,
    assignees: [owner],
    labels: ['documentation']
  });
  context.log(issueInfo);
}

exports.closeOpenIssues = async function(context){
    const api = context.github;
    const {repository} = context.payload;
    // TODO: Refactor to use context.repo object
    const owner = repository.owner.name;
    const repo = repository.name;
 
    const {data} = await api.issues.listForRepo({owner, repo, state: 'open'});
    context.log(data);
    if(data.length > 0){
     context.log('Close issues');
     data.forEach(async function(issue){
         const { number } = issue;
         const issueInfo = await api.issues.update({
           owner,
           repo, 
           issue_number: number,
           state: 'closed'});
         context.log(issueInfo);
     });
    }
 }