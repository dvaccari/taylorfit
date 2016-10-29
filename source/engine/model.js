
const math      = require('mathjs');
const lstsq     = require('./lstsq');
const polyTerms = require('./genPolyTerms');

const _weights  = Symbol('weights');
const _data     = Symbol('data');
const _terms    = Symbol('terms');
const _degree   = Symbol('degree');
const _headers  = Symbol('degree');

class Model {

  constructor(X, y, degree, headers=null) {
    this[_headers]  = headers;
    this[_degree]   = degree;
    this[_terms]    = polyTerms.getTerms(X.size()[1], degree);
    this[_data]     = polyTerms.createPolyMatrix(this[_terms], X);
    this[_weights]  = lstsq(this[_data], y);

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
    var augmentedVector = polyTerms.createPolyMatrix(this[_terms], vector);
    return math.dot(this[_weights], math.squeeze(augmentedVector));
  }

  get data() {
    return this[_data];
  }

  get weights() {
    return this[_weights];
  }

  toJSON() {
    return {
      headers : this[_headers].toArray(),
      weights : this[_weights].toArray(),
      terms   : this[_terms].toArray(),
      degree  : this[_degree]
    };
  }

}

module.exports = Model;

