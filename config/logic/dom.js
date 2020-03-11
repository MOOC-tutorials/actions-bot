const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { getCommitter } = require('../../utils/committer');

const DEFAULT_BRANCH = 'master';
const DEFAULT_MERGE_MESSAGE = 'Merge automático';

exports.domValidation = function(htmlText, selector, value, attribute){
    const {document} = (new JSDOM(htmlText)).window;
    try{
        let actualValue = document.querySelector(selector);
        if(actualValue) actualValue = actualValue[attribute];
        console.log(actualValue);
        console.log(value);
        return value === actualValue;
    } catch(err){
      console.log(err);
      return false;
    }
}

function _domModification (htmlText, selector, attribute, value){
    const dom = new JSDOM(htmlText);
    let {document} = dom.window;
    // Modify document following params
    let element = document.querySelector(selector);
    element[attribute] = value;
    return dom.serialize(); 
}

function _fileDomModification(fileData, valueChanges, path){
    //CONTENT
    let newDom = fileData.data.content;
    let update = '';
    const contentBuffer = new Buffer(newDom, 'base64');
    newDom = contentBuffer.toString();

    for (let index = 0; index < valueChanges.length; index++) {
        const valueChange = valueChanges[index];
        const {querySelector, value, attribute} = valueChange;
        newDom = _domModification(newDom, querySelector, attribute, value);
        update += querySelector + ', ';
         
    }
    const message = 'Update '+ update +' of file ' + path;

    return {newDom, message};
}

exports.domModification = async function(data, context){
    const api = context.github;
    const {files, pullRequest} = data;
    const {repository, after: sha} = context.payload;
    const owner = repository.owner.name;
    const email = repository.owner.email;
    const repo = repository.name;

    let branch = DEFAULT_BRANCH;
    let pull = false;
    let merge = false;

    if(pullRequest){
        const {data:{object: {sha}}} = await api.git.getRef({
          owner,
          repo,
          ref: 'heads/' + pullRequest.pullBase 
        }).catch(err => {
          context.log(err);
        });
        console.log("Base ref: ");
        console.log(data);
        branch = pullRequest.pullHead;
        pull = pullRequest.createPull;
        merge = pullRequest.mergePull;
        await api.git.createRef({
          owner,
          repo,
          ref: 'refs/heads/' + branch,
          sha
        }).catch(err => {
          context.log(err);
        });
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const {filename, valueChanges} = file;
        const path = filename;
        const fileData = await api.repos.getContents({
            owner,
            repo,
            path
          });
      
        const {newDom, message} = _fileDomModification(fileData, valueChanges, path)
        const buffer = new Buffer(newDom);
        const newFileContent = buffer.toString('base64');
        const sha = fileData.data.sha;

        context.log('Commit and push of the robot to: ' + branch);
        const newCommit = await api.repos.createOrUpdateFile({
            owner,
            repo,
            sha,
            path,
            branch,
            message,
            content: newFileContent,
            committer: getCommitter(repo)
        });
        context.log(newCommit);
    }
  
    if(pull){
      const {pullTitle: title, pullBody: body,
             pullHead: head, pullBase: base} = pullRequest;

      const openPullRequest = await api.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base
      }).catch(err => {
        context.log(err);
      });

      if(merge){
        //TODO: Merge of the open pull request
        // Use number of openPullRequest
        console.log(openPullRequest);
      }

    } else if (merge){
      // Merge without creating pull request
      const {pullHead: head, pullBase: base,
              mergeMessage: commit_message = DEFAULT_MERGE_MESSAGE} = pullRequest;
      await api.repos.merge({
        owner,
        repo,
        base,
        head,
        commit_message
      }).catch(err => {
        context.log(err);
      });
    }
}
