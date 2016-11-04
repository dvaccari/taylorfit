
//const math = require('mathjs');

function combinations(terms, k, replacement) {
  var combos = [];
  var i;

  if (k < 1) {
    return combos;
  }
  if (k === 1) {
    return terms.map((term) => [term]);
  }

  // 1 2 3 4
  // 1 2 3 4
  // 1 1, 1 2, 1 3, 1 4
  // 2 3 4
  // 2 2, 2 3, 2 4
  for (i = 0; i < terms.length; i += 1) {
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

function combinationsFromBins(bins, k) {
  var combos = [];
  var i;

  if (k < 1) {
    return combos;
  }
  if (bins.length <= 0) {
    return combos;
  }
  if (k === 1) {
    return [].concat.apply([], bins).map((term) => [term]);
  }
  for (i = 0; i < bins[0].length; i += 1) {
    var subCombos = combinationsFromBins(bins.slice(1), k - 1);
    combos = combos.concat(subCombos.map((combo) => [bins[0][i]].concat(combo)));
  }
  return combos.concat(combinationsFromBins(bins.slice(1), k));
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
      var index = math.index(math.range(0, rows), curr[0]);
      var currColumn = math.subset(data, index);
      if (typeof currColumn === 'number') {
        currColumn = [[currColumn]];
      }
      return math.dotMultiply(prev, math.dotPow(currColumn, curr[1]));
    }, math.ones([data.size()[0], 1]));
    //console.log(newColumn);
    augmentedData = math.concat(augmentedData, newColumn);
  });

  return augmentedData;
}

function generateTerms(features, exponents, multipliers) {
  var bins = math.range(0, features)
        .toArray()
        .map((index) => exponents.map((e) => [index, e]))

    , combosForMults = multipliers.map((m) => combinationsFromBins(bins, m));

  return [].concat.apply([], combosForMults);
}

module.exports.generateTerms = generateTerms;
module.exports.createPolyMatrix = createPolyMatrix;
module.exports.combinations = combinations;
module.exports.combinationsFromBins = combinationsFromBins;

