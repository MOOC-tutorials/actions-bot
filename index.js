const {handlePush} = require('./handlers/push');
const {handleInstallation} = require('./handlers/installation');
const {handleRepository} = require('./handlers/repository');
const mongoose = require('mongoose')

const mongoUri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`;

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

module.exports = function (robot) {
  robot.on('push', handlePush.bind(null, robot));
  robot.on('installation_repositories', handleInstallation.bind(null, robot));
  robot.on('installation', handleInstallation.bind(null, robot));
  robot.on('repository', handleRepository.bind(null, robot));  
};
