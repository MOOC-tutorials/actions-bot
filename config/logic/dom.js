const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { getCommitter } = require('../../utils/committer');

exports.domValidation = function(htmlText, selector, value, attribute){
    const {document} = (new JSDOM(htmlText)).window;
    try{
        let actualValue = document.querySelector(selector)[attribute];
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

exports.domModification = async function(files, context){
    const api = context.github;
    const {repository} = context.payload;
    const owner = repository.owner.name;
    const repo = repository.name;

    files.forEach(async function(file){
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

        context.log('Commit and push of the robot');
        const newCommit = await api.repos.createOrUpdateFile({
            owner,
            repo,
            sha,
            path,
            message,
            content: newFileContent,
            committer: getCommitter(repo)
        });
        context.log(newCommit);    
    });
}
