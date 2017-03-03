'use strict';

const lstsq   = require('../matrix').lstsq;
const Matrix  = require('../matrix').Matrix;


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

    this[_cache] = { };
    this[_cache].col = this.col;
  }

  /**
   * Computes least squares regression and analysis statistics on the parent
   * model PLUS this term.
   *
   * @return {t: number, mse: number} Statistics for the regression
   */
  getStats() {
    let lag = Math.max(this[_model].highestLag(), this.lag)
      , XLagged = this[_model].X.hstack(this.col).lo(lag)
      , yLagged = this[_model].y.lo(lag)
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
    this[_cache].col = null;
    return this;
  }

  /**
   * Determines if this term is equivalent to `other`.
   *
   * @param {Term | [num, num, num][]}  other Term to compare against
   * @return {boolean} True if the terms are equivalent, false otherwise
   */
  equals(other) {
    if (other instanceof Term) {
      other = other.valueOf();
    }

    if (other.length !== this[_parts].length) {
      return false;
    }

    let thiz = this[_parts];
    comp:
    for (let i = 0; i < other.length; i += 1) {
      for (let j = 0; j < thiz.length; j += 1) {
        if (other[i][0] === thiz[i][0] &&
            other[i][1] === thiz[i][1] &&
            other[i][2] === thiz[i][2]) {
          continue comp;
        }
      }
      return false;
    }
    return true;

    return other.every((oth) => this[_parts].find(
      (ths) => oth[0] === ths[0] && oth[1] === ths[1] && oth[2] === ths[2]
    ));
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
  get col() {
    if (this[_cache].col != null) {
      return this[_cache].col;
    }

    let data = this[_model].data
      , prod = Matrix.zeros(data.shape[0], 1).add(1)
      , i;

    for (i = 0; i < this[_parts].length; i += 1) {
      prod = prod.dotMultiply(
        data.col(this[_parts][i][0])
          .dotPow(this[_parts][i][1])
          .shift(this[_parts][i][2]));
    }

    this[_cache].col = prod;

    return this[_cache].col;
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

}

module.exports = Term;
