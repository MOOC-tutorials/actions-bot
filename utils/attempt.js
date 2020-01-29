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
    context.log("Attempt recorded");
};

exports.checkAttempts = async (title, owner, repo) => {
    const occurrences = await Attempt.countDocuments({title, owner, repo});
    return occurrences;
}