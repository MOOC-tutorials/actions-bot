exports.parseDiff = function(diff){
  let diffMessage = '';
  diff.forEach(function(file){
    diffMessage += '**' + file.filename + ':**\n' + file.patch + '\n\n';
  })
  return diffMessage;
}

exports.prettifyJson = function(json, raw){
  let pretty = '';
  if(!raw){
    for (const [key, element] of Object.entries(json)) {
      const {filename, expectedValues} = element;
      pretty += '### ' + filename + ':\n';
      expectedValues.forEach((expected) => {
      const {attribute, value, querySelector} = expected;
        pretty += '- El elemento con id `' + querySelector 
                  + '`, en el atributo `' + attribute + '` debería tener como valor ``' + value + '``\n';
      });
    }
  } else {
      pretty = '```json\n' + JSON.stringify(json, null, '\t') + '\n```';    
  }
  return pretty;
}
