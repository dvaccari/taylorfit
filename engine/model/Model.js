const Matrix = require('../matrix');
const lstsq = require('../regression').lstsq;
const statistics = require('../statistics');

const utils = require('../utils');
const perf = require('../perf');
const Observable = require('../observable');
const {
  FIT_LABEL,
  CROSS_LABEL,
  VALIDATION_LABEL,
  LOG,
  K_ORDER_DIFFERENCE,
  STANDARDIZE,
  RESCALE,
  DELETE,
} = require('../labels.json');

const CandidateWorker = require('./CandidateWorker');
const TermPool = require('./TermPool');
const CacheMixin = require('./CacheMixin');
const combos = require('./combos');

const _data = Symbol('data');
const _exponents = Symbol('exponents');
const _multiplicands = Symbol('multiplicands');
const _lags = Symbol('lags');
const _dependent = Symbol('dependent');
const _use_cols = Symbol('useCols');
const _subsets = Symbol('subsets');
const _terms = Symbol('terms');
const _cand_workers = Symbol('candWorkers');

const INTERCEPT = [[0, 0, 0]];
const N_CANDIDATE_WORKERS = 8;

var _y = 0
  , _ZT = 0
  , _pseudoInverse = 0
  , _BHat = 0
  , _yHat = 0
  , _nd = 0
  , _np = 0
  , _sse = 0
  , _mse = 0
  , _tCritVal = 0
  , _qFit = []
  , _qCross = []
  , _qValid = [];

// The following is taken from the Google code archive https://code.google.com/archive/p/statistics-distributions-js/

function tdistr($n, $p) {
  if ($n <= 0 || Math.abs($n) - Math.abs(integer($n)) != 0)
    throw ("Invalid n: $n\n");

  if ($p <= 0 || $p >= 1)
    throw ("Invalid p: $p\n");

  return _subt($n - 0, $p - 0);
}

function _subt($n, $p) {
  if ($p >= 1 || $p <= 0)
    throw ("Invalid p: $p\n");

  if ($p == 0.5)
    return 0;
  else if ($p < 0.5)
    return - _subt($n, 1 - $p);

  var $u = _subu($p);
  var $u2 = Math.pow($u, 2);
  var $a = ($u2 + 1) / 4;
  var $b = ((5 * $u2 + 16) * $u2 + 3) / 96;
  var $c = (((3 * $u2 + 19) * $u2 + 17) * $u2 - 15) / 384;
  var $d = ((((79 * $u2 + 776) * $u2 + 1482) * $u2 - 1920) * $u2 - 945)
    / 92160;
  var $e = (((((27 * $u2 + 339) * $u2 + 930) * $u2 - 1782) * $u2 - 765) * $u2
    + 17955) / 368640;
  var $x = $u * (1 + ($a + ($b + ($c + ($d + $e / $n) / $n) / $n) / $n) / $n);

  if ($n <= Math.pow(log10($p), 2) + 3) {
    var $round;
    do {
      var $p1 = _subtprob($n, $x);
      var $n1 = $n + 1;
      var $delta = ($p1 - $p) / Math.exp(($n1 * Math.log($n1 / ($n + $x * $x))
        + Math.log($n / $n1 / 2 / Math.PI) - 1
        + (1 / $n1 - 1 / $n) / 6) / 2);
      $x += $delta;
      $round = $delta, Math.abs(integer(log10(Math.abs($x)) - 4));
    } while (($x) && ($round != 0));
  }
  return $x;
}

function _subtprob($n, $x) {
  var $a;
  var $b;
  var $w = Math.atan2($x / Math.sqrt($n), 1);
  var $z = Math.pow(Math.cos($w), 2);
  var $y = 1;

  for (var $i = $n - 2; $i >= 2; $i -= 2)
    $y = 1 + ($i - 1) / $i * $z * $y;

  if ($n % 2 == 0) {
    $a = Math.sin($w) / 2;
    $b = .5;
  } else {
    $a = ($n == 1) ? 0 : Math.sin($w) * Math.cos($w) / Math.PI;
    $b = .5 + $w / Math.PI;
  }
  return max(0, 1 - $b - $a * $y);
}

