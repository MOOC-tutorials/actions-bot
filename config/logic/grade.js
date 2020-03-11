// const {grading} = require('../../utils/grade');
const {checkAttempts, deleteAttempts} = require('../../utils/attempt');
const lti = require('../../handlers/lti');


exports.exerciseGrade = async (data, context) => {
  const api = context.github;
  const {owner, repo} = context.repo();
  const {repository} = context.payload;
  const {email} = repository.owner;

  let gradeValue = 0;
  let totalGrade = 0;
  for (let index = 0; index < data.length; index++) {
    const {title, totalPoints} = data[index];
    let occurrences = await checkAttempts(title, email, repo);
    context.log(title, email, occurrences);

    if(totalPoints < 0){
      // Negative total points - removes points for each occurence
      gradeValue += totalPoints * occurrences;
    } else if (occurrences > 0) {
      totalGrade += totalPoints
      gradeValue += totalPoints / occurrences;
    } else {
      throw 'Hubo criterios en los que no se hicieron intentos por parte del estudiante. '+
            'Es probable que haya un error en la definición de los criterios.';
    }
  };
  
  //const grade = await grading(owner, repo, gradeValue, context);
  gradeValue = (gradeValue < 0)?  0.0 : gradeValue;

  context.log("Sending the grade for ", owner, email, repo, gradeValue);

  const result = await lti.sendResultToCoursera(email, repo, gradeValue).catch((err)=>{
    context.log("Error sending result:");
    context.log(err);
  });

  context.log("This is the result: ", result);

  await deleteAttempts(context, owner, repo, email);

  // TODO: Check issue comment creation/undefined issues var?
  const {issues} = await api.issues.listForRepo({owner, repo, state: 'open'});
  context.log(issues);
  if(issues && issues.length > 0){
    gradeValue = gradeValue * 100;
    totalGrade = totalGrade * 100;
    const body = '@' + owner + ' la calificación obtenida fue: `'+ gradeValue.toFixed(2) +'/'+ totalGrade.toFixed(2) +'`';
    const {number} = issues[0];
    await api.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body
    });
    context.log('Grade Comment created - Issue: ' + number);
  } else {
    gradeValue = gradeValue * 100;
    totalGrade = totalGrade * 100;
    const body = '@' + owner + ' la calificación obtenida fue: `'+ gradeValue +'/'+ totalGrade +'`';
    const title = 'Calificación'
    const issue = await api.issues.create({
          owner,
          repo,title,
          body,
          assignees: [owner]
        });
    context.log('Grade Issue created - Issue: ' + issue.number);
  }
};