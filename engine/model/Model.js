
const Matrix          = require('../matrix');
const lstsq           = require('../regression').lstsq;
const statistics      = require('../statistics');

const utils           = require('../utils');
const perf            = require('../perf');
const Observable      = require('../observable');
const { FIT_LABEL }   = require('../labels.json');

const CandidateWorker = require('./CandidateWorker');
const TermPool        = require('./TermPool');
const CacheMixin      = require('./CacheMixin');
const combos          = require('./combos');

const _data           = Symbol('data');
const _exponents      = Symbol('exponents');
const _multiplicands  = Symbol('multiplicands');
const _lags           = Symbol('lags');
const _dependent      = Symbol('dependent');
const _use_cols       = Symbol('useCols');
const _subsets        = Symbol('subsets');
const _terms          = Symbol('terms');
const _cand_workers   = Symbol('candWorkers');

const INTERCEPT       = [[0, 0, 0]];

const N_CANDIDATE_WORKERS     = 8;

class Model extends CacheMixin(Observable) {

  constructor() {
    super();

    this[_data] = {};
    this[_data][FIT_LABEL] = new Matrix(0, 0);
    this[_exponents] = [1];

    this[_multiplicands] = [1];
    this[_lags] = [0];
    this[_dependent] = 0;
    this[_use_cols] = [];

    this[_subsets] = {};
    this[_subsets][FIT_LABEL] = [];

    try {
      this[_cand_workers] = utils
        .range(0, N_CANDIDATE_WORKERS)
        .map(() => new CandidateWorker(this));
    } catch (e) {
      // Set this to null so we know workers are unavailable and can fallback
      // to single-threaded operation
      this[_cand_workers] = null;
    }

    this.termpool = new TermPool(this);
    this[_terms] = [this.termpool.get(INTERCEPT)];
  }

  clear() {
    this[_terms] = [];
    this.uncache('X');
    this.uncache('y');
    this.uncache('highestLag');
    this.fire('clear');
    return this;
  }

  setData(data, label=FIT_LABEL) {
    label = (label == null) ? FIT_LABEL : label;

    if (!(data instanceof Matrix)) {
      data = new Matrix(data);
    }

    if (label !== FIT_LABEL &&
        data.shape[1] !== this[_data][FIT_LABEL].shape[1]) {
      throw new Error(
        `Data for '${label}' is not the same shape as '${FIT_LABEL}'`
      );
    } else {
      this[_use_cols] = utils.range(0, data.shape[1]);
    }

    this[_data][label] = data;
    this[_subsets][label] = utils.range(0, data.shape[0]);

    this[_terms] = this[_terms].map(term => term.isIntercept ? this.termpool.get(INTERCEPT) : term);
    this.uncache('X');
    this.uncache('y');
    this.uncache('data');
    this.uncache('highestLag');

    this.termpool.uncache();
    this.fire('setData', { data, label });
    return this;
  }

  getCandidateTerms() {
    // Candidates from exp / mults / lag
    let independent = this[_use_cols].filter(
      (col) => col !== this[_dependent]);

    let candidates = combos.generateTerms(
      this[_dependent],
      independent,
      this[_exponents],
      this[_multiplicands],
      this[_lags]
    ).map(this.termpool.get.bind(this.termpool));

    // Intercept candidate (column of 1s)
    candidates.unshift(this.termpool.get(INTERCEPT));

    return candidates;
  }

  getCandidates() {
    if (this[_cand_workers] == null) {
      return this.getCandidatesSync();
    }

    this.fire('getCandidates.start');

    perf.start('get-candidate-terms');
    let candidates = this.getCandidateTerms();
    perf.end('get-candidate-terms');

    // For each candidate, get the stats for it alongside terms in the model
    // If using workers, distribute the terms among them
    candidates = candidates.filter((cand) => !this[_terms].includes(cand));

    let candsPerWorker = utils.split(candidates, this[_cand_workers].length);
    let progress = utils.zeros(this[_cand_workers].length);

    // Called by each worker after some number of candidates have been computed
    let onProgress = (workerId, numFinished) => {
      progress[workerId] = numFinished;
      this.fire('getCandidates.each', {
        curr: utils.sum(progress),
        total: candidates.length
      });
    };

    // Pass a chunk of candidates to each worker to be computed
    let workerPromises = candsPerWorker.map(
      (cands, i) => this[_cand_workers][i].compute(cands, onProgress));

    return Promise
      .all(workerPromises)
      .then((candidates) => {
        this.fire('getCandidates.end');
        return utils.join(candidates);
      });
  }

