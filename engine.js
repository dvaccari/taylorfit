(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.engine = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var utils = require('./playground/utils.es6');

/**
 * Generate all combinations of k terms.
 *
 * @param {*[]}     terms         Array of items to combine
 * @param {number}  k             # of items in every combination
 * @param {boolean} [replacement] If true, an item from `terms` can be repeated
 *                                in a single combination
 */
var combinations = function combinations(terms, k, replacement) {
  var combos = [];
  var i;

  if (k < 1) {
    return combos;
  }
  if (k === 1) {
    return terms.map(function (term) {
      return [term];
    });
  }

  for (i = 0; i < terms.length; i += 1) {
    var subCombos = combinations(
    // with replacements    => slice at i (include the current term)
    // without replacements => slice at i + 1 (exclude current term)
    terms.slice(i + !replacement), k - 1, replacement);
    // prepend the current term to each sub combo
    combos = combos.concat(subCombos.map(function (combo) {
      return [terms[i]].concat(combo);
    }));
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
var combinationsFromBins = function combinationsFromBins(bins, k) {
  var combos = [];
  var i;

  if (k < 1) {
    return combos;
  }
  if (bins.length <= 0) {
    return combos;
  }
  if (k === 1) {
    return [].concat.apply([], bins).map(function (term) {
      return [term];
    });
  }
  for (i = 0; i < bins[0].length; i += 1) {
    var subCombos = combinationsFromBins(bins.slice(1), k - 1);
    combos = combos.concat(subCombos.map(function (combo) {
      return [bins[0][i]].concat(combo);
    }));
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
var generateTerms = function generateTerms(features, exponents, multipliers) {
  var bins = utils.range(0, features).map(function (index) {
    return exponents.map(function (e) {
      return [index, e];
    });
  }),
      combosForMults = multipliers.map(function (m) {
    return combinationsFromBins(bins, m);
  });

  return [].concat.apply([], combosForMults);
};

module.exports.generateTerms = generateTerms;
module.exports.combinations = combinations;
module.exports.combinationsFromBins = combinationsFromBins;

},{"./playground/utils.es6":5}],2:[function(require,module,exports){
'use strict';

var Model = require('./model.es6');
var utils = require('./playground/utils.es6');
var Matrix = require('./playground/matrix.es6');
var combos = require('./combos.es6');

// TODO: replace input to model() with object per data contract once it is
//       finalized

module.exports.model = function (data, indepCol, exponents, multipliers) {
  indepCol = indepCol || data.size()[1] - 1;
  data = new Matrix(data);

  var inputColumns = data.subset(':', utils.range(0, indepCol).concat(utils.range(indepCol + 1, data.shape[1]))),
      outputColumn = data.col(indepCol);

  return new Model(inputColumns, outputColumn, exponents, multipliers);
};

},{"./combos.es6":1,"./model.es6":3,"./playground/matrix.es6":4,"./playground/utils.es6":5}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var stats = require('./stats.es6');
var combos = require('./combos.es6');

var Term = require('./term.es6');
var Matrix = require('./playground/matrix.es6');

/**
 * Private members
 *
 * @private
 */
var _weights = Symbol('weights');
var _Xaugmented = Symbol('Xaugmented');
var _terms = Symbol('terms');
var _exponents = Symbol('exponents');
var _multipliers = Symbol('multipliers');
var _headers = Symbol('headers');
var _X = Symbol('X');
var _y = Symbol('y');
var _candyTerms = Symbol('candidateTerms');
var _means = Symbol('means');
var _variances = Symbol('variances');

function standardize(X) {
  var stand = X.clone(),
      n = stand.shape[0],
      m = stand.shape[1],
      vars = [],
      means = [],
      i,
      j,
      mean,
      variance;

  for (i = 0; i < m; i += 1) {
    for (mean = 0, j = 0; j < n; j += 1) {
      mean += stand.data[j * m + i];
    }
    mean /= n;
    for (variance = 0, j = 0; j < n; j += 1) {
      variance += Math.pow(stand.data[j * m + i] - mean, 2);
    }
    variance /= n;
    for (j = 0; j < n; j += 1) {
      stand.data[j * m + i] = (stand.data[j * m + i] - mean) / variance;
    }
    vars.push(variance);
    means.push(mean);
  }

  return {
    X: stand,
    means: means,
    vars: vars
  };
}

/**
 * Representation of a predictive model using multivariate polynomial
 * regression.
 *
 * The model uses least-squares regression on a set of polynomial terms to
 * approximate data. The model is bounded by a set of exponents and set of # of
 * multiplicands, which limits the number of candidate terms for the model.
 *
 * NOTE: Each time a term is added or removed from the initially nil model, all
 * candidate terms need to be re-evaluated. For this reason, efficiency is a
 * primary concern here.
 *
 * @class Model
 */

var Model = function () {

  /**
   * Craft a new model from an input feature matrix X, an actual value
   * column y, a list of exponents, and a list of # of multiplicands.
   *
   * @constructor
   * @param {Matrix<n,m>} X           The input feature set, where each column
   *                                  is a feature and each row is an
   *                                  observation
   * @param {Matrix<n,1>} y           The true values for each observation
   * @param {number[]}    exponents   List of exponents that a column can be
   *                                  raised to
   * @param {number[]}    multipliers List of # of multiplicands for each term,
   *                                  for instance [1] means only the individual
   *                                  columns can be terms (x, y, x^2, y^2, ...)
   */
  function Model(X, y) {
    var exponents = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [1];
    var multipliers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [1];

    var _this = this;

    var terms = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
    var headers = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;

    _classCallCheck(this, Model);

    //var standardizedX = standardize(X);
    this[_X] = X; //standardizedX.X;
    //this[_means] = standardizedX.means;
    //this[_variances] = standardizedX.vars;
    this[_y] = y;
    this[_headers] = headers;

    this[_Xaugmented] = new Matrix(X.shape[0], 0);
    this[_weights] = [];

    this[_candyTerms] = combos.generateTerms(X.shape[1], exponents, multipliers).map(function (term) {
      return new Term(term, _this);
    });
    this[_terms] = terms.map(function (pair) {
      return _this[_candyTerms].find(function (term) {
        return term.equals(pair);
      });
    });

    if (terms.length !== 0) {
      this.compute();
    }
  }

  /**
   * Adds a term to the model. A term should either be a Term object, or a list
   * of [column_index, exponent] pairs.
   *
   * Beware: Each time a term is added, every candidate term needs to be
   * recomputed.
   *
   * @param {Term | [number, number][]} term The term to be added to the model
   * @param {boolean} [recompute] Optional flag indicating whether or not to
   *                              recompute the model
   * @return {Term[]} List of current terms in the model
   */


  _createClass(Model, [{
    key: 'addTerm',
    value: function addTerm(term) {
      var recompute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      if (!Array.isArray(term)) {
        throw new TypeError('Expected an array of [col, exp] pairs');
      }

      term.forEach(function (pair) {
        if (!Array.isArray(pair) || pair.length !== 2) {
          throw new TypeError('Invalid [col, exp] pair: ' + JSON.stringify(pair));
        }
      });

      var found = this[_terms].find(function (existingTerm) {
        return existingTerm.equals(term);
      });

      if (found) {
        return this[_terms];
      }

      found = this[_candyTerms].find(function (candyTerm) {
        return candyTerm.equals(term);
      });

      this[_terms].push(found);

      if (recompute) {
        this.compute();
      }
      return this[_terms];
    }

    /**
     * Removes a term from the model. A term should either be a Term object, or a
     * list of [column_index, exponent] pairs.
     *
     * Beware: Each time a term is removed, every candidate term needs to be
     * recomputed.
     *
     * @param {Term | [number, number][]} term The term to be added to the model
     * @param {boolean} [recompute] Optional flag indicating whether or not to
     *                              recompute the model
     * @return {Term[]} List of current terms in the model
     */

  }, {
    key: 'removeTerm',
    value: function removeTerm(termToRemove) {
      var recompute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      this[_terms] = this[_terms].filter(function (term) {
        return !term.equals(termToRemove);
      });

      if (recompute) {
        this.compute();
      }
      return this[_terms];
    }

    /**
     * Computes least squares regression and analytical statistics on the model as
     * well as all of the candidate terms. This might take a little while,
     * depending on how big the data are.
     *
     * @return {TODO: something per data contract} Regression and analytical
     *    results
     */

  }, {
    key: 'compute',
    value: function compute() {
      this[_Xaugmented] = this[_terms].map(function (term) {
        return term.col;
      }).reduce(function (prev, curr) {
        return prev.hstack(curr);
      }, new Matrix(this[_X].shape[0], 0));

      var things = stats.lstsqWithStats(this[_Xaugmented], this[_y]);
      this[_weights] = things.weights;

      var candidateTerms = this[_candyTerms].map(function (term) {
        return {
          term: term.term,
          stats: term.getStats()
        };
      });

      return {
        model: {
          weights: this[_weights].data,
          tstats: things.tstats.data,
          terms: this[_terms].map(function (t) {
            return t.term;
          })
        },
        candidates: candidateTerms
      };
    }

    /**
     * Make a prediction based on the values for each feature given in `testData`.
     *
     * @param {Matrix<k,m>} testData A set of observations for each feature (a
     *                               matrix with the same # of columns as
     *                               `this[_X]`, but as many rows as your heart
     *                               desires)
     * @return {Matrix<k,1>} Predictions
     */

  }, {
    key: 'predict',
    value: function predict(testData) {
      testData = Matrix.from(testData);
      testData = this[_terms].map(function (term) {
        return term.computeColumn(testData);
      }).reduce(function (prev, curr) {
        return prev.hstack(curr);
      }, new Matrix(testData.shape[0], 0));
      return testData.multiply(Matrix.from(this[_weights]).T);
    }

    /**
     * The input feature matrix.
     *
     * @property {Matrix} X
     */

  }, {
    key: 'toJSON',


    /**
     * Serializes the model for later use.
     *
     * @return {TODO: something per data contract}
     */
    value: function toJSON() {
      return {
        headers: this[_headers],
        weights: this[_weights].toArray(),
        terms: this[_terms]
      };
    }
  }, {
    key: 'X',
    get: function get() {
      return this[_X];
    }

    /**
     * The given training values.
     *
     * @property {Matrix} y
     */

  }, {
    key: 'y',
    get: function get() {
      return this[_y];
    }

    /**
     * Current matrix, whose columns reflect the terms in the model.
     *
     * @property {Matrix} data
     */

  }, {
    key: 'data',
    get: function get() {
      return this[_Xaugmented];
    }

    /**
     * Coefficients derived by least squares regression.
     *
     * @property {Matrix} weights
     */

  }, {
    key: 'weights',
    get: function get() {
      return this[_weights];
    }

    /**
     * Terms currently in the model.
     *
     * @property {Term[]} terms
     */

  }, {
    key: 'terms',
    get: function get() {
      return this[_terms];
    }

    /**
     * Candidate terms (this also includes terms in the model already)
     *
     * @property {Term[]} candidates
     */

  }, {
    key: 'candidates',
    get: function get() {
      return this[_candyTerms];
    }
  }]);

  return Model;
}();

module.exports = Model;

},{"./combos.es6":1,"./playground/matrix.es6":4,"./stats.es6":6,"./term.es6":7}],4:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var utils = require('./utils.es6');

/**
 * Private members
 *
 * @private
 */
var _data = Symbol('data');
var _n = Symbol('n');
var _m = Symbol('m');

/**
 * Swap rows `i` and `j` in matrix `m` in place.
 *
 * @param {Matrix} m
 * @param {number} i
 * @param {number} j
 */
function swapRows(m, i, j) {
  var k, temp;

  for (k = 0; k < m[_m]; k += 1) {
    temp = m[_data][j * m[_m] + k];
    m[_data][j * m[_m] + k] = m[_data][i * m[_m] + k];
    m[_data][i * m[_m] + k] = temp;
  }
}

/**
 * Divide row `i` in both matrix `m` and matrix `inv` by `factor`.
 *
 * @param {Matrix} m
 * @param {Matrix} inv
 * @param {number} i
 * @param {number} j
 */
function divideRow(m, inv, i, factor) {
  var k, temp;

  for (k = 0; k < m[_m]; k += 1) {
    m[_data][i * m[_m] + k] /= factor;
    inv[_data][i * m[_m] + k] /= factor;
  }
}

/**
 * Subtract multiple of row `i` and column `j` from every row in `m` and `inv`.
 *
 * @param {Matrix} m
 * @param {Matrix} inv
 * @param {number} i
 * @param {number} j
 */
function subtractRowMultiple(m, inv, i, j) {
  var k, l, factor;

  for (l = 0; l < m[_n]; l += 1) {
    factor = m[_data][l * m[_m] + j];

    if (l !== i) {
      for (k = 0; k < m[_m]; k += 1) {
        m[_data][l * m[_m] + k] -= m[_data][i * m[_m] + k] * factor;
        inv[_data][l * m[_m] + k] -= inv[_data][i * m[_m] + k] * factor;
      }
    }
  }
}

/**
 * A speedy 2-dimensional matrix implementation.
 *
 * @class Matrix
 */

var Matrix = function () {

  /**
   * Creates a new Matrix of size <n, m>, using `stuff`.
   *
   * If `stuff` is a Float64Array, then the reference will be used. Otherwise,
   * its contents will be copied into a new Float64Array.
   *
   * @param {number | number[][]}       n     Number of rows (or nested arrays
   *                                          that look like a matrix)
   * @param {number}                    m     Number of columns
   * @param {Float64Array | number[][]} stuff Items to populate the matrix
   */
  function Matrix(n, m, stuff) {
    _classCallCheck(this, Matrix);

    if (Array.isArray(n)) {
      return Matrix.from(n);
    }
    if (stuff != null) {
      stuff = stuff instanceof Float64Array ? stuff : Float64Array.from(stuff);
      if (stuff.length !== n * m) {
        throw new Error('Array does not match the specified dimensions');
      }
    } else {
      stuff = new Float64Array(n * m);
    }
    this[_data] = stuff;
    this[_n] = n;
    this[_m] = m;
    return this;
  }

  /**
   * Performs element-wise addition between two matrices and returns a new copy.
   *
   * @param {Matrix<n,m>} other Matrix with equivalent dimensions to this
   * @return {Matrix<n,m>} this + other
   * @throws {Error} If dimensions do not match
   */


  _createClass(Matrix, [{
    key: 'add',
    value: function add(other) {
      if (this[_n] !== other[_n] || this[_m] !== other[_m]) {
        throw new Error('Dimensions do not match');
      }

      var sum = this.clone(),
          i;

      for (i = 0; i < sum[_data].length; i += 1) {
        sum[_data][i] += other[_data][i];
      }
      return sum;
    }

    /**
     * Performs matrix multiplication between this and other.
     *
     * @param {Matrix<m,k>} other Matrix whose rows must be === to this's columns
     * @return {Matrix<n,k>} this * other
     * @throws {Error} If dimensions do not match
     */

  }, {
    key: 'multiply',
    value: function multiply(other) {
      if (this[_m] !== other[_n]) {
        throw new Error('Dimensions do not match');
      }

      var product = new Matrix(this[_n], other[_m]),
          i,
          j,
          k,
          sum;

      for (i = 0; i < this[_n]; i += 1) {
        for (j = 0; j < other[_m]; j += 1) {
          for (k = 0, sum = 0; k < this[_m]; k += 1) {
            sum += this[_data][i * this[_m] + k] * other[_data][k * other[_m] + j];
          }
          product[_data][i * other[_m] + j] = sum;
        }
      }
      return product;
    }

    /**
     * Computes the inverse of the matrix (only if it is square!).
     *
     * @return {Matrix<n,m>} Inverse matrix s.t. this * inv(this) === I
     * @throws {Error} If not a square matrix
     */

  }, {
    key: 'inv',
    value: function inv() {
      if (this[_n] !== this[_m]) {
        throw new Error('Must be square');
      }

      var self = this.clone(),
          inverse = Matrix.eye(this[_n], this[_m]),
          i,
          j,
          k,
          factor;

      for (i = 0, j = 0; i < self[_n] && j < self[_m]; i += 1, j += 1) {
        if (self[_data] === 0) {
          for (k = 0; self[_data][k * self[_m] + j] !== 0 && k < self[_n]; k += 1) {}
          if (k >= self[_n]) {
            j += 1;
            continue;
          }
          swapRows(self, j, k);
          swapRows(inverse, j, k);
        }
        divideRow(self, inverse, j, self[_data][j * self[_m] + j]);
        subtractRowMultiple(self, inverse, i, j);
      }
      return inverse;
    }

    /**
     * Returns a copy of the matrix.
     *
     * @return {Matrix<n,m>} Fresh clone
     */

  }, {
    key: 'clone',
    value: function clone() {
      return new Matrix(this[_n], this[_m], this[_data].slice());
    }

    /**
     * Horizontally stacks `other` and returns the new matrix.
     *
     * @param {Matrix<n,k>} other Matrix whose rows === this's rows
     * @return {Matrix<n,m+k>} Horizontal concatenation of this and other
     * @throws {Error} If dimensions do not match
     */

  }, {
    key: 'hstack',
    value: function hstack(other) {
      if (this[_n] !== other[_n]) {
        throw new Error('Dimensions do not match');
      }

      var newM = this[_m] + other[_m],
          stacked = new Matrix(this[_n], newM),
          i,
          j;

      for (i = 0; i < this[_n]; i += 1) {
        for (j = 0; j < this[_m]; j += 1) {
          stacked[_data][i * newM + j] = this[_data][i * this[_m] + j];
        }
        for (j = 0; j < other[_m]; j += 1) {
          stacked[_data][i * newM + this[_m] + j] = other[_data][i * other[_m] + j];
        }
      }
      return stacked;
    }

    /**
     * Vertically stacks `other` and returns the new matrix.
     *
     * @param {Matrix<k,m>} other Matrix whose cols === this's cols
     * @return {Matrix<n+k,m>} Vertical concatenation of this and other
     * @throws {Error} If dimensions do not match
     */

  }, {
    key: 'vstack',
    value: function vstack(other) {
      if (this[_m] !== other[_m]) {
        throw new Error('Dimensions do not match');
      }

      var stacked = new Matrix(this[_n] + other[_n], this[_m]);

      stacked[_data].subarray(0, this[_n] * this[_m]).set(this[_data]);
      stacked[_data].subarray(this[_n] * this[_m]).set(other[_data]);
      return stacked;
    }

    /**
     * Performs element-wise exponentiation to the matrix and returns a new copy.
     *
     * @param {number} exponent Power to raise each element to
     * @return {Matrix<n,m>} this[i,i]^exponent
     */

  }, {
    key: 'dotPow',
    value: function dotPow(exponent) {
      var powd = this.clone(),
          i;

      for (i = 0; i < powd[_data].length; i += 1) {
        powd[_data][i] = Math.pow(powd[_data][i], exponent);
      }
      return powd;
    }

    /**
     * Performs element-wise multiplication to the matrix and returns a new copy.
     *
     * @param {number | Matrix} n Multiplicand to multiply each element by, or a
     *                            matrix whose elements will be iterated through
     *                            in alignment with this
     * @return {Matrix<n,m>} this[i,i] * n   OR   this[i,i] * n[i,i]
     */

  }, {
    key: 'dotMultiply',
    value: function dotMultiply(n) {
      var product = this.clone(),
          i;

      if (typeof n === 'number') {
        for (i = 0; i < product[_data].length; i += 1) {
          product[_data][i] = product[_data][i] * n;
        }
      } else if (n instanceof Matrix) {
        for (i = 0; i < product[_data].length; i += 1) {
          product[_data][i] = product[_data][i] * n[_data][i];
        }
      }
      return product;
    }

    /**
     * Performs element-wise division to the matrix and returns a new copy.
     *
     * @param {number | Matrix} n Divisor to divide each element by, or a matrix
     *                            whose elements will be iterated through in
     *                            alignment with this
     * @return {Matrix<n,m>} this[i,i] / n   OR   this[i,i] / n[i,i]
     */

  }, {
    key: 'dotDivide',
    value: function dotDivide(n) {
      var product = this.clone(),
          i;

      if (typeof n === 'number') {
        for (i = 0; i < product[_data].length; i += 1) {
          product[_data][i] = product[_data][i] / n;
        }
      } else if (n instanceof Matrix) {
        for (i = 0; i < product[_data].length; i += 1) {
          product[_data][i] = product[_data][i] / n[_data][i];
        }
      }
      return product;
    }

    /**
     * Stringifies the matrix into a (somewhat) pretty format
     *
     * @return {string} Representation of the matrix
     */

  }, {
    key: 'toString',
    value: function toString() {
      var str = '';
      var colSizes = [];
      var i, j, max, n;

      for (j = 0; j < this[_m]; j += 1) {
        for (max = 0, i = 0; i < this[_n]; i += 1) {
          max = Math.max(max, ('' + this[_data][i * this[_m] + j]).length);
        }
        colSizes.push(max);
      }

      for (i = 0; i < this[_n]; i += 1) {
        for (j = 0; j < this[_m] - 1; j += 1) {
          n = '' + this[_data][i * this[_m] + j];
          str += Array(colSizes[j] - n.length + 1).join(' ') + n + ' ';
        }
        n = '' + this[_data][i * this[_m] + j];
        str += Array(colSizes[j] - n.length + 1).join(' ') + n + '\n';
      }
      return str;
    }

    /**
     * Retrieves the ith column of the matrix
     *
     * @param {number} i Column index
     * @return {Matrix<n,1>} Column as a matrix
     */

  }, {
    key: 'col',
    value: function col(i) {
      var theCol = new Matrix(this[_n], 1),
          k;

      for (k = 0; k < this[_n]; k += 1) {
        theCol[_data][k] = this[_data][k * this[_m] + i];
      }
      return theCol;
    }

    /**
     * Retrieves the ith row of the matrix
     *
     * @param {number} i Row index
     * @return {Matrix<1,m>} Row as a matrix
     */

  }, {
    key: 'row',
    value: function row(i) {
      return new Matrix(1, this[_m], this[_data].slice(i * this[_m], (i + 1) * this[_m]));
    }

    /**
     * Retrieves a subset of the matrix, constructed from indices in `rows` and
     * `cols`. The resulting matrix will have rows s.t. result[i] = this[rows[i]]
     * and columns s.t. result[i][j] = this[rows[i][cols[j]]]
     *
     * @param {number[]} rows Array of indices used to construct the subset
     * @param {number[]} cols Array of indices used to construct the subset
     * @return {Matrix<rows.length, cols.length>} Subset of this
     */

  }, {
    key: 'subset',
    value: function subset(rows, cols) {
      rows = utils.convertRange(rows, this[_n]);
      cols = utils.convertRange(cols, this[_m]);

      var subMatrix = new Matrix(rows.length, cols.length),
          i,
          j;

      for (i = 0; i < rows.length; i += 1) {
        for (j = 0; j < rows.length; j += 1) {
          subMatrix[_data][i * subMatrix[_m] + j] = this[_data][rows[i] * this[_m] + cols[j]];
        }
      }
      return subMatrix;
    }

    /**
     * Retrieves the diagonal elements as a 1 x min(n, m) matrix.
     *
     * @return {Matrix<1,min(n,m)>} Diagonal elements
     */

  }, {
    key: 'diag',
    value: function diag() {
      var diagonal = new Matrix(1, Math.min(this[_n], this[_m])),
          i;

      for (i = 0; i < this[_n] && i < this[_m]; i += 1) {
        diagonal[_data][i] = this[_data][i * this[_m] + i];
      }
      return diagonal;
    }

    /**
     * Sums all of the elements.
     *
     * @return {number} Sum of all of the elements
     */

  }, {
    key: 'sum',
    value: function sum() {
      var tot = 0,
          i;

      for (i = 0; i < this[_data].length; i += 1) {
        tot += this[_data][i];
      }
      return tot;
    }

    /**
     * @property {Matrix<m,n>} T The transposition of the matrix
     */

  }, {
    key: 'T',
    get: function get() {
      var transpose = new Matrix(this[_m], this[_n]),
          i,
          j;

      for (i = 0; i < this[_n]; i += 1) {
        for (j = 0; j < this[_m]; j += 1) {
          transpose[_data][j * this[_n] + i] = this[_data][i * this[_m] + j];
        }
      }
      return transpose;
    }

    /**
     * @property {[number, number]} shape The shape of this matrix [n, m]
     */

  }, {
    key: 'shape',
    get: function get() {
      return [this[_n], this[_m]];
    }

    /**
     * @property {Float64Array} data The underlying storage for the matrix
     */

  }, {
    key: 'data',
    get: function get() {
      return this[_data];
    }

    /**
     * Generates a matrix full of random (0, 1) numbers.
     *
     * @static
     * @return {Matrix<n,m>} Matrix full'a random numbas
     */

  }], [{
    key: 'random',
    value: function random(n, m) {
      var randMatrix = new Matrix(n, m),
          i,
          j;

      for (i = 0; i < n; i += 1) {
        for (j = 0; j < m; j += 1) {
          randMatrix[_data][i * m + j] = Math.random();
        }
      }
      return randMatrix;
    }

    /**
     * Generates a matrix whose diagonal elements equal 1.
     *
     * @static
     * @return {Matrix<n,m>} Diagonal onez
     */

  }, {
    key: 'eye',
    value: function eye(n) {
      var m = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : n;

      var onez = new Matrix(n, m),
          i,
          j;

      for (i = 0; i < n; i += 1) {
        onez[_data][i * m + i] = 1;
      }
      return onez;
    }

    /**
     * Creates a matrix from matrix-looking nested arrays, or a flat array and the
     * given `n` and `m`.
     *
     * @param {iterable | Matrix} arr Values to populate the matrix with
     * @param {number}            n   Rows in the new matrix
     * @param {number}            m   Columns in the new matrix
     */

  }, {
    key: 'from',
    value: function from(arr, n, m) {
      if (arr instanceof Matrix) {
        return arr.clone();
      }
      if (!Array.isArray(arr)) {
        throw new TypeError('Expected an array or Matrix');
      }

      var i;

      n = n || arr.length;
      m = m || arr[0].length;

      // handed a 1-d array
      if (arr[0].length == null) {
        return new Matrix(1, arr.length, Float64Array.from(arr));
      }

      // otherwise, it's a 2-d array (and hopefully not >2-d)
      for (i = 0; i < arr.length; i += 1) {
        if (arr[i].length !== m) {
          throw new Error('All rows must have equal length');
        }
      }
      return new Matrix(n, m, Float64Array.from([].concat.apply([], arr)));
    }
  }]);

  return Matrix;
}();

module.exports = Matrix;

},{"./utils.es6":5}],5:[function(require,module,exports){
'use strict';

module.exports.range = function (start, end) {
  if (start >= end) {
    return [];
  }
  return Array(end - start).join(' ').split(' ').map(function (_, i) {
    return i + start;
  });
};

module.exports.convertRange = function (str, length) {
  var range, start, end;

  if (typeof str === 'number') {
    return str < 0 ? [length + str] : [str];
  }
  if (typeof str !== 'string') {
    return str.map(function (ind) {
      return ind < 0 ? length + ind : ind;
    });
  }

  if ((range = str.split(':')).length > 1) {
    start = parseInt(range[0]) || 0;
    end = parseInt(range[1]) || length;

    if (start < 0) {
      start = length + start;
    }
    if (end < 0) {
      end = length + end;
    }
    return module.exports.range(start, end);
  }

  throw new TypeError('Invalid range');
};

},{}],6:[function(require,module,exports){
'use strict';

var Matrix = require('./playground/matrix.es6');

/**
 * Computes the hat matrix for X.
 *
 *    H = X*inv(X'X)*X'
 *
 * @param {Matrix<n,m>} X
 * @return {Matrix<n,n>} Hat matrix for `X`
 */
module.exports.hatmatrix = function (X) {
  return X.multiply(X.T.multiply(X).inv()).multiply(X.T);
};

/**
 * Computes the mean square error of X and y.
 *
 * @param {Matrix<n,m>} X
 * @param {Matrix<n,1>} y
 * @param {Matrix<n,n>} [H] Optional -- hat matrix (if not supplied, it will be
 *                          computed)
 * @return {number} MSE of X and y
 */
module.exports.mse = function (X, y, H) {
  var I = Matrix.eye(X.shape[0]),
      n = X.shape[0],
      k = X.shape[1];

  H = H || module.exports.hatmatrix(X);

  return y.T.multiply(I.add(H.dotMultiply(-1))).multiply(y).dotMultiply(1 / (n - k));
};

/**
 * Compute least squares regression using normal equations.
 *
 *    B' = inv(X'X)X'y
 *
 * @return {Matrix<n,1>} Coefficients for each term in X that best fit the model
 */
module.exports.lstsq = function (X, y) {
  return X.T.multiply(X).inv().multiply(X.T).multiply(y);
};

/**
 * Compute least squares regression using normal equations, then compute
 * analytical statistics to determine the quality of the fit for the model and
 * for each term in the model.
 *
 *    B'  = inv(X'X)X'y
 *    y'  = XB'
 *    SSE = sum((y - y')^2)                     ^2 is element-wise
 *    MSE = SSE / n
 *    t_i = B' / sqrt( inv(X'X)[i,i] * MSE )    / is element-wise
 *
 * @return {object} Regression results
 */
module.exports.lstsqWithStats = function (X, y) {
  var XT = X.T,
      pseudoInverse = XT.multiply(X).inv(),
      BHat = pseudoInverse.multiply(XT).multiply(y),
      yHat = X.multiply(BHat),
      sse = y.add(yHat.dotMultiply(-1)).dotPow(2).sum(),
      mse = sse / X.shape[0],
      sec = pseudoInverse.diag().dotMultiply(mse).dotPow(0.5),
      tstats = BHat.dotDivide(sec);

  /*
  console.log();
  console.log(XT.multiply(X).toString());
  console.log('invX:');
  console.log(pseudoInverse.toString());
  console.log('BHAT:', BHat.data);
  console.log('SEC :', sec.data);
   */

  return {
    weights: BHat,
    tstats: tstats,
    mse: mse
  };
};

/*
var x = math.matrix([[41.9, 29.1],
                     [43.4, 29.3],
                     [43.9, 29.5],
                     [44.5, 29.7],
                     [47.3, 29.9],
                     [47.5, 30.3],
                     [47.9, 30.5],
                     [50.2, 30.7],
                     [52.8, 30.8],
                     [53.2, 30.9],
                     [56.7, 31.5],
                     [57.0, 31.7],
                     [63.5, 31.9],
                     [65.3, 32.0],
                     [71.1, 32.1],
                     [77.0, 32.5],
                     [77.8, 32.9]]);
var y = math.matrix([251.3, 251.3, 248.3, 267.5,
                     273.0, 276.5, 270.3, 274.9,
                     285.0, 290.0, 297.0, 302.5,
                     304.5, 309.3, 321.7, 330.7,
                     349.0]);
var z = math.matrix([[1]]).resize([x.size()[0], 1], 1);
 */

},{"./playground/matrix.es6":4}],7:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var stats = require('./stats.es6');
var combos = require('./combos.es6');

