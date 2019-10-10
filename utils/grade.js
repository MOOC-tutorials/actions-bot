const mongoose = require('mongoose')

const mongoUri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/static-web-tutorial`

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const Attempt = require('../db/AttemptSchema');

exports.addAttempt = async function(context, owner, repo, title){
    const attempt = new Attempt({
        owner,
        repo,
        title
    });
    const att = await attempt.save();
    context.log(att);
};

exports.grade = function(context){
    //TODO: set grade
};