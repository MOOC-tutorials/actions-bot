const Grade = require('../db/GradeSchema');

exports.grading = async (owner, repo, gradeValue, context) => {
    const grade = new Grade({
          owner,
          repo,
          grade: gradeValue
      });
    const att = await grade.save((err) => {
        if(err) context.log(err);
      });
      context.log(att);
}

exports.checkGrading = async (owner, repo) => {
    return await Grade.countDocuments({owner, repo});
}