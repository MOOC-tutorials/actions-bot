const Attempt = require('../db/AttemptSchema');

exports.addAttempt = async (context, owner, repo, email, title) => {
    const attempt = new Attempt({
        owner,
        repo,
        email,
        title
    });
    const att = await attempt.save();
    context.log("Attempt recorded:");
    context.log(att);
};

exports.checkAttempts = async (title, email, repo) => {
    const occurrences = await Attempt.countDocuments({title, email, repo});
    return occurrences;
}

exports.deleteAttempts = async (context, owner, repo, email) => {
    const deletedAttempts = await Attempt.deleteMany({owner, repo, email});
    context.log(deletedAttempts);
}
