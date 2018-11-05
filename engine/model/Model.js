
const Matrix          = require('../matrix');
const lstsq           = require('../regression').lstsq;
const statistics      = require('../statistics');

const utils           = require('../utils');
const perf            = require('../perf');
const Observable      = require('../observable');
const {
  FIT_LABEL,
  CROSS_LABEL,
  VALIDATION_LABEL,
  LOG,
  K_ORDER_DIFFERENCE,
  STANDARDIZE,
  RESCALE,
  DELETE,
}   = require('../labels.json');

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

  transformColumn(label, data) {
    var index = data.index;
    if (index === undefined || isNaN(index)) {
      return this;
    }
    var data_labels = data.data_labels || [FIT_LABEL, CROSS_LABEL, VALIDATION_LABEL];
    // Need to do this for all dataset and not just "fit" data
    // If clear cross and validation data in UI, doesn't clear respective data in Model, so will throw error
    data_labels.map((data_label) => {
      if (this[_data][data_label]) {
        var col = this[_data][data_label].col(index)
        switch (label) {
          case (DELETE):
            this.setData(
              this[_data][data_label].delColumn(index),
              data_label
            );
            break;
          case (LOG):
            var transform_col = statistics.compute(label, {X: col})
            // this[_data][data_label] = this[_data][data_label].appendM(transform_col);
            this.setData(this[_data][data_label].appendM(transform_col), data_label)
            break;
          case (K_ORDER_DIFFERENCE):
            var k = data.k;
            var transform_col = statistics.compute(label, {X: col, k: k})
            // this[_data][data_label] = this[_data][data_label].appendM(transform_col);
            this.setData(this[_data][data_label].appendM(transform_col), data_label)
            break;
          case (STANDARDIZE):
            var mean = statistics.compute("mean", {X: col})
            var std = statistics.compute("std", {X: col, mean: mean})
            console.log("Mean", mean);
            console.log("Std", std)
            var transform_col = statistics.compute(label, {X: col, mean: mean, std: std})
            // this[_data][data_label] = this[_data][data_label].appendM(transform_col);
            this.setData(this[_data][data_label].appendM(transform_col), data_label)
            break;
          case (RESCALE):
            var rms = statistics.compute("RMS", {X: col});
            var transform_col = statistics.compute(label, {X: col, RMS: rms});
            // this[_data][data_label] = this[_data][data_label].appendM(transform_col);
            this.setData(this[_data][data_label].appendM(transform_col), data_label)
            break;
          default:
            break;
        }
      }
    });
    this.fire('dataTransform', {label, index});
    return this;
  }

  setData(data, label=FIT_LABEL) {
    data = (data == null) ? undefined : data;
    label = (label == null) ? FIT_LABEL : label;

    if (data && !(data instanceof Matrix)) {
      data = new Matrix(data);
    }
    if (data) {
      if (label !== FIT_LABEL &&
          data.shape[1] !== this[_data][FIT_LABEL].shape[1]) {
        // throw new Error(
        //   `Data for '${label}' is not the same shape as '${FIT_LABEL}'`
        // );
      } else {
        this[_use_cols] = utils.range(0, data.shape[1]);
      }
    }
    var curr_data = this[_data][label];
    this[_data][label] = data;
    this[_subsets][label] = data ? utils.range(0, data.shape[0]) : undefined;

    this[_terms] = this[_terms]
      .map(term => term.isIntercept ? this.termpool.get(INTERCEPT) : term);
    this.uncache('X');
    this.uncache('y');
    this.uncache('data');
    this.uncache('highestLag');

    this.termpool.uncache();
    this.fire('setData', { data, label });
    // First time importing data
    if (curr_data === undefined &&
      (label == CROSS_LABEL || label == VALIDATION_LABEL) &&
      data &&
      data.shape[1] < this[_data][FIT_LABEL].shape[1]) {
        this.fire('propogateTransform', {data_label: label});
    }
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

  getLabelData(label) {
    return this[_data][label];
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
    // TODO - wz can we add sensitivity here?
    return {
      highestLag: this.highestLag(),
      terms,
      stats,
      predicted,
      residuals
    };
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

  getSensitivity(index) {
    // TODO WZ
    if (index == undefined) {
      return this;
    }

    let model = this; // to use within loops below
    let num_rows = model[_data][FIT_LABEL].shape[0];
    // TODO IS THERE A BETTER WAY TO MAKE A MATRIX OF 0's?
    let derivative = new Matrix(num_rows, 1, new Array(num_rows).fill(0))
    
    this.terms.forEach(function (t) {
      let contains_variable = false; // Check if the variable we are deriving on is in this term
      let derivative_part = new Matrix(num_rows, 1, new Array(num_rows).fill(0))

      // One coefficient per term
      let term_coef = 2 * t.getStats()['coeff']
      // console.log("value:", term_coef); // it appears that this is exactly half of the term value
      
      // t.valueOf() is an Array which contains information for each variable of the term
      let tValues = t.valueOf();
      tValues.forEach(function(tValue) {
          let current_index = tValue[0];
          let current_exp = tValue[1];
          // console.log('current:', current_index, current_exp);
          
          // Get the current column of data
          let current_col = model[_data][FIT_LABEL].col(current_index)['data'];
          // console.log('current_col:', current_col);

          let part;
          if (current_index == index) {
            // Current variable exists in term, should be used in derivative
            contains_variable = true;

            // current_exp * [COLUMN DATA]^(current_exp - 1)
            part = statistics.compute('sensitivity_part', { data:current_col, exp:current_exp, derivative:true });
          }
          else {
            // [COLUMN DATA]^(current_exp)
            part = statistics.compute('sensitivity_part', { data: current_col, exp: current_exp, derivative:false });
          }
          derivative_part = derivative_part.add(new Matrix(num_rows, 1, part));

        });

        if (contains_variable) {
          // Add to overall derivative
          derivative = derivative.add(derivative_part.dotMultiply(term_coef));
        }
    
    });
    console.log('----');
    console.log("wz - index:", index);
    console.log('derivative:', derivative)

    // Should be an array added to the view DO NOT PUT IN DATA
    this.setData(this[_data][FIT_LABEL].appendM(derivative), FIT_LABEL);

    // TODO the chain back up to update columns
    this.fire('getSensitivity', index);
    return this;
  }

  get labels() {
    return Object.keys(this[_subsets])
      .filter((data_label) => this[_subsets][data_label]);
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

