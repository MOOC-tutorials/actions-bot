const {checkIssuesEnable} = require('../utils/issue');

exports.handleRepository = async (robot, context) => {
  const api = context.github;
  const {action, repository} = context.payload;
  const owner = repository.owner.login;
  const repo = repository.name;
  const {has_issues} = repository;
  context.log(action);
  if(action === 'edited' && !has_issues){
      await checkIssuesEnable(context, owner, repo);     
  }
}