
const Matrix          = require('../matrix');
const lstsq           = require('../regression').lstsq;

const utils           = require('../utils');
const Observable      = require('../observable');

const TermPool        = require('./termpool');
const combos          = require('./combos');

const _data           = Symbol('data');
const _exponents      = Symbol('exponents');
const _multiplicands  = Symbol('multiplicands');
const _lags           = Symbol('lags');
const _dependent      = Symbol('dependent');
const _subsets        = Symbol('subsets');
const _terms          = Symbol('terms');
const _cache          = Symbol('cache');

const INTERCEPT       = [[0, 0, 0]];
const DEFAULT_SUBSET  = 'fit';

class Model extends Observable {

  constructor() {
    super();

    this[_data] = new Matrix(0, 0);
    this[_exponents] = [1];
    this[_multiplicands] = [1];
    this[_lags] = [];
    this[_dependent] = 0;
    this[_subsets] = {};
    this[_subsets][DEFAULT_SUBSET] = [];

    this[_cache] = { X: {}, y: {}, data: {} };

    this[_terms] = [];
    this.termpool = new TermPool(this);
  }

  clear() {
    this[_terms] = [];
    this.fire('clear');
    return this;
  }

  setData(data) {
    if (!(data instanceof Matrix)) {
      data = new Matrix(data);
    }
    this[_data] = data;
    this[_subsets] = {};
    this[_subsets][DEFAULT_SUBSET] = utils.range(0, data.shape[0]);

    this[_terms] = [];
    this[_cache].X = {};
    this[_cache].y = {};
    this[_cache].data = {};
    this[_cache].highestLag = null;
    this.termpool.clearCache();
    this.fire('setData', data);
    return this;
  }

  setExponents(exponents) {
    this[_exponents] = exponents.slice();
    this.fire('setExponents', exponents);
    return this;
  }

  setMultiplicands(multiplicands) {
    this[_multiplicands] = utils.range(1, multiplicands + 1);
    this.fire('setMultiplicands', multiplicands);
    return this;
  }

  setDependent(dependent) {
    this[_dependent] = dependent;
    this[_terms] = [];
    this[_cache].X = {};
    this[_cache].y = {};
    this[_cache].highestLag = null;
    this.fire('setDependent', dependent);
    return this;
  }

  setLags(lags) {
    this[_lags] = lags.slice();
    this.fire('setLags', lags);
    return this;
  }

  subset(name, startRow, endRow) {
    if (!Array.isArray(startRow)) {
      startRow = utils.range(startRow, endRow || this[_data].shape[0]);
    }
    this.termpool.clearCache();
    this[_cache].X = {};
    this[_cache].y = {};
    this[_cache].data = {};
    this[_subsets][name] = startRow;
    this.fire('subset', { name, startRow, endRow });
    return this;
  }

  addTerm(term) {
    let found = this[_terms].find((t) => t.equals(term));

    if (!found) {
      found = this.termpool.get(term);
      this[_terms].push(found);
      this[_cache].X = {};
      this[_cache].y = {};
      this[_cache].highestLag = null;
    }
    this.fire('addTerm', term);
    return this;
  }

  removeTerm(term) {
    this[_terms] = this[_terms].filter((t) => !t.equals(term));
    this[_cache].X = {};
    this[_cache].y = {};
    this[_cache].highestLag = null;
    this.fire('removeTerm', term);
    return this;
  }

  getTerms() {
    return this[_terms].slice();
  }

  getCandidates() {
    this.fire('getCandidates.start');

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

    // For each candidate, get the stats for it alongside terms in the model
    let results = candidates
      .filter((cand) => !this[_terms].includes(cand))
      .map((candidate, i) => {
        this.fire('getCandidates.each', { curr: i, total: candidates.length });

        let stats = candidate.getStats();
        return {
          term: candidate.valueOf(),
          coeff: stats.coeff,
          stats
        };
      });

    this.fire('getCandidates.end');
    return results;
  }

  getModel(testSubset) {
    let highestLag = this.highestLag()
      , X = this.X().lo(highestLag)
      , y = this.y().lo(highestLag);

    let stats = lstsq(X, y);

    if (testSubset) {
      stats = lstsq(this.X(testSubset), this.y(testSubset), stats.weights);
    }

    let predicted = Array.from(stats.yHat.data);

    let terms = this[_terms].map((term, i) => ({
      term: term.valueOf(),
      coeff: stats.weights.get(i, 0),
      stats: {
        t: stats.t.get(i, 0),
        pt: stats.pt.get(i, 0)
      }
    }));

    // Do PCA, find the most important eigenvector, and transform the data
    let interceptCol = this[_terms].findIndex((term) => term.isIntercept);
    stats.w.data[interceptCol] = 0; // Don't consider intercept column
    let mostValuableCol = utils.argmax(stats.w.data.map(Math.abs));
    let pca = stats.X.dot(stats.V.col(mostValuableCol));

    // Duplicate set, stacking each with y (predicted and actual)
    // [ x0, y0_true ],
    // [ x1, y1_true ],
    //   ...
    // [ x0, y0_pred ],
    // [ x1, y1_pred ]
    let truthGraphData = pca.hstack(stats.y).toJSON();
    let predictedGraphData = pca.hstack(stats.yHat).toJSON();
    let graphdata = { truth: truthGraphData, predicted: predictedGraphData };

    if (interceptCol === mostValuableCol) {
      graphdata = { error: 'Only the intercept is selected' };
    }

    return { terms, stats, predicted, graphdata };
  }

  highestLag() {
    if (this[_cache].highestLag == null) {
      this[_cache].highestLag = this[_terms].reduce(
        (highest, term) => Math.max(highest, term.lag),
        0);
    }
    return this[_cache].highestLag;
  }

  X(subset=DEFAULT_SUBSET) {
    if (this[_cache].X[subset] == null) {
      this[_cache].X[subset] = this[_terms]
        .reduce((prev, curr) => prev.hstack(curr.col(subset)),
                new Matrix(this[_subsets][subset].length, 0));
    }

    return this[_cache].X[subset];
  }

  y(subset=DEFAULT_SUBSET) {
    if (this[_cache].y[subset] == null) {
      this[_cache].y[subset] = this.data(subset).subset(':', this[_dependent]);
    }
    return this[_cache].y[subset];
  }

  data(subset=DEFAULT_SUBSET) {
    if (!this[_cache].data[subset]) {
      this[_cache].data = {};
      for (let subset in this[_subsets]) {
        this[_cache].data[subset] = this[_data].subset(this[_subsets][subset]);
      }
    }
    return this[_cache].data[subset];
  }

  get subsets() {
    return Object.keys(this[_subsets]);
  }

}

Model.prototype.DEFAULT_SUBSET = DEFAULT_SUBSET;

module.exports = Model;