  getModel(testLabel) {
    let highestLag = this.highestLag()
      , X = this.X().lo(highestLag)
      , y = this.y().lo(highestLag);

    let stats = statistics(lstsq(X, y));

    // If the model we want is not the default label (fit data), compute lstsq
    // with whichever dataset is requested
    if (testLabel != null) {
      stats = statistics(lstsq(
        this.X(testLabel).lo(highestLag),
        this.y(testLabel).lo(highestLag),
        stats.weights
      ));
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

    let residuals = stats.y.sub(stats.yHat);
    residuals = residuals.data;

    return { highestLag: this.highestLag(), terms, stats, predicted, residuals };
  }

  getCandidatesSync() {
    this.fire('getCandidates.start');

    let candidates = this.getCandidateTerms();
    let results;

    results = candidates
      .filter((cand) => !this[_terms].includes(cand))
      .map((candidate, i) => {
        this.fire('getCandidates.each', { curr: i, total: candidates.length });

        try {
          let stats = candidate.getStats();
          return {
            term: candidate.valueOf(),
            coeff: stats.coeff,
            stats
          };
        } catch (e) {
          return null;
        }
      })
      .filter((cand) => cand != null);

    this.fire('getCandidates.end');
    return Promise.resolve(results);
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
    this[_terms] = [this.termpool.get(INTERCEPT)];
    this.uncache();
    this.fire('setDependent', dependent);
    return this;
  }

  setColumns(cols) {
    this[_use_cols] = cols.slice();

    this[_terms] = [this.termpool.get(INTERCEPT)];
    this.uncache();
    this.fire('setColumns', cols);
    return this;
  }

  setLags(lags) {
    if (!lags.every((lag) => lag >= 0)) {
      this.fire('error', 'Cannot have negative lag');
      return this;
    }
    this[_lags] = lags.slice();
    this.fire('setLags', lags);
    return this;
  }

  subset(label=FIT_LABEL, start, end) {
    this.uncache('X');
    this.uncache('y');
    this.uncache('data');

    if (this[_data][label] == null) {
      throw new ReferenceError('Cannot find data for \'' + label + '\'');
    }

    if (!Array.isArray(start)) {
      start = utils.range(start, end || this[_data][label].shape[0]);
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
      this.uncache('X');
      this.uncache('y');
    }

    this.uncache('highestLag');
    this.fire('addTerm', term);
    return this;
  }

  removeTerm(term) {
    this[_terms] = this[_terms].filter((t) => !t.equals(term));
    this.uncache('X');
    this.uncache('y');
    this.uncache('highestLag');
    this.fire('removeTerm', term);
    return this;
  }

  highestLag() {
    return this[_terms].reduce((high, term) => Math.max(high, term.lag), 0);
  }

  X(label=FIT_LABEL) {
    if (this[_data][label] == null) {
      throw new ReferenceError('Cannot find data for \'' + label + '\'');
    }
    return this[_terms].reduce(
      (prev, curr) => prev.hstack(curr.col(label)),
      new Matrix(this[_subsets][label].length, 0)
    );
  }

  y(label=FIT_LABEL) {
    return this.data(label).subset(':', this[_dependent]);
  }

  data(label=FIT_LABEL) {
    if (this[_data][label] == null) {
      throw new ReferenceError('Cannot find data for \'' + label + '\'');
    }
    return this[_data][label].subset(this[_subsets][label]);
  }

  get labels() {
    return Object.keys(this[_subsets]);
  }

  get terms() {
    return this[_terms].slice();
  }

}

CacheMixin.cache(Model, 'highestLag');
CacheMixin.cache(Model, 'X', [FIT_LABEL]);
CacheMixin.cache(Model, 'y', [FIT_LABEL]);
CacheMixin.cache(Model, 'data', [FIT_LABEL]);

module.exports = Model;

