  
const {getConfig, validators,
       modifiers, VALID_REPOSITORIES} = require('../config/config');
const {checkIssuesEnable, closeOpenIssues, conventionIssue} = require('../utils/issue');
const {addAttempt} = require('../utils/attempt');
const {prettifyJson} = require('../utils/parse');
const {checkGrading} = require('../utils/grade');

const validateFileModifications = (fileText, fixFileInfo) => {
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

const validateCommit = async (context, files, fixInfo) => {
  //Validation is made taking into account the files changes by a commit. Each commit should do all the changes
  //required to be valid and only change the expected files
  //TODO: Check if it is the expected behavior
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

const validCommit = async (context, fixInfo, currentFiles) =>{
  const api = context.github;
  const {repository} = context.payload;
  // TODO: Refactor to use context.repo object
  const owner = repository.owner.name;
  const repo = repository.name;

  //Change code if required. Close issue. Create new issue. 
  if(fixInfo.actions && fixInfo.actions.length > 0){
    fixInfo.actions.forEach(async function(actions){
      // Do modification over files dom and commit changes
      const {type, data} = actions;

      if (modifiers.hasOwnProperty(type)){
        await modifiers[type](data, context);
      } else {
        context.log('No modifiers available')
      }

    });
  }
}

const invalidCommit = async (context, fixInfo, commitMessage, rawFeedback) => {
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
    const expectedChanges = prettifyJson(filesToObject, rawFeedback);
    body += '\n`' + commitMessage + '`\n\n' + expectedChanges;
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
        await api.issues.create({
          owner,
          repo,
          title,
          body
        });
    }
  }
}

exports.handlePush = async (robot, context) => {
  const api = context.github;
  const {repository, commits, ref} = context.payload;
  const owner = repository.owner.name;
  const repo = repository.name;
  const config = getConfig(repo);
  const grading = await checkGrading(owner, repo);

  if(!context.isBot && VALID_REPOSITORIES.indexOf(repo) >= 0 && !grading){
    let newIssueCreated = false;
    await checkIssuesEnable(context, owner, repo);
    context.log('Check commits');
    commits.forEach(async function(commit){
          let commitMessage = commit.message.split(':')[0]
          const commitInfo = await api.repos.getCommit({
              owner,
              repo,
              ref
          });
          const files = commitInfo.data.files;
          const {fixes, traceAttempts, defaultAttemptTitle, rawFeedback} = config;
          const fixInfo = fixes.find(fix => fix.title === commitMessage);
          context.log('Check commit:' + commitMessage);
          if (fixInfo) {
            // Validate commit made the correct changes and record attempt
            if (traceAttempts) await addAttempt(context, owner, repo, commitMessage);
            const {valid, currentFiles} = await validateCommit(context, files, fixInfo);
            if (valid) {
              context.log('Valid commit');
              await validCommit(context, fixInfo, currentFiles);
              //Close open issues
              await closeOpenIssues(context, owner, repo);
              // Create new issue
              if(fixInfo.nextIssue && !newIssueCreated){
                newIssueCreated = true;
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
              await invalidCommit(context, fixInfo, commit.message, rawFeedback);
            }
          } else {
            context.log('Incorrect convention');
            if (traceAttempts) await addAttempt(context, owner, repo, defaultAttemptTitle);
            await conventionIssue(context, commitMessage);
          }
    });
  } else {
    context.log('Invalid repo or bot action');
    context.log(repo);
  }
};
