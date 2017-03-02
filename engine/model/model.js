
const lstsq         = require('../matrix').lstsq;
const Matrix        = require('../matrix').Matrix;
const utils         = require('../utils');

const Term          = require('./term');
const combos        = require('./combos');

/**
 * Private members
 *
 * @private
 */
const _weights      = Symbol('weights');
const _Xaugmented   = Symbol('Xaugmented');
const _terms        = Symbol('terms');
const _exponents    = Symbol('exponents');
const _multipliers  = Symbol('multipliers');
const _headers      = Symbol('headers');
const _X            = Symbol('X');
const _y            = Symbol('y');
const _candyTerms   = Symbol('candidateTerms');
const _means        = Symbol('means');
const _variances    = Symbol('variances');
const _lags         = Symbol('lags');


function standardize(X) {
  var stand = X.clone()
    , n = stand.shape[0]
    , m = stand.shape[1]
    , vars = [], means = []
    , i, j, mean, variance;

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
class Model {

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
   * @param {number}      multipliers Max number of multiplicands for each term,
   *                                  for instance 1 means only the individual
   *                                  columns can be terms (x, y, x^2, y^2, ..),
   *                                  but 3 means that candidate terms with
   *                                  1, 2, and 3 multiplicands will be computed
   *                                  (x, xy, xyz, ...)
   * @param {number[]}    lags        List of lags to apply to consider for each
   *                                  term
   */
  constructor(X, y, exponents=[1], multipliers=1, lags=[0],
              terms=[], headers=null) {
    //var standardizedX = standardize(X);
    this[_X] = X; //standardizedX.X;
    //this[_means] = standardizedX.means;
    //this[_variances] = standardizedX.vars;
    this[_y] = y;
    this[_headers] = headers;

    this[_Xaugmented] = new Matrix(X.shape[0], 0);
    this[_weights] = [];
    this[_lags] = lags;

    // Create a range [1, 2, 3, ..., n] for n multipliers
    multipliers = utils.range(1, multipliers + 1);

    // Generate candidate terms for the given parameters
    let candidates = combos.generateTerms(X.shape[1], exponents, multipliers);

    this[_candyTerms] = [].concat.apply([], lags.map(
      (lag) => utils.clone(candidates).map(
        (term) => new Term(this, term, lag))));

    // Find the initial terms in candyTerms and add them to the model
    this[_terms] = terms.map(
      (pair) => this[_candyTerms].find((term) => term.equals(pair))
    );

    // Add bias term
    this[_terms].unshift(new Term(this, [[0, 0]]));

    // If any terms are specified, compute the model & all candidate terms
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
   * @param {Term | Object}       term        Term to compare against
   * @param {[number, number][]}  term.parts  [col, exp] pairs (if Object)
   * @param {number}              term.lag    lag (if Object)
   * @param {boolean} [recompute] Optional flag indicating whether or not to
   *                              recompute the model
   * @return {Term[]} List of current terms in the model
   */
  addTerm(term, recompute=true) {
    if (!Array.isArray(term) && !Array.isArray(term.parts)) {
      throw new TypeError('Expected an array of [col, exp] pairs');
    }

    term.parts.forEach((pair) => {
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new TypeError('Invalid [col, exp] pair: ' + JSON.stringify(pair));
      }
    });

    var found = this[_terms].find((existingTerm) => existingTerm.equals(term));

    if (found) {
      return this[_terms];
    }

    found = this[_candyTerms].find((candyTerm) => candyTerm.equals(term));

    if (!found) {
      found = new Term(this, term.parts, term.lag);
    }

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
   * @param {Term | Object}       removee       Term to compare against
   * @param {[number, number][]}  removee.parts [col, exp] pairs (if Object)
   * @param {number}              removee.lag   lag (if Object)
   * @param {boolean} [recompute] Optional flag indicating whether or not to
   *                              recompute the model
   * @return {Term[]} List of current terms in the model
   */
  removeTerm(termToRemove, recompute=true) {
    this[_terms] = this[_terms].filter((term) => !term.equals(termToRemove));

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
  compute() {
    this[_Xaugmented] = this[_terms]
      .map((term) => term.col)
      .reduce((prev, curr) => prev.hstack(curr),
              new Matrix(this[_X].shape[0], 0));

    // Perform least squares using the terms added the model
    var things = lstsq(this[_Xaugmented], this[_y]);
    this[_weights] = things.weights;

    // Perform least squares with each term not in the model independently
    var candidateTerms = this[_candyTerms]
          // Filter out candidates already in the model
          .filter((term) => !this[_terms].includes(term))
          // Create primitive representation for each term
          .map((term) => ({
            term : term.valueOf(),
            stats: term.getStats()
          }));

    return {
      model: {
        weights: this[_weights].data,
        tstats: things.tstats.data,
        terms: this[_terms].map((term, i) => ({
          term: term.valueOf(),
          stats: {
            t: things.tstats.data[i],
            pt: things.pts.data[i]
          },
          coeff: things.weights.data[i]
        }))
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
  predict(testData) {
    testData = Matrix.from(testData);
    testData = this[_terms]
      .map((term) => term.computeColumn(testData))
      .reduce((prev, curr) => prev.hstack(curr),
              new Matrix(testData.shape[0], 0));
    return testData.dot(Matrix.from(this[_weights]).T);
  }

  /**
   * The input feature matrix.
   *
   * @property {Matrix} X
   */
  get X() {
    return this[_X];
  }

  /**
   * The given training values.
   *
   * @property {Matrix} y
   */
  get y() {
    return this[_y];
  }

  /**
   * Current matrix, whose columns reflect the terms in the model.
   *
   * @property {Matrix} data
   */
  get data() {
    return this[_Xaugmented];
  }

  /**
   * Coefficients derived by least squares regression.
   *
   * @property {Matrix} weights
   */
  get weights() {
    return this[_weights];
  }

  /**
   * Terms currently in the model.
   *
   * @property {Term[]} terms
   */
  get terms() {
    return this[_terms];
  }

  /**
   * Candidate terms (this also includes terms in the model already)
   *
   * @property {Term[]} candidates
   */
  get candidates () {
    return this[_candyTerms];
  }

  /**
   * Serializes the model for later use.
   *
   * @return {TODO: something per data contract}
   */
  toJSON() {
    return {
      headers     : this[_headers],
      weights     : this[_weights].toArray(),
      terms       : this[_terms]
    };
  }

}

module.exports = Model;
