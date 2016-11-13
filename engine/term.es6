
const math          = require('./math.es6');
const stats         = require('./stats.es6');
const combos        = require('./combos.es6');

const _weights      = Symbol('weights');
const _Xaugmented   = Symbol('Xaugmented');
const _exponents    = Symbol('exponents');
const _multipliers  = Symbol('multipliers');
const _term         = Symbol('term');
const _model        = Symbol('term');


class Term {

  constructor(term, model) {
    this[_term] = term;
    this[_model] = model;
  }

  getStats() {
    console.time('createPolyMatrix');
    var terms = this[_model].terms.slice().concat([this[_term]])
      , XAugmented = combos.createPolyMatrix(terms, this[_model].X)
      , theStats;
    console.timeEnd('createPolyMatrix');

    try {
      console.time('lstsq');
      theStats = stats.lstsqWithStats(XAugmented, this[_model].y);
      console.timeEnd('lstsq');
      return theStats.tstats.get([theStats.tstats.size()[0] - 1]);
    } catch (e) {
      return '0 determinant';
    }
  }

  get term() {
    return this[_term];
  }

}

module.exports = Term;
