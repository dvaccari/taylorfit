'use strict';

const utils = require('../utils.es6');

/**
 * Generate all combinations of k terms.
 *
 * @param {*[]}     terms         Array of items to combine
 * @param {number}  k             # of items in every combination
 * @param {boolean} [replacement] If true, an item from `terms` can be repeated
 *                                in a single combination
 */
let combinations = function(terms, k, replacement) {
  var combos = [];
  var i;

  if (k < 1) {
    return combos;
  }
  if (k === 1) {
    return terms.map((term) => [term]);
  }

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
};

/**
 * Generates all combinations of k items using one item from each bin in `bins`.
 *
 *    bins = [[0, 1], [2, 3]], k = 2
 *  ->[[0, 2], [0, 3], [1, 2], [1, 3]]
 *
 *
 * @param {*[][]} bins  An array of arrays containing items. For each
 *                      combination, only one item from each bin can be present
 * @return {*[][]} Combos
 */
let combinationsFromBins = function(bins, k) {
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
};

/**
 * Generates all possible combinations of exponentiated terms given a list of
 * exponents and a list of # of multiplicands
 *
 * @param {number}    features    Number of features in the original dataset
 * @param {number[]}  exponents   Array of exponents ([1, 2] means x, x^2)
 * @param {number[]}  multipliers Array of # of multiplicands ([1] means only
 *                                one multiplicand per term)
 * @return {[number, number][][]} List of terms
 */
let generateTerms = function(features, exponents, multipliers) {
  var bins = utils
        .range(0, features)
        .map((index) => exponents.map((e) => [index, e]))

    , combosForMults = multipliers.map((m) => combinationsFromBins(bins, m));

  return [].concat.apply([], combosForMults);
};

module.exports.generateTerms = generateTerms;
module.exports.combinations = combinations;
module.exports.combinationsFromBins = combinationsFromBins;

