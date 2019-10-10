const {handlePush} = require('./handlers/push');
const {handleInstallation} = require('./handlers/installation');

module.exports = function (robot) {
  robot.on('push', handlePush.bind(null, robot));
  robot.on('installation_repositories', handleInstallation.bind(null, robot));
};