function _subu($p) {
  var $y = -Math.log(4 * $p * (1 - $p));
  var $x = Math.sqrt(
    $y * (1.570796288
      + $y * (.03706987906
        + $y * (-.8364353589E-3
          + $y * (-.2250947176E-3
            + $y * (.6841218299E-5
              + $y * (0.5824238515E-5
                + $y * (-.104527497E-5
                  + $y * (.8360937017E-7
                    + $y * (-.3231081277E-8
                      + $y * (.3657763036E-10
                        + $y * .6936233982E-12)))))))))));
  if ($p > .5)
    $x = -$x;
  return $x;
}

function integer($i) {
  if ($i > 0)
    return Math.floor($i);
  else
    return Math.ceil($i);
}

function log10($n) {
  return Math.log($n) / Math.log(10);
}

// End of Google code archive functions

//IR helper function, calculates the model coefficient standard deviation
//This function pulls a specific row of data out of the stupid X data that already exists in the code
function get_modelcoef_std(xData, index, np){
  let temp = xData.filter((val, i) => i % np == index)
  let mean = temp.reduce((total, c) => total += c, 0) / temp.length;
  let diff = temp.map((d) => Math.pow(d - mean, 2));
  let diff_total = diff.reduce((total, c) => total += c, 0);
  return Math.sqrt(diff_total / temp.length);
}

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
    if (index === undefined || isNaN(index))
      return this;

    var data_labels = data.data_labels || [FIT_LABEL, CROSS_LABEL, VALIDATION_LABEL];
    // Need to do this for all datasets and not just "fit" data
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
            var transform_col = statistics.compute(label, { X: col })
            this.setData(this[_data][data_label].appendM(transform_col), data_label)
            break;
          case (K_ORDER_DIFFERENCE):
            var transform_col = statistics.compute(label, { X: col, k: data.k })
            this.setData(this[_data][data_label].appendM(transform_col), data_label)
            break;
          case (STANDARDIZE):
            var mean = statistics.compute("mean", { X: col })
            var std = statistics.compute("std", { X: col, mean: mean })
            var transform_col = statistics.compute(label, { X: col, mean: mean, std: std })
            this.setData(this[_data][data_label].appendM(transform_col), data_label)
            break;
          case (RESCALE):
            var rms = statistics.compute("RMS", { X: col });
            var transform_col = statistics.compute(label, { X: col, RMS: rms });
            this.setData(this[_data][data_label].appendM(transform_col), data_label)
            break;
          default:
            break;
        }
      }
    });
    this.fire('dataTransform', { label, index });
    return this;
  }

  setData(data, label = FIT_LABEL) {
    data = (data == null) ? undefined : data;
    label = (label == null) ? FIT_LABEL : label;

    if (data && !(data instanceof Matrix))
      data = new Matrix(data);

    if (data)
      if (label == FIT_LABEL ||
        data.shape[1] == this[_data][FIT_LABEL].shape[1])
        this[_use_cols] = utils.range(0, data.shape[1]);

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
      this.fire('propogateTransform', { data_label: label });
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
    if (this[_cand_workers] == null)
      return this.getCandidatesSync();

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
        pt: stats.pt.get(i, 0),
        ir: stats.weights.get(i,0) * get_modelcoef_std(stats.X.data, i, stats.np) / stats.stdy
      }
    }));

    let residuals = stats.y.sub(stats.yHat);
    residuals = residuals.data;

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

  subset(label = FIT_LABEL, start, end) {
    this.uncache('X');
    this.uncache('y');
    this.uncache('data');

    if (this[_data][label] == null)
      throw new ReferenceError('Cannot find data for \'' + label + '\'');

    if (!Array.isArray(start))
      start = utils.range(start, end || this[_data][label].shape[0]);
    else
      start = start.slice();

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
    this.updateConfidence(this[_dependent]);  // ! This is an awful patch; see https://github.com/MikeChunko/taylorfit-staging/issues/5
    this.updatePrediction(this[_dependent]);  // ! This is an awful patch; see https://github.com/MikeChunko/taylorfit-staging/issues/5
    return this;
  }

  removeTerm(term) {
    this[_terms] = this[_terms].filter((t) => !t.equals(term));
    this.uncache('X');
    this.uncache('y');
    this.uncache('highestLag');
    this.fire('removeTerm', term);
    this.updateConfidence(this[_dependent]);  // ! This is an awful patch; see https://github.com/MikeChunko/taylorfit-staging/issues/5
    this.updatePrediction(this[_dependent]);  // ! This is an awful patch; see https://github.com/MikeChunko/taylorfit-staging/issues/5
    return this;
  }

  highestLag() {
    return this[_terms].reduce((high, term) => Math.max(high, term.lag), 0);
  }

  X(label = FIT_LABEL) {
    if (this[_data][label] == null)
      throw new ReferenceError('Cannot find data for \'' + label + '\'');

    return this[_terms].reduce(
      (prev, curr) => prev.hstack(curr.col(label)),
      new Matrix(this[_subsets][label].length, 0)
    );
  }

  y(label = FIT_LABEL) {
    return this.data(label).subset(':', this[_dependent]);
  }

  // Get the critical t-value
  tCrit() {
    // This doubles as an "undefined" check
    if (this.tCrit.alpha != self.psig || this.tCrit.df != this.terms[0].col().shape[0] - this.terms.length) {
      this.tCrit.alpha = self.psig;
      this.tCrit.df = this.terms[0].col().shape[0] - this.terms.length;
      this.tCrit.t = tdistr(this.tCrit.df, this.tCrit.alpha / 2);
    }

    return this.tCrit.t;
  }

  data(label = FIT_LABEL) {
    if (this[_data][label] == null)
      throw new ReferenceError('Cannot find data for \'' + label + '\'');

    return this[_data][label].subset(this[_subsets][label]);
  }

  computeSensitivity(index, label = FIT_LABEL) {
    if (index == undefined)
      return this;

    let model = this; // to use within loops below
    let num_rows = model[_data][FIT_LABEL].shape[0];
    let derivative = new Matrix(num_rows, 1, new Array(num_rows).fill(0))

    this.terms.forEach(function (t) {
      let contains_variable = false;  // Check if the variable we are deriving on is in this term
      let derivative_part = new Matrix(num_rows, 1, new Array(num_rows).fill(1))

      let term_coef = 2 * t.getStats()['coeff']  // One coefficient per term

      // t.valueOf() is an Array which contains information for each variable of the term
      let tValues = t.valueOf();
      tValues.forEach(function (tValue) {
        let current_index = tValue[0];
        let current_exp = tValue[1];

        // Get the current column of data
        let current_col = model[_data][label].col(current_index)['data'];
        let part;

        if (current_index == index) {
          // Current variable exists in term, should be used in derivative
          contains_variable = true;

          // current_exp * [COLUMN DATA]^(current_exp - 1)
          part = statistics.compute('sensitivity_part', { data: current_col, exp: current_exp, derivative: true });
        } else // [COLUMN DATA]^(current_exp)
          part = statistics.compute('sensitivity_part', { data: current_col, exp: current_exp, derivative: false });

        derivative_part = derivative_part.dotMultiply(new Matrix(num_rows, 1, part));
      });

      if (contains_variable) // Add to overall derivative
        derivative = derivative.add(derivative_part.dotMultiply(term_coef));
    });

    return { index: index, sensitivity: derivative.data }
  }

  getSensitivity(index, label = FIT_LABEL) {
    let res = this.computeSensitivity(index, label);
    this.fire('getSensitivity', res);
    return this;
  }

  deleteSensitivity(index) {
    this.fire('deleteSensitivity', { index: index });
    return this;
  }

  updateSensitivity(index, label = FIT_LABEL) {
    let res = this.computeSensitivity(index, label);
    this.fire('updateSensitivity', res)
    return this;
  }

  computeConfidence(index, label = FIT_LABEL) {
    // Note: Only updated on show/hide and add/remove terms,
    // even though change dependent and alpha also affect CI.
    // This is to save resources as CI calculation is computationally expensive.
    if (index == undefined)
      return this;

    let model = this; // to use within loops below

    // Need to check every term for how many lags it has and select the max
    let lags = 0; // Used for adjusting with respect to time-series
    this.terms.forEach(function (t) {
      lags = Math.max(t.lag, lags);
    });

    let num_rows = model[_data][FIT_LABEL].shape[0] - lags;
    let total_rows = num_rows + lags;


    if (model[_data][CROSS_LABEL] != null)
      total_rows += model[_data][CROSS_LABEL].shape[0];
    if (model[_data][VALIDATION_LABEL] != null)
      total_rows += model[_data][VALIDATION_LABEL].shape[0];

    let Z = new Matrix(num_rows, this.terms.length, null);
    let confidence = new Matrix(total_rows, 1, new Array(total_rows).fill(0));

    // Build up the Z matrix (forms the core matrix)
    let i = 0;
    this.terms.forEach(function (t) {
      let d = t.col();  // Get term data

      // Properly ignore lag rows
      for (j = 0; j < d.shape[0] - lags; j++)
        Z.set(j, i, d.get(j + lags, 0));

      i += 1;
    });

    // Must construct new y matrix ignoring lag rows
    let y = new Matrix(this.y(label).shape[0] - lags, this.y(label).shape[1], new Array(this.y(label).shape[0] - lags).fill(0));

    for (i = 0; i < y.shape[0]; i++)
      y.set(i, 0, this.y(label).get(i + lags, 0));

    // This seems to be the easiest way to recompute MSE and tCrit
    let ZT = Z.T
      , core = ZT.dot(Z).inv()  // The core matrix
      , BHat = core.dot(ZT).dot(y)
      , yHat = Z.dot(BHat)
      , [nd, np] = Z.shape
      , sse = y.sub(yHat).dotPow(2).sum()
      , mse = sse / (nd - np)
      , tCritVal = this.tCrit();

    // Avoid recalculating
    // TODO: Check for reload, fix equality check
    // TODO: This code is out of date with some changes made to CI calculation
    if (false) { // _y === y && _ZT === ZT && _pseudoInverse === pseudoInverse && _BHat === BHat && _yHat === yHat && _nd === nd && _np === np && _sse === sse && _mse === mse && _tCritVal === tCritVal) {
      console.log("computeConfidence: Speedup");
      // Fit data set
      // Calculate Q for each entry (z_T_i * core * z_T_i.T)
      for (i = 0; i < num_rows; i++) {
        Q = _qFit[i];
        se_fit = Math.sqrt(mse * Q);

        // Update confidence for this entry
        confidence.set(i, 0, tCritVal * se_fit);
      }

      offset = num_rows;


      // Cross data set
      if (model[_data][CROSS_LABEL] != null) {
        num_rows_ = model[_data][CROSS_LABEL].shape[0];

        try {
          // Calculate Q for each entry (z_T_i * core * z_T_i.T)
          for (i = 0; i < num_rows_; i++) {
            Q = _qCross[i];
            se_fit = Math.sqrt(mse * Q);

            // Update confidence for this entry
            confidence.set(i + offset, 0, tCritVal * se_fit);
          }
        } catch (e) {
          console.log("Something unexpected happened in cross CI:", e);
        }

        offset += num_rows_;
      }


      // Valid data set
      if (model[_data][VALIDATION_LABEL] != null) {
        num_rows_ = model[_data][VALIDATION_LABEL].shape[0];

        try {
          // Calculate Q for each entry (z_T_i * core * z_T_i.T)
          for (i = 0; i < num_rows_; i++) {
            Q = _qValid[i];
            se_fit = Math.sqrt(mse * Q);

            // Update confidence for this entry
            confidence.set(i + offset, 0, tCritVal * se_fit);
          }
        } catch (e) {
          console.log("Something unexpected happened in validation CI:", e);
        }
      }

      return { index: index, confidence: confidence.data };

    } else {
      console.log("computeConfidence: Slow");

      _y = y;
      _ZT = ZT;
      _pseudoInverse = core;
      _BHat = BHat;
      _yHat = yHat;
      _nd = nd;
      _np = np;
      _sse = sse;
      _mse = mse;
      _tCritVal = tCritVal;
      _qFit = [];
      _qCross = [];
      _qValid = [];
    }

    // Compute our z matrix (transposed; same thing as Z but using data from the table with the given label)
    let z_T = null;

    // Fit data set
    z_T = Z; // z_T is identical to Z for the fit data set

    // Make all rows used by lags set to NaN
    for (i = 0; i < lags; i++)
      confidence.set(i, 0, NaN);

    // Calculate Q for each entry (z_T_i * core * z_T_i.T)
    for (i = 0; i < num_rows; i++) {
      z_T_i = z_T.row(i, null);
      Q = z_T_i.dot(core).dot(z_T_i.T).get(0, 0);
      _qFit.push(Q);
      se_fit = Math.sqrt(mse * Q);

      // Update confidence for this entry
      confidence.set(i + lags, 0, tCritVal * se_fit);
    }

    offset = num_rows + lags;

    // Cross data set
    if (model[_data][CROSS_LABEL] != null) {
      num_rows_ = model[_data][CROSS_LABEL].shape[0] - lags;
      z_T = new Matrix(num_rows_, this.terms.length, null);

      // Build up z
      let i = 0;
      this.terms.forEach(function (t) {
        let d = t.col(CROSS_LABEL);  // Get term data

        for (j = 0; j < d.shape[0] - lags; j++)
          z_T.set(j, i, d.get(j + lags, 0));

        i += 1;
      });

      // Make all rows used by lags set to NaN
      for (i = 0; i < lags; i++)
        confidence.set(i + offset, 0, NaN);

      try {
        // Calculate Q for each entry (z_T_i * core * z_T_i.T)
        for (i = 0; i < num_rows_; i++) {
          z_T_i = z_T.row(i, null);
          Q = z_T_i.dot(core).dot(z_T_i.T).get(0, 0);
          _qCross.push(Q);

          se_fit = Math.sqrt(mse * Q);

          // Update confidence for this entry
          confidence.set(i + offset + lags, 0, tCritVal * se_fit);
        }
      } catch (e) {
        console.log("Something unexpected happened in cross CI:", e);
      }

      offset += num_rows_ + lags;
    }

    // Valid data set
    if (model[_data][VALIDATION_LABEL] != null) {
      num_rows_ = model[_data][VALIDATION_LABEL].shape[0] - lags;
      z_T = new Matrix(num_rows_, this.terms.length, null);

      // Build up z
      let i = 0;
      this.terms.forEach(function (t) {
        let d = t.col(VALIDATION_LABEL);  // Get term data

        for (j = 0; j < d.shape[0] - lags; j++)
          z_T.set(j, i, d.get(j + lags, 0));

        i += 1;
      });

      // Make all rows used by lags set to NaN
      for (i = 0; i < lags; i++)
        confidence.set(i + offset, 0, NaN);

      try {
        // Calculate Q for each entry (z_T_i * core * z_T_i.T)
        for (i = 0; i < num_rows_; i++) {
          z_T_i = z_T.row(i, null);
          Q = z_T_i.dot(core).dot(z_T_i.T).get(0, 0);
          _qValid.push(Q);

          se_fit = Math.sqrt(mse * Q);

          // Update confidence for this entry
          confidence.set(i + offset + lags, 0, tCritVal * se_fit);
        }
      } catch (e) {
        console.log("Something unexpected happened in validation CI:", e);
      }
    }

    return { index: index, confidence: confidence.data }
  }

  getConfidence(index, label = FIT_LABEL) {
    let res = this.computeConfidence(index, label);
    this.fire('getConfidence', res);
    return this;
  }

  deleteConfidence(index) {
    this.fire('deleteConfidence', { index: index });
    return this;
  }

  updateConfidence(index, label = FIT_LABEL) {
    let res = this.computeConfidence(index, label);
    this.fire('updateConfidence', res)
    return this;
  }

  computePrediction(index, label = FIT_LABEL) {
    // Note: Only updated on show/hide and add/remove terms,
    // even though change dependent and alpha also affect PI.
    // This is to save resources as PI calculation is computationally expensive.
    if (index == undefined)
      return this;

    let model = this; // to use within loops below

    // Need to check every term for how many lags it has and select the max
    let lags = 0; // Used for adjusting with respect to time-series
    this.terms.forEach(function (t) {
      lags = Math.max(t.lag, lags);
    });

    let num_rows = model[_data][FIT_LABEL].shape[0] - lags;
    let total_rows = num_rows + lags;

    if (model[_data][CROSS_LABEL] != null)
      total_rows += model[_data][CROSS_LABEL].shape[0];
    if (model[_data][VALIDATION_LABEL] != null)
      total_rows += model[_data][VALIDATION_LABEL].shape[0];

    let Z = new Matrix(num_rows, this.terms.length, null);
    let prediction = new Matrix(total_rows, 1, new Array(total_rows).fill(0));

    // Build up the Z matrix (forms the core matrix)
    let i = 0;
    this.terms.forEach(function (t) {
      let d = t.col();  // Get term data

      // Properly ignore lag rows
      for (j = 0; j < d.shape[0] - lags; j++)
        Z.set(j, i, d.get(j + lags, 0));

      i += 1;
    });

    // Must construct new y matrix ignoring lag rows
    let y = new Matrix(this.y(label).shape[0] - lags, this.y(label).shape[1], new Array(this.y(label).shape[0] - lags).fill(0));

    for (i = 0; i < y.shape[0]; i++)
      y.set(i, 0, this.y(label).get(i + lags, 0));

    // This seems to be the easiest way to recompute MSE and tCrit
    let ZT = Z.T
      , core = ZT.dot(Z).inv()  // The core matrix
      , BHat = core.dot(ZT).dot(y)
      , yHat = Z.dot(BHat)
      , [nd, np] = Z.shape
      , sse = y.sub(yHat).dotPow(2).sum()
      , mse = sse / (nd - np)
      , tCritVal = this.tCrit();

    // Avoid recalculating
    // TODO: Check for reload, fix equality check
    // TODO: This code is out of date with some changes made to PI calculation
    if (false) { //_y === y && _ZT === ZT && _pseudoInverse === pseudoInverse && _BHat === BHat && _yHat === yHat && _nd === nd && _np === np && _sse === sse && _mse === mse && _tCritVal === tCritVal) {
      console.log("computePred: Speedup");
      // Fit data set
      // Calculate Q for each entry (z_T_i * core * z_T_i.T)
      for (i = 0; i < num_rows; i++) {
        Q = _qFit[i];
        se_fit = Math.sqrt(mse * (1 + Q));

        // Update prediction for this entry
        prediction.set(i, 0, tCritVal * se_fit);
      }

      offset = num_rows;


      // Cross data set
      if (model[_data][CROSS_LABEL] != null) {
        num_rows_ = model[_data][CROSS_LABEL].shape[0];

        try {
          // Calculate Q for each entry (z_T_i * core * z_T_i.T)
          for (i = 0; i < num_rows_; i++) {
            Q = _qCross[i];
            se_fit = Math.sqrt(mse * (1 + Q));

            // Update prediction for this entry
            prediction.set(i + offset, 0, tCritVal * se_fit);
          }
        } catch (e) {
          console.log("Something unexpected happened in cross CI:", e);
        }

        offset += num_rows_;
      }


      // Valid data set
      if (model[_data][VALIDATION_LABEL] != null) {
        num_rows_ = model[_data][VALIDATION_LABEL].shape[0];

        try {
          // Calculate Q for each entry (z_T_i * core * z_T_i.T)
          for (i = 0; i < num_rows_; i++) {
            Q = _qValid[i];
            se_fit = Math.sqrt(mse * (1 + Q));

            // Update prediction for this entry
            prediction.set(i + offset, 0, tCritVal * se_fit);
          }
        } catch (e) {
          console.log("Something unexpected happened in validation CI:", e);
        }
      }

      return { index: index, prediction: prediction.data };

    } else {
      console.log("computePred: Slow");

      _y = y;
      _ZT = ZT;
      _pseudoInverse = core;
      _BHat = BHat;
      _yHat = yHat;
      _nd = nd;
      _np = np;
      _sse = sse;
      _mse = mse;
      _tCritVal = tCritVal;
      _qFit = [];
      _qCross = [];
      _qValid = [];
    }

    // Compute our z matrix (transposed; same thing as Z but using data from the table with the given label)
    let z_T = null;

    // Fit data set
    z_T = Z;  // z_T is identical to Z for the fit data set

    // Make all rows used by lags set to NaN
    for (i = 0; i < lags; i++)
      prediction.set(i, 0, NaN);

    // Calculate Q for each entry (z_T_i * core * z_T_i.T)
    for (i = 0; i < num_rows; i++) {
      z_T_i = z_T.row(i, null);
      Q = z_T_i.dot(core).dot(z_T_i.T).get(0, 0);
      se_pred = Math.sqrt(mse * (1 + Q));

      // Update prediction for this entry
      prediction.set(i + lags, 0, tCritVal * se_pred);
    }

    offset = num_rows + lags;

    // Cross data set
    if (model[_data][CROSS_LABEL] != null) {
      num_rows_ = model[_data][CROSS_LABEL].shape[0] - lags;
      z_T = new Matrix(num_rows_, this.terms.length, null);

      // Build up z
      let i = 0;
      this.terms.forEach(function (t) {
        let d = t.col(CROSS_LABEL);  // Get term data

        for (j = 0; j < d.shape[0] - lags; j++)
          z_T.set(j, i, d.get(j + lags, 0));

        i += 1;
      });

      // Make all rows used by lags set to NaN
      for (i = 0; i < lags; i++)
        prediction.set(i + offset, 0, NaN);

      try {
        // Calculate Q for each entry (z_T_i * core * z_T_i.T)
        for (i = 0; i < num_rows_; i++) {
          z_T_i = z_T.row(i, null);
          Q = z_T_i.dot(core).dot(z_T_i.T).get(0, 0);
          se_pred = Math.sqrt(mse * (1 + Q));

          // Update prediction for this entry
          prediction.set(i + offset + lags, 0, tCritVal * se_pred);
        }
      } catch (e) {
        console.log("Something unexpected happened in cross PI:", e);
      }

      offset += num_rows_ + lags;
    }

    // Valid data set
    if (model[_data][VALIDATION_LABEL] != null) {
      num_rows_ = model[_data][VALIDATION_LABEL].shape[0] - lags;
      z_T = new Matrix(num_rows_, this.terms.length, null);

      // Build up z
      let i = 0;
      this.terms.forEach(function (t) {
        let d = t.col(VALIDATION_LABEL);  // Get term data

        for (j = 0; j < d.shape[0] - lags; j++)
          z_T.set(j, i, d.get(j + lags, 0));

        i += 1;
      });

      // Make all rows used by lags set to NaN
      for (i = 0; i < lags; i++)
        prediction.set(i + offset, 0, NaN);

      try {
        // Calculate Q for each entry (z_T_i * core * z_T_i.T)
        for (i = 0; i < num_rows_; i++) {
          z_T_i = z_T.row(i, null);
          Q = z_T_i.dot(core).dot(z_T_i.T).get(0, 0);
          se_pred = Math.sqrt(mse * (1 + Q));

          // Update prediction for this entry
          prediction.set(i + offset + lags, 0, tCritVal * se_pred);
        }
      } catch (e) {
        console.log("Something unexpected happened in validation PI:", e);
      }
    }

    return { index: index, prediction: prediction.data }
  }

  getPrediction(index, label = FIT_LABEL) {
    let res = this.computePrediction(index, label);
    this.fire('getPrediction', res);
    return this;
  }

  deletePrediction(index) {
    this.fire('deletePrediction', { index: index });
    return this;
  }

  updatePrediction(index, label = FIT_LABEL) {
    let res = this.computePrediction(index, label);
    this.fire('updatePrediction', res)
    return this;
  }

  computeImportanceRatio(index, label = FIT_LABEL) {
    if (index == undefined)
      return this;

    let model = this;
    let num_rows = model[_data][FIT_LABEL].shape[0];
    let current_col = model[_data][label].col(index);
    let dependent_col = model[_data][label].col(model[_dependent]);

    let sensitivity = this.computeSensitivity(index, label)['sensitivity'];
    sensitivity = new Matrix(num_rows, 1, sensitivity);  // Convert to matrix

    // Compute Standard Deviation of independent variable
    let mean_x = statistics.compute('mean', { X: current_col });
    let std_x = statistics.compute('std', { X: current_col, mean: mean_x });

    // Compute Standard Deviation of dependent variable
    let mean_y = statistics.compute('mean', { X: dependent_col });
    let std_y = statistics.compute('std', { X: dependent_col, mean: mean_y });

    let importance_ratio = sensitivity.dotMultiply(std_x / std_y);

    return { index: index, importanceRatio: importance_ratio.data };
  }

  getImportanceRatio(index, label = FIT_LABEL) {
    let res = this.computeImportanceRatio(index, label);
    this.fire('getImportanceRatio', res);
    return this;
  }

  deleteImportanceRatio(index) {
    this.fire('deleteImportanceRatio', { index: index });
    return this;
  }

  updateImportanceRatio(index, label = FIT_LABEL) {
    let res = this.computeImportanceRatio(index, label);
    this.fire('updateImportanceRatio', res)
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
