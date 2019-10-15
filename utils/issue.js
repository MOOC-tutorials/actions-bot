const {getConfig} = require('../config/config');

exports.checkIssuesEnable = async function(context, owner, repo){
  const api = context.github;
  const repository = await api.repos.update({
    owner,
    repo,
    has_issues: true
  });
  context.log(repository);
  return repository;
}

exports.conventionIssue = async function(context, commitMessage){
  const api = context.github;
  const {repository} = context.payload;
  const owner = repository.owner.name;
  const repo = repository.name;
  const config = getConfig(repo);

  let {title, body} = config.errorConventionIssue;
  const {data} = await api.issues.listForRepo({owner, repo, state: 'open', labels:['documentation']});
  context.log(data);
  if(data.length > 0){
    body = '@'+ owner + 'no se siguió la convención para los mensajes de los commits. El último commit tiene el siguiente mensaje: \n`' + commitMessage + '`\n'
    const {number} = data[0]
    const issueComment = await api.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body
    });
    context.log('Convention Comment created - Issue: ' + number);
  } else {
    body += '\nEl último commit tiene el siguiente mensaje: \n`' + commitMessage + '`\n'
         + 'Este issue es solo un recordatorio de la convención de comentarios en los commits y puede ser cerrado.';
    const issueInfo = await api.issues.create({
      owner,
      repo,
      title,
      body,
      assignees: [owner],
      labels: ['documentation']
    });
    context.log('Convention Issue created');
    //context.log(issueInfo);
  }
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