var Matrix = require('./playground/matrix.es6');

/**
 * Private members
 *
 * @private
 */
var _term = Symbol('term');
var _model = Symbol('model');
var _col = Symbol('col');

var DEBUG = false;

/**
 * Term is a combination of input columns and exponents, such as x^2*y^3.
 *
 * @class Term
 */

var Term = function () {

  /**
   * Creates a new Term.
   *
   * @constructor
   * @param {[number, number][]}  term  List of pairs of numbers. The first is
   *                                    the index of a column, where the second
   *                                    is the exponent to raise that column to
   * @param {Model}               model Model that owns this Term
   */
  function Term(term, model) {
    _classCallCheck(this, Term);

    this[_term] = term;
    this[_model] = model;
    this[_col] = this.computeColumn(model.X);
  }

  /**
   * Computes least squares regression and analysis statistics on the parent
   * model PLUS this term.
   *
   * @return {t: number, mse: number} Statistics for the regression
   */


  _createClass(Term, [{
    key: 'getStats',
    value: function getStats() {
      if (DEBUG) {
        console.time('createPolyMatrix');
      }
      var XAugmented = this[_model].data.hstack(this[_col]),
          theStats;

      if (DEBUG) {
        console.timeEnd('createPolyMatrix');
      }

      try {
        if (DEBUG) {
          console.time('lstsq');
        }
        theStats = stats.lstsqWithStats(XAugmented, this[_model].y);
        if (DEBUG) {
          console.timeEnd('lstsq');
        }
        return {
          t: theStats.tstats.data[[theStats.tstats.shape[0] - 1]]
        };
      } catch (e) {
        console.log(e);
        return NaN;
      }
    }

    /**
     * Compute the data column for a given matrix.
     *
     * @param {Matrix} X The input data matrix
     * @return {Matrix<n,1>} n x 1 Matrix -- polynomial combo of columns in term
     */

  }, {
    key: 'computeColumn',
    value: function computeColumn(X) {
      var sum = new Matrix(X.shape[0], 1),
          i;

      for (i = 0; i < this[_term].length; i += 1) {
        sum = sum.add(X.col(this[_term][i][0]).dotPow(this[_term][i][1]));
      }
      return sum;
    }

    /**
     * Determines if this term is equivalent to `other`.
     *
     * @param {Term | [number, number][]} other Term to compare against
     * @return {boolean} True if the terms are equivalent, false otherwise
     */

  }, {
    key: 'equals',
    value: function equals(other) {
      var _this = this;

      other = other[_term] || other;

      if (other.length !== this[_term].length) {
        return false;
      }

      return other.every(function (oMult) {
        return _this[_term].find(function (tMult) {
          return oMult[0] === tMult[0] && oMult[1] === tMult[1];
        });
      });
    }

    /**
     * Returns the list of pairs constituting the term.
     *
     * @property {[number, number][]} term
     */

  }, {
    key: 'term',
    get: function get() {
      return this[_term];
    }

    /**
     * Returns the data column for this term.
     *
     * @property {Matrix<n,1>} col
     */

  }, {
    key: 'col',
    get: function get() {
      return this[_col];
    }
  }]);

  return Term;
}();

module.exports = Term;

},{"./combos.es6":1,"./playground/matrix.es6":4,"./stats.es6":6}]},{},[2])(2)
});