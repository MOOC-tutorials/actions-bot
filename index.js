const {handlePush} = require('./handlers/push');
const {handleInstallation} = require('./handlers/installation');
const {handleRepository} = require('./handlers/repository');
const mongoose = require('mongoose');
const {createProbot} = require('probot');
const bodyParser = require('body-parser');
const lti = require('./handlers/lti');
const {register_grade} = require('./utils/grade')

const probot = createProbot({
  id: process.env.APP_ID,
  port: process.env.PORT || 3000,
  secret: process.env.WEBHOOK_SECRET,
  cert: process.env.PRIVATE_KEY
})

const mongoUri = (process.env.DB_USER) ? `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`: `mongodb://${process.env.DB_HOST}/${process.env.DB_NAME}`;

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    poolSize: 10
});
mongoose.set('useCreateIndex', true);

const db = mongoose.connection;
db.on("error", () => {
    console.log("> error occurred from the database");
});
db.once("open", () => {
    console.log("> successfully opened the database");
});

const robot = robot => {
  robot.on('push', handlePush.bind(null, robot));
  robot.on('installation_repositories', handleInstallation.bind(null, robot));
  robot.on('installation', handleInstallation.bind(null, robot));
  robot.on('repository', handleRepository.bind(null, robot));  
   
  const route = robot.route("/probot");
  route.use(bodyParser.urlencoded({extended: false}));
  
route.post('/lti_access', function (req, res, next) {
    //app.log("Coursera response 2 POST:/access/", req.body);
    lti.registrarIngreso(req).then(function (resp) {
        robot.log("LTI PARAMS: ", resp);
        var userId = resp.EstudianteMail;
        var examenId = resp.ExamenId;
        robot.log("USUARIO DE COURSERA ID: ", userId, "INGRESANDO AL EXAMEN", examenId);
        
        var grade= 0.87
        
        res.send("Se envió la nota: "+grade+" del estudiante " + resp.EstudianteMail);
        
        robot.log("Esto tiene la respuesta:" +resp);
        robot.log("Estos son los parámetros:",userId, examenId);

        //var grade = register_grade(userId, examenId, grade).then(function(outcome){
        //               robot.log("Este es el documento con la nota"+outcome);});
       

        lti.sendResultToCoursera(userId, examenId, grade).then(function(outcome){
          robot.log(outcome);
        });
      
    }).catch(next);
});

};

probot.load(robot)
const expressApp = probot.server;
expressApp.enable('trust proxy');


probot.start()
