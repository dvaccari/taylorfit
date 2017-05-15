'use strict';

const CacheMixin  = require('./CacheMixin');
const statistics  = require('../statistics');
const lstsq       = require('../regression').lstsq;
const Matrix      = require('../matrix');
const {
  FIT_LABEL,
  CROSS_LABEL
}                 = require('../labels.json');

/**
 * Private members
 *
 * @private
 */
const _parts      = Symbol('parts');
const _model      = Symbol('model');


/**
 * Term is a combination of input columns, exponents, and lags, such as x^2*y^3.
 *
 * @class Term
 */
class Term extends CacheMixin() {

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
    super();
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
    this.isIntercept = parts[0][0] === 0 &&
                       parts[0][1] === 0 &&
                       parts.length === 1;

    try {
      this.col();
    } catch (e) {
      // TODO: Pass up errors so that suspicious columns can be marked
    }
  }

  /**
   * Computes least squares regression and analysis statistics on the parent
   * model PLUS this term.
   *
   * @return {t: number, mse: number} Statistics for the regression
   */
  getStats() {
    try {
      // If we have cross data, use that to compute stats on lstsq
      // Otherwise, just use the fit data
      let regression = lstsq(this.X(FIT_LABEL), this.y(FIT_LABEL));
      let stats = statistics(regression);
      let t = stats.t.get(0, stats.t.shape[0]-1);
      let pt = stats.pt.get(0, stats.pt.shape[0]-1);

      Object.assign(regression, {
        X: this.X(CROSS_LABEL),
        y: this.y(CROSS_LABEL)
      });

      stats = statistics(regression);

      stats.coeff = stats.weights.get(0, stats.weights.shape[0]-1);
      stats.t = t;
      stats.pt = pt;
      delete stats.weights;

      return stats;
    } catch (e) {
      console.error(e);
      return NaN;
    }
  }

  X(subset=FIT_LABEL) {
    let lag = Math.max(this[_model].highestLag(), this.lag);

    try {
      return this[_model].X(subset).hstack(this.col(subset)).lo(lag);
    } catch (e) {
      if (subset !== FIT_LABEL) {
        return this.X(FIT_LABEL);
      }
      throw e;
    }
  }

  y(subset=FIT_LABEL) {
    let lag = Math.max(this[_model].highestLag(), this.lag);
    try {
      return this[_model].y(subset).lo(lag);
    } catch (e) {
      if (subset !== FIT_LABEL) {
        return this.y(FIT_LABEL);
      }
      throw e;
    }
  }

  /**
   * Determines if this term is equivalent to `other`.
   *
   * @param {Term | [num, num, num][]}  other Term to compare against
   * @return {boolean} True if the terms are equivalent, false otherwise
   */
  equals(other) {
    other = other.valueOf().map((part) => {
      part = part.concat(0);
      part.length = 3;
      return part;
    });
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
  col(subset=FIT_LABEL) {
    try {
      let data = this[_model].data(subset)
        , prod = Matrix.zeros(data.shape[0], 1).add(1)
        , i, col;

      for (i = 0; i < this[_parts].length; i += 1) {
        col = data.col(this[_parts][i][0]);

        // Check for negative exponent & potential 0 value
        if (col.max() * col.min() <= 0 && this[_parts][i][1] < 0) {
          throw new Error(`Divide by zero error for column ${this[_parts][i][0]}`);
        }

        prod = prod.dotMultiply(col.dotPow(this[_parts][i][1])
                                  .shift(this[_parts][i][2]));
      }

      return prod;
    } catch (e) {
      if (subset !== FIT_LABEL) {
        return this.col(FIT_LABEL);
      }
      throw e;
    }
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
    return term.valueOf().map(
      (part) => `(${part.concat(0).slice(0, 3).toString()})`
    ).toString();
  }

}

CacheMixin.cache(Term, 'col', [FIT_LABEL]);

module.exports = Term;
