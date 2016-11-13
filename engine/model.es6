
const math          = require('./math.es6');
const stats         = require('./stats.es6');
const combos        = require('./combos.es6');

const Term          = require('./term.es6');

const _weights      = Symbol('weights');
const _Xaugmented   = Symbol('Xaugmented');
const _terms        = Symbol('terms');
const _exponents    = Symbol('exponents');
const _multipliers  = Symbol('multipliers');
const _headers      = Symbol('headers');
const _X            = Symbol('X');
const _y            = Symbol('y');
const _candyTerms   = Symbol('candidateTerms');

class Model {

  constructor(X, y, exponents, multipliers, terms=null, headers=null) {
    this[_X] = X;
    this[_y] = y;
    this[_headers] = headers;

    this[_terms] = terms || [];
    this[_Xaugmented] = X;
    this[_weights] = [];

    this[_candyTerms] = combos
      .generateTerms(X.size()[1], exponents, multipliers)
      .map((term) => new Term(term, this));

    if (terms != null) {
      this.compute();
    }
  }

  weight(i) {
    return this[_weights][i];
  }

  term(i) {
    return this[_terms][i];
  }

  addTerm(term, recompute=true) {
    if (!Array.isArray(term)) {
      throw new TypeError('Expected an array of [col, exp] pairs');
    }

    term.forEach((pair) => {
      var size = math.size(pair);

      if (size.length !== 1 && size[0] !== 2) {
        throw new math.error.DimensionError(size, [2], '!=');
      }
    });

    var found = this[_terms].find((existingTerm) => {
      return existingTerm.length === term.length &&
        math.sum(math.equal(existingTerm, term)) === 2*term.length;
    });

    if (found) {
      return this[_terms];
    }

    this[_terms].push(term);

    if (recompute) {
      this.compute();
    }
    return this[_terms];
  }

  removeTerm(termToRemove, recompute=true) {
    this[_terms] = this[_terms].filter((term) => {
      return term.length !== termToRemove.length ||
        math.sum(math.equal(term, termToRemove)) !== 2*term.length;
    });

    if (recompute) {
      if (this[_terms].length > 0) {
        this.compute();
      } else {
        this[_Xaugmented] = this[_X];
        this[_weights] = [];
      }
    }
    return this[_terms];
  }

  compute() {
    this[_Xaugmented] = combos.createPolyMatrix(this[_terms], this[_X]);
    var things = stats.lstsqWithStats(this[_Xaugmented], this[_y]);
    this[_weights] = things.weights;

    /*
    var candidateTerms = this[_candyTerms].map((term) => ({
      term : JSON.stringify(term.term),
      stuff: term.getStats()
    }));

     */
    return {
      model: {
        weights: this[_weights].toArray(),
        tstats: things.tstats.toArray(),
        terms: this[_terms]
      }
      //potential: candidateTerms
    };
  }

  row(i) {
    var cols = this[_Xaugmented].size()[1];
    return this[_Xaugmented].subset(math.index(i, math.range(0, cols)));
  }

  col(i) {
    var rows = this[_Xaugmented].size()[0];
    return this[_Xaugmented].subset(math.index(math.range(0, rows), i));
  }

  predict(vector) {
    vector = math.matrix([vector]);
    var augmentedVector = combos.createPolyMatrix(this[_terms], vector);
    return math.dot(this[_weights], math.squeeze(augmentedVector));
  }

  get X() {
    return this[_X];
  }

  get y() {
    return this[_y];
  }

  get data() {
    return this[_Xaugmented];
  }

  get weights() {
    return this[_weights];
  }

  get terms() {
    return this[_terms];
  }

  get candidates () {
    return this[_candyTerms];
  }

  toJSON() {
    return {
      headers     : this[_headers],
      weights     : this[_weights].toArray(),
      terms       : this[_terms]
    };
  }

}

module.exports = Model;
