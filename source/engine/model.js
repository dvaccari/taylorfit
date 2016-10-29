
const math          = require('mathjs');
const lstsq         = require('./lstsq');
const combos        = require('./combos');

const _weights      = Symbol('weights');
const _data         = Symbol('data');
const _terms        = Symbol('terms');
const _exponents    = Symbol('exponents');
const _multipliers  = Symbol('multipliers');
const _headers      = Symbol('headers');

class Model {

  constructor(X, y, exponents, multipliers, headers=null) {
    this[_headers] = headers;
    this[_exponents] = exponents;
    this[_multipliers] = multipliers;
    this[_terms] = combos.generateTerms(X.size()[1], exponents, multipliers);
    this[_data] = combos.createPolyMatrix(this[_terms], X);
    this[_weights] = lstsq(this[_data], y);

    console.log(this[_data]);
    console.log(this[_terms]);
    console.log(this[_weights]);
  }

  weight(i) {
    return this[_weights][i];
    }

  term(i) {
    return this[_terms][i];
  }

  row(i) {
    var cols = this[_data].size()[1];
    return this[_data].subset(math.index(i, math.range(0, cols)));
  }

  col(i) {
    var rows = this[_data].size()[0];
    return this[_data].subset(math.index(math.range(0, rows), i));
  }

  predict(vector) {
    vector = math.matrix([vector]);
    var augmentedVector = combos.createPolyMatrix(this[_terms], vector);
    return math.dot(this[_weights], math.squeeze(augmentedVector));
  }

  get data() {
    return this[_data];
  }

  get weights() {
    return this[_weights];
  }

  get terms() {
    return this[_terms];
  }

  toJSON() {
    return {
      headers     : this[_headers].toArray(),
      weights     : this[_weights].toArray(),
      terms       : this[_terms].toArray(),
      exponents   : this[_exponents],
      multipliers : this[_multipliers]
    };
  }

}

module.exports = Model;

