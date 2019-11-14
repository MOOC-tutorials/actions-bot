const {getConfig} = require('../config/config');

exports.getCommitter = (repoName) => {
  const {users} = getConfig(repoName); 
  return users[Math.floor((Math.random()*users.length))];
} 