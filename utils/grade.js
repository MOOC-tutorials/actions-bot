const Grade = require('../db/GradeSchema');


exports.register_student = async( examenId, userId, userEmail, serviceUrl, sourceId, activity) =>{
  const grade = new Grade({
    "examenId":examenId,
    "owner":userId,
    "email":userEmail,
    "serviceUrl":serviceUrl, 
    "sourceId":sourceId,
    "activity":activity,
  });
  const att = await grade.save((err) => {
    if(err){
      //context.log("Error creating grade:");
      //context.log(err);
      throw(err);
    }
  });
  //context.log(att);
}

exports.register_grade = async(userEmail, examenId, gradeValue) =>{
  const att = await Grade.findOneAndUpdate({"email": userEmail, "examenId":examenId},{$set:{"grade":0.5}}, {new: true, useFindAndModify: false});
    //context.log(att);
    return att;
}

exports.grading = async (owner, repo, gradeValue, context) => {
    const grade = new Grade({
          owner,
          repo,
          grade: gradeValue
      });
    const att = await grade.save((err) => {
        if(err){
          context.log("Error creating grade:");
          context.log(err);
        }
      });
      context.log(att);
}

exports.checkGrading = async (owner, repo) => {
    return await Grade.countDocuments({owner, repo});
}