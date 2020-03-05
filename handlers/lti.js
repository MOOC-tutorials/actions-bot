var config = require("../config/config-lti");
var consumer_key = config.development.key;
var consumer_secret = config.development.secret;
var lti = require('ims-lti');
var Promise = require('bluebird');
const {register_student} = require('../utils/grade')
const {register_grade} = require('../utils/grade')

//var db = require("../../models");


/**
 * Valida el request https que llega de Coursera (parámetros, signatura y que no se haya procesado antes)
 * Genera un registro del usuario, para su posterior calificación.
 */
function registrarIngreso(req) {
  return new Promise(function(resolve, reject) {
    
    var provider = new lti.Provider(consumer_key, consumer_secret);
    
    
    provider.valid_request(req, function(err, is_valid){
      var body = req.body;
      
      if (!is_valid || !provider.outcome_service) return reject(new Error("El envío de los parámetros desde Coursera no coincide."));

      
      
      if (!body.custom_examen)
        return reject(
          new Error(
            "Es necesario indicar el id del examen en los parámetros de personalización de la actividad. Por ejemplo, llave: examen y valor: 1"
          )
        );

      var activity = body.resource_link_title;
      var nombre = body.lis_person_name_full;
      var userId = body.user_id;
      var userEmail = body.lis_person_contact_email_primary;
      var examenId = body.custom_examen;
      var serviceUrl = body.lis_outcome_service_url;
      var sourcedId = body.lis_result_sourcedid;
      const grade = register_student(examenId, userId, userEmail, serviceUrl, sourcedId, activity);
      
      var respuestaExamen = {
        ExamenId: examenId,
        EstudianteId: userId,
        EstudianteMail: userEmail,
        lis_outcome_service_url: serviceUrl,
        lis_result_sourcedid: sourcedId,
        actividad: activity
      };
      
      resolve(respuestaExamen);
    });
  });
}





function sendResultToCoursera(userEmail, examenId, grade) {



    return new Promise(function (resolve, reject) {
        var provider = new lti.Provider(consumer_key, consumer_secret);

        register_grade(userEmail, examenId, grade).then(function(outcome){


        provider.parse_request(null, {lis_outcome_service_url:outcome.serviceUrl, lis_result_sourcedid:outcome.sourceId});
        provider.outcome_service.send_replace_result(grade, function (err, result) {
            if (err) return reject(err);
            resolve(outcome);
        }
            );
        });
    });
}




module.exports = {
    registrarIngreso: registrarIngreso,
    sendResultToCoursera: sendResultToCoursera
};

