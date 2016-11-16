/*global onmessage, postMessage*/

var engine  = require('../engine/index.es6');
var model   = null;

onmessage = function (e) {
  switch(e.data.type) {

  case 'new_model':
    var data          = e.data.data
      , indepCol      = e.data.indepCol
      , exponents     = e.data.exponents
      , multiplicands = e.data.multiplicands;
    model = engine.model(data, indepCol, exponents, multiplicands);
    break;

  case 'get_terms':
    if (model == null) {
      postMessage({ type: 'error', message: 'Model not instantiated' });
    }
    var terms = model.candidates.map((term) => term.term);
    postMessage({ type: 'candidates', candidates: terms });

  case 'add_term':
    if (model == null) {
      postMessage({ type: 'error', message: 'Model not instantiated' });
    }
    model.addTerm(e.data.term, false);
    var results = model.compute();
    results.type = 'result';
    postMessage(results);
    break;

  case 'remove_term':
    if (model == null) {
      postMessage({ type: 'error', message: 'Model not instantiated' });
    }
    model.removeTerm(e.data.term);
    break;

  default:
    postMessage({ type: 'error', message: 'Invalid type: ' + e.data.type });

  }
};
