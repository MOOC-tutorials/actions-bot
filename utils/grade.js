const mongoose = require('mongoose')

const mongoUri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/static-web-tutorial`

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

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