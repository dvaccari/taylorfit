
const lstsq   = require('../matrix').lstsq;
const Matrix  = require('../matrix').Matrix;

const combos  = require('./combos');


/**
 * Private members
 *
 * @private
 */
const _term   = Symbol('term');
const _model  = Symbol('model');
const _col    = Symbol('col');


const DEBUG   = false;


/**
 * Term is a combination of input columns and exponents, such as x^2*y^3.
 *
 * @class Term
 */
class Term {

  /**
   * Creates a new Term.
   *
   * @constructor
   * @param {[number, number][]}  term  List of pairs of numbers. The first is
   *                                    the index of a column, where the second
   *                                    is the exponent to raise that column to
   * @param {Model}               model Model that owns this Term
   */
  constructor(term, model) {
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
  getStats() {
    if (DEBUG) {
      console.time('createPolyMatrix');
    }
    var XAugmented = this[_model].data.hstack(this[_col])
      , theStats;

    if (DEBUG) {
      console.timeEnd('createPolyMatrix');
    }

    try {
      if (DEBUG) {
        console.time('lstsq');
      }
      theStats = lstsq(XAugmented, this[_model].y);
      if (DEBUG) {
        console.timeEnd('lstsq');
      }
      return {
        coeff : theStats.weights.get(0, theStats.weights.shape[0]-1),
        t     : theStats.tstats.data[[theStats.tstats.shape[0] - 1]],
        mse   : theStats.mse
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
  computeColumn(X) {
    var sum = new Matrix(X.shape[0], 1)
    , i;

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
  equals(other) {
    other = other[_term] || other;

    if (other.length !== this[_term].length) {
      return false;
    }

    return other.every((oMult) => this[_term].find(
      (tMult) => oMult[0] === tMult[0] && oMult[1] === tMult[1]
    ));
  }

  /**
   * Returns the list of pairs constituting the term.
   *
   * @property {[number, number][]} term
   */
  get term() {
    return this[_term];
  }

  /**
   * Returns the data column for this term.
   *
   * @property {Matrix<n,1>} col
   */
  get col() {
    return this[_col];
  }


  /**
   * Give a representation of the term in a pretty format.
   *
   * @return {string} Representation of this term
   */
  inspect(depth, options) {
    return 'Term < ' + this[_term]
        .map((t) => String.fromCharCode(t[0] + 97) + '^' + t[1])
        .join(' + ') + ' >';
  }

}

module.exports = Term;
