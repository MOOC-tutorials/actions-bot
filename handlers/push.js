  
const {getConfig, validators,
       modifiers, VALID_REPOSITORIES} = require('../config/config');
const {closeOpenIssues, conventionIssue} = require('../utils/issue');
const {addAttempt} = require('../utils/grade');
const {checkIssuesEnable} = require('../utils/issue');

function validateFileModifications(fileText, fixFileInfo){
  // Checks if was modified and if file is the expected one 
  if(fixFileInfo){
    for (let index = 0; index < fixFileInfo.expectedValues.length; index++) {
      const {querySelector, attribute, value, type} = fixFileInfo.expectedValues[index];
      if(validators.hasOwnProperty(type)){

        const isValid = validators[type](fileText, querySelector, value, attribute);
        console.log(isValid);
        if(!isValid){
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  }
  return false;
}

async function validateCommit(context, files, fixInfo){
  const api = context.github;
  const {repository} = context.payload;
  const owner = repository.owner.name;
  const repo = repository.name;
  try{
    let valid = true;
    let currentFiles = {};
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const fileData = await api.repos.getContents({
        owner,
        repo,
        path: file.filename
      });
      const fileText = new Buffer(fileData.data.content, 'base64').toString();
      currentFiles[file.filename] = {content: fileText, sha: file.sha};
      
      context.log(file.filename);
      context.log(fixInfo.files);
      const fixFileInfo = fixInfo.files.find(fixfile => fixfile.filename === file.filename);
      context.log(fixFileInfo);
      const validChange = validateFileModifications(fileText, fixFileInfo);
      if(!validChange){
        valid = false;
      }
    }
    context.log({valid, currentFiles});
    return {valid, currentFiles};
  } catch(err){
    console.error(err)
    return false;
  }
}

async function validCommit(context, fixInfo, currentFiles){
  const api = context.github;
  const {repository} = context.payload;
  // TODO: Refactor to use context.repo object
  const owner = repository.owner.name;
  const repo = repository.name;

  //Change code if required. Close issue. Create new issue. 
  if(fixInfo.actions && fixInfo.actions.length > 0){
    fixInfo.actions.forEach(async function(actions){
      // Do modification over files dom and commit changes
      const {type, files} = actions;

      if (modifiers.hasOwnProperty(type)){
        await modifiers[type](files, context);
      } else {
        context.log('No modifiers available')
      }

    });
  }
}

async function invalidCommit(context, fixInfo, commitMessage){
  const api = context.github;
  const {repository} = context.payload;
  // TODO: Refactor to use context.repo object
  const owner = repository.owner.name;
  const repo = repository.name;
  const config = getConfig(repo);

  //Add comment to issue about commit not fixing it.
  if(config.errorCommentIssue){
    let {body, labels} = config.errorCommentIssue;
    const {title, files} = fixInfo;
    const filesToObject = {...files};
    body += '\n`' + commitMessage + '`\n\n ```json\n' + JSON.stringify(filesToObject, null, '\t') + '\n```';
    context.log(owner);
    context.log(repo);    
    const {data} = await api.issues.listForRepo({
      owner,
      repo,
      labels,
      state: 'open',
      direction: 'asc'
    });
    context.log(data.length);
    if(data.length > 0){
      const {number} = data[0];
      if(data[0].body.includes(title)){
        context.log('Comment for fix: '+ title);  
        const issueComment = await api.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body
        });
        context.log(issueComment);  
      } else if(config.errorInvalidIssueNumber) {
        context.log('Comment for fix: '+ title);
        body =  config.errorInvalidIssueNumber.body;
        const issueComment = await api.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body
        });
        context.log(issueComment);  
        
      }
    } else {
      context.log('Comment for fix: '+ title);
        body =  config.errorNoIssueOpen.body + title;
        title = config.errorNoIssueOpen.title;
        const issueComment = await api.issues.create({
          owner,
          repo,
          title,
          body
        });
    }
  }
}

exports.handlePush = async function (robot, context) {
  const api = context.github;
  const {repository, commits, ref} = context.payload;
  // TODO: Refactor to use context.repo object
  const owner = repository.owner.name;
  const repo = repository.name;
  const {has_issues} = repository; 
  const config = getConfig(repo);

  if(!context.isBot && VALID_REPOSITORIES.indexOf(repo) >= 0){
    let newIssueCreated = false;
    commits.forEach(async function(commit){
          let commitMessage = commit.message.split(':')[0]
          const commitInfo = await api.repos.getCommit({
              owner,
              repo,
              ref
          });
          const files = commitInfo.data.files;
          const {fixes, attempt} = config;
          const fixInfo = fixes.find(fix => fix.title === commitMessage);
          if (fixInfo) {
            // Validate commit made the correct changes. 
            const {valid, currentFiles} = await validateCommit(context, files, fixInfo);
            await checkIssuesEnable(context, owner, repo);
            if (valid) {
              context.log('Valid commit');
              await validCommit(context, fixInfo, currentFiles);
              //Close open issues
              await closeOpenIssues(context);
              // Create new issue
              if(fixInfo.nextIssue && !newIssueCreated){
                newIssueCreated = true;
                if (attempt) await addAttempt(context, owner, repo, commitMessage);

                const {title, body, labels} = fixInfo.nextIssue;
                context.log(title + ' created');
                await api.issues.create({
                  owner,
                  repo,
                  title,
                  body,
                  assignees: [owner],
                  labels
                });
                
              }
            } else {
              context.log('Invalid commit');
              await invalidCommit(context, fixInfo, commit.message);
              if (attempt) await addAttempt(context, owner, repo, commitMessage);
            }
          } else if(has_issues) {
            context.log('Incorrect convention');
            await conventionIssue(context, commitMessage);
            if (attempt) await addAttempt(context, owner, repo, "Incorrect convention");
          }
    });
  } else {
    context.log('Invalid repo or bot action');
    context.log(repo);
  }
}
