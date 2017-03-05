/*global onmessage, postMessage*/
'use strict';

const Model = require('../model/model2');
const m     = new Model();

/**
 * Updates the model in various ways depending on what's given.
 *
 * NOTE: Some the parameters are *REQUIRED* (non-bracketed). These must
 * be given in every call to this function.
 *
 * @param {number[][]}       [data.model] See Model.constructor (arg X)
 * @param {number[]}       data.exponents See Model.constructor
 * @param {number}     data.multiplicands See Model.constructor
 * @param {number}         data.dependent Column index of dependent variable
 * @param {[number, number[]]} [data.row] Pair of (index, [number]) specifying
 *                                        the row index to replace and the data
 *                                        that replaces it
 * @param {[number, number[]]} [data.col] Pair of (index, [number]) specifying
 *                                        the col index to replace and the data
 *                                        that replaces it
 * @param {[numr, num, num]}  [data.item] Triple of (row, col, value) that
 *                                        specify a location and value to
 *                                        replace
 */
/*
var updateModel = function (data) {
  var dataset       = data.dataset || (model && model.X) || cache.dataset
    , existingTerms = (model && model.terms.map((t) => t.term)) || []
    , dependent     = (data.dependent != null) ? data.dependent : cache.dependent
    , exponents     = data.exponents || cache.exponents
    , multiplicands = data.multiplicands || cache.multiplicands
    , row           = data.row
    , col           = data.col
    , item          = data.item
    , i;

  log('mults ' + multiplicands);

  if (dataset == null) {
    throw new TypeError('dataset must be specified');
  }
  if (dependent == null) {
    throw new TypeError('dependent must be specified');
  }
  if (exponents == null) {
    throw new TypeError('exponents must be specified');
  }
  if (multiplicands == null) {
    throw new TypeError('multiplicands must be specified');
  }

  // Replace the row if requested
  if (row != null) {
    dataset.row(row[0], row[1]);
  }

  // Replace the col if requested
  if (col != null) {
    dataset.col(col[0], col[1]);
  }

  // Replace all items requested
  if (item != null) {
    item.forEach((it) => {
      dataset.set(it[0], it[1], it[2]);
    });
  }

  // Reinstantiate the model
  m = engine.model(dataset, dependent, exponents, multiplicands);
  existingTerms.forEach((term) => model.addTerm(term));

  return model;
};
 */


/**
 * Takes the computed candidate terms produced by the model and formats them to
 * conform to the data contract (what the client is expecting).
 *
 * Input:
 * [
 *   {
 *     term: [ [col, exp], [col, exp], ... ],
 *     stats: { t: 0.12, mse: 0.45 }
 *   },
 *   ...
 * ]
 *
 *
 * Output:
 * [
 *   [ col, exp, col, exp, ..., tstat: 0.12, mse: 0.25 ], // candidate term 0
 *   [ col, exp, col, exp, ..., tstat: 0.02, mse: 0.45 ], // candidate term 1
 *   ...
 * ]
 *
 * @param candidates See 'Input' above
 * @return See 'Output' above
 */
var formatCandidates = function (candidates) {
  return candidates.map((candidate) => {
    var newCandidate = [];

    candidate.term.forEach(
      (multiplicand) => newCandidate.push(multiplicand[0], multiplicand[1])
    );
    newCandidate.t = candidate.stats.t;
    newCandidate.mse = candidate.stats.mse;

    return newCandidate;
  });
};


var log = function () {
  console.debug('[Engine]:', ...arguments);
};

onmessage = function (e) {
  var type = e.data.type
    , data = e.data.data;

  log(e.data);

  switch(type) {

  case 'update':
    //updateCache(data);
    //updateModel(data);
    if (data.dataset != null) {
      m.setData(data.dataset);
    }
    if (data.exponents != null) {
      m.setExponents(data.exponents);
    }
    if (data.multiplicands != null) {
      m.setMultiplicands(data.multiplicands);
    }
    if (data.dependent != null) {
      m.setDependent(data.dependent);
    }
    if (data.lags != null) {
      m.setLags(data.lags);
    }

    postMessage({
      type: 'candidates',
      data: m.getCandidates()
    });
    break;

  case 'get_terms':
    postMessage({
      type: 'candidates',
      data: m.getCandidates()
    });
    break;

  case 'add_term':
    m.addTerm(data);

    postMessage({
      type: 'candidates',
      data: m.getCandidates()
    });
    postMessage({
      type: 'model',
      data: m.getModel()
    });
    break;

  case 'remove_term':
    m.removeTerm(data);
    // This should also eventually send candidates and model
    postMessage({
      type: 'candidates',
      data: m.getCandidates()
    });
    postMessage({
      type: 'model',
      data: m.getModel()
    });
    break;

  default:
    postMessage({ type: 'error', data: 'Invalid type: ' + type });

  }
};
