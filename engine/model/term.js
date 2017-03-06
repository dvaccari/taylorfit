'use strict';

const lstsq   = require('../matrix').lstsq;
const Matrix  = require('../matrix').Matrix;
const md5     = require('blueimp-md5');


/**
 * Private members
 *
 * @private
 */
const _parts  = Symbol('parts');
const _model  = Symbol('model');
const _cache  = Symbol('cache');


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
   * @param {Model}             model         Model that owns this Term
   * @param {[num, num, num][]} parts         List of triples of numbers
   * @param {number}            parts[i][0]   First is the index of a column
   * @param {number}            parts[i][1]   Second is the exponent to raise
   *                                          that column to
   * @param {number}           [parts[i][2]]  Third is the lag to apply to that
   *                                          column
   */
  constructor(model, parts) {
    if (!parts.every(Array.isArray)) {
      throw new TypeError('Part does not match: [col, exp (,lag)]');
    }

    this[_parts] = parts.map((part) => {
      if (part.length < 2) {
        throw new TypeError('Part does not match: [col, exp (,lag)]');
      }
      if (part.length < 3) {
        return part.concat(0);
      }
      return part.slice();
    });

    this[_model] = model;

    this[_cache] = { col: {} };
    this.col();
  }

  /**
   * Computes least squares regression and analysis statistics on the parent
   * model PLUS this term.
   *
   * @return {t: number, mse: number} Statistics for the regression
   */
  getStats(subset=this[_model].DEFAULT_SUBSET) {
    let lag = Math.max(this[_model].highestLag(), this.lag)
      , XLagged = this[_model].X(subset).hstack(this.col(subset)).lo(lag)
      , yLagged = this[_model].y(subset).lo(lag)
      , theStats;

    try {
      theStats = lstsq(XLagged, yLagged);
      theStats.coeff = theStats.weights.get(0, theStats.weights.shape[0]-1);
      theStats.t = theStats.tstats.get(0, theStats.tstats.shape[0]-1);
      theStats.pt = theStats.pts.get(0, theStats.pts.shape[0]-1);
      delete theStats.weights;
      delete theStats.tstats;
      delete theStats.pts;

      return theStats;

      // XXX: Obsolete
      /*
      return {
        coeff : theStats.weights.get(0, theStats.weights.shape[0]-1),
        t     : theStats.tstats.data[[theStats.tstats.shape[0] - 1]],
        mse   : theStats.mse
      };
       */
    } catch (e) {
      console.error(e);
      return NaN;
    }
  }

  clearCache() {
    this[_cache].col = {};
    return this;
  }

  /**
   * Determines if this term is equivalent to `other`.
   *
   * @param {Term | [num, num, num][]}  other Term to compare against
   * @return {boolean} True if the terms are equivalent, false otherwise
   */
  equals(other) {
    other = other.valueOf();
    return Term.hash(other) === Term.hash(this);
  }

  /**
   * Returns the information necessary to reconstruct the term in a plain
   * object (except the reference to the model).
   *
   * @return {[num, num, num][]} List of [col, exp, lag] triples
   */
  valueOf() {
    return this[_parts].slice();
  }

  /**
   * Compute the data column for a given matrix.
   *
   * @return {Matrix<n,1>} n x 1 Matrix -- polynomial combo of columns in term
   */
  col(subset=this[_model].DEFAULT_SUBSET) {
    if (this[_cache].col[subset] != null) {
      return this[_cache].col[subset];
    }

    let data = this[_model].data(subset)
      , prod = Matrix.zeros(data.shape[0], 1).add(1)
      , i;

    for (i = 0; i < this[_parts].length; i += 1) {
      prod = prod.dotMultiply(
        data.col(this[_parts][i][0])
          .dotPow(this[_parts][i][1])
          .shift(this[_parts][i][2]));
    }

    this[_cache].col[subset] = prod;

    return this[_cache].col[subset];
  }

  get lag() {
    return Math.max.apply(null, this[_parts].map((part) => part[2]));
  }

  /**
   * Give a representation of the term in a pretty format.
   *
   * @return {string} Representation of this term
   */
  inspect(depth, options) {
    return 'Term < ' + this[_parts]
      .map((t) => String.fromCharCode(t[0] + 97)
           + '^' + t[1]
           + '[' + t[2] + ']')
      .join(' * ') + ' >';
  }

  static hash(term) {
    term = term.valueOf();
    return md5(term.map(md5).sort().join());
  }

}

module.exports = Term;
