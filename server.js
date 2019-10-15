const {handlePush} = require('./handlers/push');
const {handleInstallation} = require('./handlers/installation');
const {handleRepository} = require('./handlers/repository');

module.exports = function (robot) {
  robot.on('push', handlePush.bind(null, robot));
  robot.on('installation_repositories', handleInstallation.bind(null, robot));
  robot.on('installation', handleInstallation.bind(null, robot));
  robot.on('repository', handleRepository.bind(null, robot));  
};
