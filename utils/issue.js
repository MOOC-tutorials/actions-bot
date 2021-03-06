const {getConfig} = require('../config/config');

exports.checkIssuesEnable = async (context, owner, repo) => {
  const api = context.github;
  const repository = await api.repos.update({
    owner,
    repo,
    has_issues: true
  });
  //context.log(repository);
  return repository;
}

exports.conventionIssue = async (context, commitMessage) => {
  const api = context.github;
  const {repository} = context.payload;
  const owner = repository.owner.name;
  const email = repository.owner.email;
  const repo = repository.name;
  const config = getConfig(repo);

  let {title, body} = config.errorConventionIssue;
  const {data} = await api.issues.listForRepo({owner, repo, state: 'open', labels:['documentation']});
  //context.log(data);
  if(data.length > 0){
    body = '@'+ owner + ' , no se siguió la convención para los mensajes de los commits. El último commit tiene el siguiente mensaje: \n`' + commitMessage + '`\n';
    const {number} = data[0];
    await api.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body
    });
    context.log('Convention Comment created - Issue: ' + number);
  } else {
    body += 'a convención del mensaje del último commit no es la esperada: \n`' + commitMessage + '`\n\n'
         + 'Recuerde que debe tener el siguiente formato: `<Identificador de la corrección>: <Comentario>`\n'
         + 'Para realizar la corrección del mensaje de commit ejecute los comandos `git commit --amend` y `git push -f`\n\n'
         + 'Este issue es solo un recordatorio de la convención de comentarios en los commits y puede ser cerrado.';
    await api.issues.create({
      owner,
      repo,
      title,
      body,
      assignees: [owner],
      labels: ['documentation']
    });
    context.log('Convention Issue created');
  }
}

exports.closeOpenIssues = async (context, owner, repo) => {
    const api = context.github;
    const {data} = await api.issues.listForRepo({owner, repo, state: 'open'});
    context.log(data);

    if(data.length > 0){
     context.log('Close issues');
     data.forEach(async (issue) => {
         context.log("====================================================");
         context.log(issue);
         context.log("====================================================");
         const { number } = issue;
         const issueInfo = await api.issues.update({
           owner,
           repo, 
           issue_number: number,
           state: 'closed'});
         //context.log(issueInfo);
     });
    }
 }