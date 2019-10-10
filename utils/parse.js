exports.parseDiff = function(diff){
  let diffMessage = '';
  diff.forEach(function(file){
    diffMessage += '**' + file.filename + ':**\n' + file.patch + '\n\n';
  })
  return diffMessage;
}

exports.prettifyJson = function(json){
  //TODO: create template for valid changes
}
