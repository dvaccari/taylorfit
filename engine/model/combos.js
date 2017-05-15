'use strict';

const utils = require('../utils');

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
    return utils.join(bins).map((term) => [term]);
  }
  for (i = 0; i < bins[0].length; i += 1) {
    var subCombos = combinationsFromBins(bins.slice(1), k - 1);
    combos = combos.concat(subCombos.map((combo) => [bins[0][i]].concat(combo)));
  }
  return combos.concat(combinationsFromBins(bins.slice(1), k));
};

/**
 * Generates all possible combinations of exponentiated terms given a list of
 * exponents, a list of # of multiplicands, and a list of lags
 *
 * @param {number[]}  dep         Dependent column index from the dataset
 * @param {number[]}  indep       Independent column indices from the dataset
 * @param {number[]}  exponents   Array of exponents ([1, 2] means x, x^2)
 * @param {number[]}  multipliers Array of # of multiplicands ([1] means only
 *                                one multiplicand per term)
 * @param {number[]}  lags        Array of lags (similar to exponents)
 * @return {[number, number][][]} List of terms
 */
let generateTerms = function(dep, indep, exponents, multipliers, lags) {
  let bins = indep.map(
    (i) => utils.join(exponents.map(
      (e) => lags.map(
        (l) => [i, e, l]))));

  // Include dependent column, but only with lag > 0
  lags = lags.filter((l) => l > 0);
  bins.unshift(utils.join(exponents.map(
    (e) => lags.map(
      (l) => [dep, e, l]))));

  let combosForMults = utils.join(multipliers.map(
    (m) => combinationsFromBins(bins, m)));

  return combosForMults;
};

module.exports.generateTerms = generateTerms;
module.exports.combinations = combinations;
module.exports.combinationsFromBins = combinationsFromBins;

