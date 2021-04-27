const Statistic = require('./Statistic');
const Matrix = require('../matrix');
const dist = require('./distributions-socr');
const { mean } = require('lodash');

// Functional definitions for statistics -- defines how they will be calculated
// NOTE: Make sure each statistic has an entry in `metadata.json`
module.exports = [
  // given
  //X is actually a flattened 2d array, each column is the value for the data associated with each model term
  //E.g. if youre 2nd term is acceleration * weight, then the X.data[2] = the first acceleration datapoint times the first weight datapoint
  //Two get the second such data point, you would take X.data[2 + np]
  //For all of these points, take X.data.reduce((val, i) = i % np == 2 )
  Statistic('X', [], ({ X }) => X),
  Statistic('y', [], ({ y }) => y),
  Statistic('BHat', [], ({ BHat }) => BHat),

  Statistic('yHat', ['X', 'BHat'], ({ X, BHat }) => X.dot(BHat)),

  // fit statistics
  Statistic('nd', ['X'], ({ X }) => X.shape[0]),
  Statistic('np', ['X'], ({ X }) => X.shape[1]),

  Statistic('SSE', ['y', 'yHat'], ({ y, yHat }) => y.sub(yHat).dotPow(2).sum()),
  Statistic('TSS', ['y'], ({ y }) => y.sub(y.sum() / y.shape[0]).dotPow(2).sum()),

  // yHat.sub(y.sum() / y.shape[0]).dotPow(2).sum()));
  Statistic('SSR', ['TSS', 'SSE'], ({ TSS, SSE }) => TSS - SSE),

  Statistic('Vary', ['TSS', 'nd'], ({ TSS, nd }) => TSS / (nd - 1)),
  Statistic('MSR', ['SSR', 'np'], ({ SSR, np }) => SSR / (np - 1)),

  Statistic('SKEW', ['y', 'yHat', 'nd'], ({ y, yHat, nd }) => {
    let residuals = y.sub(yHat);
    let residMean = residuals.sum() / residuals.shape[0];
    let residStDv = Math.sqrt(residuals.sub(residMean).dotPow(2).sum() / (nd - 1));

    return nd * residuals.sub(residMean).dotPow(3).sum() / (nd - 1) / (nd - 2) / residStDv / residStDv / residStDv;
  }),
  Statistic('XKURT', ['y', 'yHat', 'nd'], ({ y, yHat, nd }) => {
    let residuals = y.sub(yHat);
    let residMean = residuals.sum() / residuals.shape[0];
    let residStDv = Math.sqrt(residuals.sub(residMean).dotPow(2).sum() / (nd - 1));

    // let r1 =  nd * (nd + 1) *residuals.sub(residMean).dotPow(4).sum() / (nd - 1) / (nd - 2) / (nd - 3) / residStDev / residStDv / residStDv / residStdDv;
    let r1 = nd * (nd + 1) * residuals.sub(residMean).dotPow(4).sum() / (nd - 1) / (nd - 2) / (nd - 3) / residStDv / residStDv / residStDv / residStDv;

    let r2 = 3 * (nd - 1) * (nd - 1) / (nd - 2) / (nd - 3);
    return r1 - r2;

  }),
  Statistic('seSKEW', ['nd'], ({ nd }) => Math.sqrt(6 / nd)),
  Statistic('seXKURT', ['nd'], ({ nd }) => Math.sqrt(24 / nd)),
  Statistic('MSE', ['SSE', 'nd', 'np'], ({ SSE, nd, np }) => SSE / (nd - np)),
  Statistic('RMSE', ['MSE'], ({ MSE }) => Math.sqrt(MSE)),
  Statistic('Rsq', ['SSE', 'TSS'], ({ SSE, TSS }) => 1 - (SSE / TSS)),
  Statistic('adjRsq', ['Rsq', 'np', 'nd'],
    ({ Rsq, nd, np }) => 1 - ((1 - Rsq) * (nd - 1) / (nd - np))),
  Statistic('F', ['MSR', 'MSE'], ({ MSR, MSE }) => MSR / MSE),

  Statistic('AIC', ['MSE', 'np', 'nd'],
    ({ MSE, np, nd }) => Math.log10(MSE) + 2 * (np / nd)),

  Statistic('BIC', ['MSE', 'np', 'nd'],
    ({ MSE, np, nd }) => Math.log10(MSE) + np * (Math.log10(nd) / nd)),

  Statistic('MaxAbsErr', ['y', 'yHat'], ({ y, yHat }) => y.sub(yHat).abs().max()),

  Statistic('t', ['X', 'VdivwSq', 'MSE', 'BHat'],
    ({ X, VdivwSq, MSE, BHat }) => {
      var sec = new Matrix(1, X.shape[1])
        , stdModelErr, i;

      for (i = 0; i < X.shape[1]; i += 1) {
        stdModelErr = Math.sqrt(VdivwSq.row(i).sum() * MSE);
        sec.data[i] = stdModelErr;
      }

      return BHat.dotDivide(sec);
    }),

  Statistic('pt', ['t', 'np', 'nd'],
    ({ t, np, nd }) => {
      let pt = t.clone();
      pt.data.set(pt.data.map((t) => Math.max(0, dist.pt(t, nd - np))));
      return pt;
    }),
  //Necessary to calculate stdy, the mean of y
  Statistic('meany', ['y'], ({y}) => {
    return y.data.reduce((total, c) => total += c, 0) / y.data.length
  }),

  //Necessary to calculate IR, the standard error of y
  Statistic('stdy',['y', 'meany'], ({y, meany}) =>{
    let diff = y.data.map((d) => Math.pow(d - meany, 2))
    let diff_total = diff.reduce((total, c) => total += c, 0)
    return Math.sqrt(diff_total / y.data.length)
  }),

  Statistic('pF', ['F', 'np', 'nd'],
    ({ F, np, nd }) => Math.max(dist.pf(Math.abs(F), np, nd - np) - 1e-15, 0)),

  Statistic('log', ["X"], ({ X }) => X.log()),

  Statistic('mean', ["X"], ({ X }) => {
    return X.data.reduce((total, c) => total += c, 0) / X.data.length
  }),

  Statistic('std', ["X", "mean"], ({ X, mean }) => {
    let diff = X.data.map((d) => Math.pow(d - mean, 2))
    let diff_total = diff.reduce((total, c) => total += c, 0)
    return Math.sqrt(diff_total / X.data.length)
  }),

  Statistic('standardize', ["X", "mean", "std"], ({ X, mean, std }) => {
    let standardize = X.clone();
    standardize.data.set(standardize.data.map((d) => (d - mean) / std));
    return standardize;
  }),

  Statistic('RMS', ["X"], ({ X }) => {
    let rms = X.clone();
    let SS = rms.data
      .map(r => Math.pow(r, 2))
      .reduce((total, xi) => total += xi, 0);
    return Math.sqrt(SS / rms.data.length);
  }),

  Statistic('rescale', ["X", "RMS"], ({ X, RMS }) => {
    let rescale = X.clone();
    rescale.data.set(rescale.data.map((d) => d / RMS));
    return rescale;
  }),

  Statistic('k_order_difference', ["X", "k"], ({ X, k }) => {
    let k_order_func = (data, k) => {
      if (k == 1)
        return data.map((d, idx) => idx < k ? null : d - data[idx - 1]);
      else {
        k_1_order = k_order_func(data, k - 1);
        return data.map((_, idx) => idx < k ? null : k_1_order[idx] - k_1_order[idx - 1]);
      }
    };
    if (!k || isNaN(k))
      return X;

    let k_order = X.clone();
    k_order.data.set(k_order_func(k_order.data, k));
    return k_order;
  }),

  Statistic('sensitivity_part', ['data', 'exp', 'derivative'],
    ({ data, exp, derivative }) => {
      if (data == undefined)
        return -1;

      if (derivative)
        return data.map((x) => exp * (Math.pow(x, (exp - 1))));
      else
        return data.map((x) => Math.pow(x, exp));
    })
];
