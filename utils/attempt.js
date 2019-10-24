const mongoose = require('mongoose')

const mongoUri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/static-web-tutorial`

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const Attempt = require('../db/AttemptSchema');

exports.addAttempt = async (context, owner, repo, title) => {
    const attempt = new Attempt({
        owner,
        repo,
        title
    });
    const att = await attempt.save((err) => {
      if(err) context.log(err);
    });
    context.log(att);
};

exports.checkAttempts = async (title, owner, repo) => {
    const occurrences = await Attempt.countDocuments({title, owner, repo});
    return occurrences;
}