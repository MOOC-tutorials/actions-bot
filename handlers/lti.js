const config = require("../config/config-lti");
const CONSUMER_KEY = config.development.key;
const CONSUMER_SECRET = config.development.secret;
const lti = require('ims-lti');
const Promise = require('bluebird');
const {registerStudent} = require('../utils/grade');
const {registerGrade} = require('../utils/grade');

/**
 * Valida el request https que llega de Coursera (parámetros, signatura y que no se haya procesado antes)
 * Genera un registro del usuario, para su posterior calificación.
 */
exports.registerCourseraActivity = (req) => {
  return new Promise(function(resolve, reject) {
    let provider = new lti.Provider(CONSUMER_KEY, CONSUMER_SECRET);

    provider.valid_request(req, function(err, is_valid){
      let {body} = req;
      
      if (!is_valid || !provider.outcome_service)
        return reject(new Error("El envío de los parámetros desde Coursera no coincide:" + body));
      
      if (!body.custom_examen)
        return reject(
          new Error(
            "Es necesario indicar el id del examen en los parámetros de personalización de la actividad. Por ejemplo, llave: examen y valor: 1"
          )
        );

      let activity = body.resource_link_title;
      let nombre = body.lis_person_name_full;
      let userId = body.user_id;
      let userEmail = body.lis_person_contact_email_primary;
      let examenId = body.custom_examen;
      let serviceUrl = body.lis_outcome_service_url;
      let sourcedId = body.lis_result_sourcedid;
      registerStudent(examenId, userId, userEmail, serviceUrl, sourcedId, activity);
      
      const respuestaExamen = {
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
};

exports.sendResultToCoursera = async (userEmail, examenId, grade) => {
    return new Promise(function (resolve, reject) {
        const provider = new lti.Provider(CONSUMER_KEY, CONSUMER_SECRET);
        // TODO: Use await/async instead of blue-bird promises?
        registerGrade(userEmail, examenId, grade).then((outcome) => {
          provider.parse_request(null,
            {lis_outcome_service_url: outcome.serviceUrl,
              lis_result_sourcedid: outcome.sourceId});

          provider.outcome_service.send_replace_result(grade, (err, result) => {
                  if (err) return reject(err);
                  resolve(outcome);
              });
        }).catch((err)=>{
          reject(err);
        });
    });
};
