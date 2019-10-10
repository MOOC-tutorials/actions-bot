const {getConfig} = require('../config/config');

exports.getCommitter = function (repoName) {
  const {users} = getConfig(repoName); 
  return users[Math.floor((Math.random()*users.length))];
} 