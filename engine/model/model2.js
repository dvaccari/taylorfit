
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
const DEFAULT_LABEL   = 'fit';

class Model extends Observable {

  constructor() {
    super();

    this[_data] = {};
    this[_data][DEFAULT_LABEL] = new Matrix(0, 0);

    this[_exponents] = [1];
    this[_multiplicands] = [1];
    this[_lags] = [];
    this[_dependent] = 0;

    this[_subsets] = {};
    this[_subsets][DEFAULT_LABEL] = [];

    this[_cache] = { X: {}, y: {}, data: {} };

    this[_terms] = [];
    this.termpool = new TermPool(this);
  }

  clear() {
    this[_terms] = [];
    this[_cache].X = {};
    this[_cache].y = {};
    this[_cache].highestLag = 0;

    this.fire('clear');
    return this;
  }

  setData(data, label=DEFAULT_LABEL) {
    label = (label == null) ? DEFAULT_LABEL : label;

    if (!(data instanceof Matrix)) {
      data = new Matrix(data);
    }

    if (label !== DEFAULT_LABEL &&
        data.shape[0] !== this[_data][DEFAULT_LABEL].shape[0]) {
      throw new Error(
        `Data for '${label}' is not the same shape as '${DEFAULT_LABEL}'`
      );
    }

    this[_data][label] = data;
    this[_subsets][label] = utils.range(0, data.shape[0]);

    this[_terms] = [];
    delete this[_cache].X[label];
    delete this[_cache].y[label];
    delete this[_cache].data[label];
    this[_cache].highestLag = null;
    this.termpool.clearCache();
    this.fire('setData', { data, label });
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

  subset(label=DEFAULT_LABEL, start, end) {
    delete this[_cache].X[label];
    delete this[_cache].y[label];
    delete this[_cache].data[label];

    if (!Array.isArray(start)) {
      start = utils.range(start, end);
    } else {
      start = start.slice();
    }
    this[_subsets][label] = start;

    this.fire('subset', start);
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
      utils.range(this[_dependent] + 1, this[_data][DEFAULT_LABEL].shape[1])
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

  getModel(testLabel) {
    let highestLag = this.highestLag()
      , X = this.X().lo(highestLag)
      , y = this.y().lo(highestLag);

    let stats = lstsq(X, y);

    if (testLabel) {
      stats = lstsq(this.X(testLabel), this.y(testLabel), stats.weights);
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

    /*
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
     */
    let residuals = stats.y.sub(stats.yHat);
    let graphdata = stats.y.hstack(residuals).toJSON();
    residuals = residuals.toJSON();

    return { terms, stats, predicted, graphdata, residuals };
  }

  highestLag() {
    if (this[_cache].highestLag == null) {
      this[_cache].highestLag = this[_terms].reduce(
        (highest, term) => Math.max(highest, term.lag),
        0);
    }
    return this[_cache].highestLag;
  }

  X(label=DEFAULT_LABEL) {
    if (this[_cache].X[label] == null) {
      this[_cache].X[label] = this[_terms]
        .reduce((prev, curr) => prev.hstack(curr.col(label)),
                new Matrix(this[_subsets][label].length, 0));
    }

    return this[_cache].X[label];
  }

  y(label=DEFAULT_LABEL) {
    if (this[_cache].y[label] == null) {
      this[_cache].y[label] = this.data(label).subset(':', this[_dependent]);
    }
    return this[_cache].y[label];
  }

  data(label=DEFAULT_LABEL) {
    if (!this[_cache].data[label]) {
      this[_cache].data = {};
      for (let subset in this[_subsets]) {
        // subset subset subset -- basically, get the fit/test/validation data
        // and take the rows picked by the user (if the user didn't pick any,
        // it defaults to all of the rows)
        this[_cache].data[subset] = this[_data][subset]
          .subset(this[_subsets][subset]);
      }
    }
    return this[_cache].data[label];
  }

  get labels() {
    return Object.keys(this[_subsets]);
  }

}

Model.prototype.DEFAULT_LABEL = DEFAULT_LABEL;

module.exports = Model;
