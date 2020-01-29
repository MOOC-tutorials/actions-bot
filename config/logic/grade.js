const {grading} = require('../../utils/grade');
const {checkAttempts} = require('../../utils/attempt');

exports.exerciseGrade = async (data, context) => {
  const api = context.github;
  const {owner, repo} = context.repo();
  let gradeValue = 0;
  let totalGrade = 0;
  for (let index = 0; index < data.length; index++) {
    const {title, totalPoints} = data[index];
    let occurrences = await checkAttempts(title, owner, repo);
    context.log(occurrences);
    if(totalPoints < 0){
      gradeValue += totalPoints * occurrences;
    } else if (occurrences > 0) {
      totalGrade += totalPoints
      gradeValue += totalPoints / occurrences;
    } else {
      throw 'Hubo criterios en los que no se hicieron intentos por parte del estudiante. '+
            'Es probable que haya un error en la definición de los criterios.';
    }
  }
  context.log(gradeValue);
  const grade = await grading(owner, repo, gradeValue, context);
  context.log(grade);
  const {issues} = await api.issues.listForRepo({owner, repo, state: 'open'});
  context.log(issues);
  if(issues && issues.length > 0){
    const body = '@'+ owner + ' la calificación obtenida fue: `'+ gradeValue +'/'+ totalGrade +'`';
    const {number} = issues[0]
    await api.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body
    });
    context.log('Grade Comment created - Issue: ' + number);
  } else {
    const body = '@'+ owner + ' la calificación obtenida fue: `'+ gradeValue +'/'+ totalGrade +'`';
    const title = 'Calificación'
    const {number} = await api.issues.create({
          owner,
          repo,title,
          body,
          assignees: [owner]
        });
    context.log('Grade Issue created - Issue: ' + number);
  }
};