
const fs = require('fs');
// Valid repositories where the bot has actions to do
const VALID_REPOSITORIES = ['git_web_practice'];
exports.VALID_REPOSITORIES = VALID_REPOSITORIES;

//Get the config of activities for the given repo
exports.getConfig = function(repoName){
    if(VALID_REPOSITORIES.indexOf(repoName) >= 0){
        const data = fs.readFileSync(__dirname + '/config_' + repoName + '.json');
        const config = JSON.parse(data);
        return config;    
    }
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

