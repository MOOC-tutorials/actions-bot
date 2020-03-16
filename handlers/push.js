  
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
  const {repository, ref} = context.payload;
  const owner = repository.owner.name;
  const email = repository.owner.email;
  const repo = repository.name;
  context.log("This is the name of the owner", email);
  try{
    let valid = true;
    let currentFiles = [];
    for (let index=0; index < files.length && valid; index++){ 
      const file = files[index];
      const fileInfo = fixInfo.files.find(fixfile => fixfile.filename === file.filename);
      if(!fileInfo){
        valid = false;
      }
    }
    for (let index = 0; index < fixInfo.files.length && valid; index++) {
      const fixFileInfo = fixInfo.files[index];
      
      if (fixFileInfo){
        const {ref : fixFileRef } = fixFileInfo;
        context.log(fixFileInfo);
        let validChange = (!fixFileRef || fixFileRef === ref) && fixFileInfo;
        if (validChange){
          const fileData = await api.repos.getContents({
            owner,
            repo,
            path: file.filename,
            ref
          });
          const fileText = Buffer.from(fileData.data.content, 'base64').toString();
          
          context.log(file.filename);
          context.log(fixInfo.files);
          validChange = validateFileModifications(fileText, fixFileInfo);
        }
        if(!validChange){
          // TODO: Review if a partial 'for' is better
          valid = false;
          currentFiles.push(fixFileInfo);
          break;
        }
      }
    }
    context.log({valid, currentFiles});
    return {valid, currentFiles};
  } catch(err){
    context.log(err);
    const valid = false;
    const currentFiles = [];
    return {valid, currentFiles};
  }
}

const validCommit = async (context, fixInfo, currentFiles) =>{
  const api = context.github;
  const {repository} = context.payload;
  // TODO: Refactor to use context.repo object
  const owner = repository.owner.name;
  const email = repository.owner.email;
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

const invalidCommit = async (context, fixInfo, commitMessage, rawFeedback, currentFiles) => {
  const api = context.github;
  const {repository} = context.payload;

  // TODO: Refactor to use context.repo object
  const owner = repository.owner.name;
  const email = repository.owner.email;
  const repo = repository.name;
  const config = getConfig(repo);

  //Add comment to issue about commit not fixing it.
  if(config.errorCommentIssue){
    let {body, labels} = config.errorCommentIssue;
    const {title, files} = fixInfo;
    if(!currentFiles){
      currentFiles = files;
    }
    const filesToObject = {...currentFiles};
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
        const issuetitle = config.errorNoIssueOpen.title;
        await api.issues.create({
          owner,
          repo,
          title: issuetitle,
          body
        });
    }
  }
}

exports.handlePush = async (robot, context) => {
  const api = context.github;
  const {repository, commits, ref} = context.payload;
  const {name: owner, email} = repository.owner;
  const {name: repo} = repository;
  const config = getConfig(repo);
  const grading = await checkGrading(repo, email);

  if(!context.isBot && config && (!grading || config.multipleAttempts)){
    let newIssueCreated;
    await checkIssuesEnable(context, owner, repo);
    context.log('Check commits');
    context.log(commits);
    for(let i = 0; i < commits.length; i++){
          const commit = commits[i];
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
            if (traceAttempts) await addAttempt(context, owner, repo, email, commitMessage);
            const {valid, currentFiles} = await validateCommit(context, files, fixInfo);
            if (valid) {
              context.log('Valid commit');
              await validCommit(context, fixInfo, currentFiles);
              //Close open issues
              await closeOpenIssues(context, owner, repo);
              // Create new issue
              const {number = 1} = newIssueCreated || {}  // NOTE: Needed to evaluate just one commit per fix if multiple attempts in a single push were made
              if(fixInfo.nextIssue !== newIssueCreated && fixInfo.nextIssue.number > number){
                newIssueCreated = fixInfo.nextIssue;
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
              await invalidCommit(context, fixInfo, commit.message, rawFeedback, currentFiles);
            }
          } else {
            context.log('Incorrect convention');
            if (traceAttempts) await addAttempt(context, owner, repo, email, defaultAttemptTitle);
            await conventionIssue(context, commitMessage);
          }
    }
  } else {
    context.log('Invalid repo, bot action or action done after grading without multiple attempts on');
    context.log(repo);
  }
};
