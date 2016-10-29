
const math = require('mathjs');
const Model = require('./model');

function combinations(terms, k, replacement) {
  var combos = [];
  var i, j;

  if (k < 1) {
    return combos;
  }
  if (k === 1) {
    return terms.map((term) => [term]);
  }

  for (i = 0; i <= k; i += 1) {
    var subCombos = combinations(
      // with replacements    => slice at i (include the current term)
      // without replacements => slice at i + 1 (exclude current term)
      terms.slice(i + !replacement),
      k - 1,
      replacement
    );
    // prepend the current term to each sub combo
    combos = combos.concat(subCombos.map((combo) => [terms[i]].concat(combo)));
  }
  return combos;
}

function getAllPolyTerms(features, degree) {
  return [].concat.apply(
    [],
    math
      .range(1, degree + 1)
      .map((d) => {
        return combinations(
          math.range(0, features).toArray(),
          d,
          true
        );
      }).toArray()
  );
}

function createPolyMatrix(terms, data) {
  var rows = data.size()[0];
  var augmentedData = math.matrix().resize([rows, 0]);

  terms.forEach((term) => {
    var newColumn = term.reduce((prev, curr) => {
      var index = math.index(math.range(0, rows), curr);
      var currColumn = math.subset(data, index);
      if (typeof currColumn === 'number') {
        currColumn = [[currColumn]];
      }
      return math.dotMultiply(prev, currColumn);
    }, math.ones([data.size()[0], 1]));
    //console.log(newColumn);
    augmentedData = math.concat(augmentedData, newColumn);
  });

  return augmentedData;
}

module.exports.getTerms = getAllPolyTerms;
module.exports.createPolyMatrix = createPolyMatrix;
module.exports.combinations = combinations;

