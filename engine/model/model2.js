

const Matrix          = require('../matrix').Matrix;
const lstsq           = require('../matrix').lstsq;

const utils           = require('../utils');

const TermPool        = require('./termpool');
const combos          = require('./combos');
const _data           = Symbol('data');
const _exponents      = Symbol('exponents');
const _multiplicands  = Symbol('multiplicands');
const _lags           = Symbol('lags');
const _dependent      = Symbol('dependent');
const _terms          = Symbol('terms');
const _cache          = Symbol('cache');

const INTERCEPT       = [[0, 0, 0]];

class Model {

  constructor() {
    this[_data] = new Matrix(0, 0);
    this[_exponents] = [1];
    this[_multiplicands] = [1];
    this[_lags] = [];
    this[_dependent] = 0;

    this[_cache] = { X: null, highestLag: null, y: null };

    this[_terms] = [];
    this.termpool = new TermPool(this);
  }

  setData(data) {
    if (!(data instanceof Matrix)) {
      data = new Matrix(data);
    }
    this[_data] = data;
    this[_terms] = [];
    this[_cache].X = null;
    this[_cache].y = null;
    this[_cache].highestLag = null;
    return this;
  }

  setExponents(exponents) {
    this[_exponents] = exponents.slice();
    return this;
  }

  setMultiplicands(multiplicands) {
    this[_multiplicands] = utils.range(1, multiplicands + 1);
    return this;
  }

  setDependent(dependent) {
    this[_dependent] = dependent;
    this[_cache].X = null;
    this[_cache].y = null;
    this[_cache].highestLag = null;
    return this;
  }

  setLags(lags) {
    this[_lags] = lags.slice();
    return this;
  }

  addTerm(term) {
    let found = this[_terms].find((t) => t.equals(term));

    if (!found) {
      found = this.termpool.get(term);
      this[_terms].push(found);
      this[_cache].X = null;
      this[_cache].y = null;
      this[_cache].highestLag = null;
    }
    return this;
  }

  removeTerm(term) {
    this[_terms] = this[_terms].filter((t) => !t.equals(term));
    this[_cache].X = null;
    this[_cache].y = null;
    this[_cache].highestLag = null;
    return this;
  }

  getTerms() {
    return this[_terms].slice();
  }

  getCandidates() {
    let independentCols = utils.join([
      utils.range(0, this[_dependent]),
      utils.range(this[_dependent] + 1, this[_data].shape[1])
    ]);

    // Candidates from exp / mults / lag
    let candidates = combos.generateTerms(
      independentCols,
      this[_exponents],
      this[_multiplicands],
      this[_lags]
    ).map(this.termpool.get.bind(this.termpool));

    // Intercept candidate (column of 1s)
    candidates.unshift(this.termpool.get(INTERCEPT));

    // Dependent column for each lag
    [].push.apply(candidates, this[_lags].map(
      (lag) => this.termpool.get([[this[_dependent], 1, lag]])));

    return candidates.map((candidate) => ({
      term: candidate.valueOf(),
      stats: candidate.getStats()
    }));
  }

  getModel() {
    let highestLag = this.highestLag()
      , X = this.X.lo(highestLag)
      , y = this.y.lo(highestLag);

    let stats = lstsq(X, y);

    return stats;
  }

  highestLag() {
    if (this[_cache].highestLag == null) {
      this[_cache].highestLag = this[_terms].reduce(
        (highest, term) => Math.max(highest, term.lag),
        0);
    }
    return this[_cache].highestLag;
  }

  get X() {
    if (this[_cache].X == null) {
      this[_cache].X = this[_terms]
        .reduce((prev, curr) => prev.hstack(curr.col),
                new Matrix(this[_data].shape[0], 0));
    }

    return this[_cache].X;
  }

  get y() {
    if (this[_cache].y == null) {
      this[_cache].y = this[_data].subset(':', this[_dependent]);
    }
    return this[_cache].y;
  }

  get data() {
    return this[_data];
  }

}

module.exports = Model;
