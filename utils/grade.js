const Grade = require('../db/GradeSchema');

exports.registerStudent = async( examenId, userId, userEmail, serviceUrl, sourceId, activity) =>{
  const grade = new Grade({
    examenId,
    repo: examenId,
    owner: userId,
    email: userEmail,
    serviceUrl,
    sourceId,
    activity,
    grade:0,
  });
  const createdGrade = await grade.save();
  console.log(createdGrade);
}

exports.registerGrade = async(userEmail, examenId, gradeValue) =>{
  examenId = examenId.startsWith("prueba_carga")? "prueba_carga": examenId;
  const registeredGrade = await Grade.findOneAndUpdate(
    {email: userEmail, examenId},
    {$set: {grade: gradeValue}},
    {new: true, useFindAndModify: false, sort: {createdAt: -1}});
  return registeredGrade;
}

// exports.grading = async (owner, repo, gradeValue, context) => {
//     const grade = new Grade({
//           owner,
//           repo,
//           grade: gradeValue
//       });
//     const att = await grade.save((err) => {
//         if(err){
//           context.log("Error creating grade:");
//           context.log(err);
//         }
//       });
//       context.log(att);
// }

exports.checkGrading = async (repo, email) => {
  // TODO: Check if Grade.grade is already set (needed if config doesn't allow multiple attempts)
    return Grade.countDocuments({examenId: repo, email});
};
