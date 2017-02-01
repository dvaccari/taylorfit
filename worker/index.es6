/*global onmessage, postMessage*/

var engine  = require('../engine/index.es6');
var model   = null;


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
var updateModel = function (data) {
  var dataset       = data.model || (model && model.X)
    , existingTerms = (model && model.terms.map((t) => t.term)) || []
    , dependent     = data.dependent
    , exponents     = data.exponents
    , multiplicands = data.multiplicands
    , row           = data.row
    , col           = data.col
    , item          = data.item
    , i;

  if (dataset == null) {
    throw new TypeError('model must be specified');
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
  model = engine.model(dataset, dependent, exponents, multiplicands);
  existingTerms.forEach((term) => model.addTerm(term));

  return model;
};


function log() {
  console.debug('[Engine]:', ...arguments);
}

onmessage = function (e) {
  var type = e.data.type
    , data = e.data.data;

  log(e.data);

  switch(type) {

  case 'update_model':
    updateModel(data);
    log('new model:', model);
    break;

  case 'get_terms':
    if (model == null) {
      postMessage({ type: 'error', data: 'Model not instantiated' });
    }
    var terms = model.candidates.map((term) => term.term);
    postMessage({ type: 'candidates', data: terms });
    break;

  case 'add_term':
    if (model == null) {
      postMessage({ type: 'error', data: 'Model not instantiated' });
    }
    model.addTerm(data, false);
    postMessage({ type: 'candidates', data: model.compute() });
    break;

  case 'remove_term':
    if (model == null) {
      postMessage({ type: 'error', data: 'Model not instantiated' });
    }
    model.removeTerm(data, false);
    postMessage({ type: 'candidates', data: model.compute() });
    break;

  default:
    postMessage({ type: 'error', data: 'Invalid type: ' + type });

  }
};
