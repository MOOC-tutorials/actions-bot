
const fs = require('fs');
const yaml = require('js-yaml');

// Valid repositories where the bot has actions to do
const VALID_REPOSITORIES = ['git_web_practice'];
exports.VALID_REPOSITORIES = VALID_REPOSITORIES;

//Get the config of activities for the given repo
exports.getConfig = function(repoName){
    if(VALID_REPOSITORIES.indexOf(repoName) >= 0){
      try{
        let file;
        const fileYML = __dirname + '/config_' + repoName + '.yml';
        const fileJSON = __dirname + '/config_' + repoName + '.json';
        if(fs.existsSync(fileYML)) {
          file = fileYML;
        } else if(fs.existsSync(fileYML)) {
          file = fileJSON;
        } 
        
        if (file) {
          console.log("Running with config file at: " + file);
          const data = fs.readFileSync(file);
          const config = yaml.safeLoad(data);
          return config;
        }
      } catch(err){
        console.log(err);
        return {};
      }
    }
  console.log("No config file was found");
  return {};
};

// Modifiers and validators by type
const DOM = 'DOM';
const {domValidation, domModification} = require('./logic/dom');

const GRADE = 'GRADE';
const {exerciseGrade} = require('./logic/grade');

const APPEND = 'APPEND';
const {fileAppendModification} = require('./logic/append');

exports.validators = {[DOM]: domValidation};
exports.modifiers = {[DOM]: domModification,
                     [GRADE]: exerciseGrade,
                     [APPEND]: fileAppendModification};

