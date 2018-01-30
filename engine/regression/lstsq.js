'use strict';

const Matrix      = require('../matrix');
const svd         = require('./svd-golub-reinsch');
const statistics  = require('../statistics');
const dist        = require('../statistics/distributions-socr');
const utils       = require('../utils');

/**
 * Computes total least squares regression on the matrix `A`, already decomposed
 * using SVD into the constituent `U`, `S` (sigma), and `V` matrices.
 *
 * @param {Matrix<m,n>} A Data matrix
 * @param {Matrix<m,m>} U U matrix resulting from SVD
 * @param {Matrix<m,n>} S Diagonal sigma matrix resulting from SVD
 * @param {Matrix<n,n>} V V matrix resulting from SVD
 * @param {Matrix<m,1>} b Independent column
 * @return {Matrix<n,1>} Estimated weight vector for the parameters (cols) in A
 */
function lstsqSVD(A, U, S, V, b) {
  var s = S
    , m = A.shape[0]
    , n = A.shape[1]
    , eps = Number.EPSILON
    , efcols = []
    , maxEig = Math.max.apply(null, s.data)
    , i, d, x;

  for (i = 0; i < n; i++) {
    if (s.data[i] < Math.max(m, n)*eps*maxEig) {
      s.data[i] = 0;
    }
  }
  d = U.T.dot(b);
  d = d.dotDivide(s);
  for (i = 0; i < n; i++) {
    if (Math.abs(d.data[i]) === Infinity) {
      d.data[i] = 0;
    }
  }
  x = V.dot(d);
  return x;
}

/**
 * Compute least squares regression using normal equations, then compute
 * analytical statistics to determine the quality of the fit for the model and
 * for each term in the model.
 *
 *    B'      = inv(X'X)X'y                       <-- weight vector
 *    y'      = XB'
 *
 *    Nd      = # of data
 *    Np      = # of params (coefs) in model
 *
 *    SSE     = sum((y - y')^2)                   ^2 is element-wise
 *    TSS     = sum((y - mean(y))^2)
 *    SSR     = TSS - SSE
 *    Var y   = TSS / (Nd - 1)
 *    MSR     = SSR / (Np - 1)
 *    MSE     = SSE / (Nd - Np)
 *    RSQ     = 1 - (SSE / TSS)
 *    cRSQ    = 1 - R^2
 *    adj-RSQ = 1 - (MSE / Var y)
 *    F       = MSR / MSE
 *    AIC     = log(MSE) + 2*(Np/Nd)
 *    BIC     = log(MSE) + Np*log(Nd)/Nd
 *    t_i     = B' / sqrt( inv(X'X)[i,i] * MSE )   / is element-wise
 *    SKEW    = sum((y-y')^3/N/s^3)
 *    KURT    = sum((y-y')^4/N/s^4)
 *
 * @return {object} Regression results
 */
function lstsqNEWithStats(X, y) {
  var XT            = X.T
    , pseudoInverse = XT.dot(X).inv()
    , BHat          = pseudoInverse.dot(XT).dot(y)
    , yHat          = X.dot(BHat)

  // fit statistics
    , nd            = X.shape[0]
    , np            = X.shape[1]
    , sse           = y.sub(yHat).dotPow(2).sum()
    , tss           = y.sub(y.sum() / y.shape[0]).dotPow(2).sum()
    , ssr           = tss - sse
    , vary          = tss / (nd - 1)
    , msr           = ssr / (np - 1)
    , mse           = sse / (nd - np)
    , rsq           = 1 - (sse / tss)
    , adjrsq        = 1 - (mse / vary)
    , f             = msr / mse
    , aic           = Math.log10(mse) + 2*(np / nd)
    , bic           = Math.log10(mse) + np*(Math.log10(nd) / nd)

    
  // for t-statistics
    , rtmse         = Math.sqrt(mse)
    , sec           = pseudoInverse.diag().abs().dotPow(0.5).dotMultiply(rtmse)
    , tstats        = BHat.dotDivide(sec)
    , pts           = tstats.clone();

  pts.data.set(pts.data.map((t) => dist.pt(t, nd - np)));

  return {
    weights : BHat,
    tstats  : tstats,
    mse     : mse,
    rsq     : rsq,
    adjrsq  : adjrsq,
    f       : f,
    pf      : dist.pf(f, np, nd - np),
    aic     : aic,
    bic     : bic,
    pts     : pts
  };
}

function scale(X) {
  let stdevs = [];
  let means = [];
  let intercept = -1;
  let i;

  for (i = 0; i < X.shape[1]; i += 1) {
    let col = X.col(i);
    let nd = col.shape[0];
    let mean = col.sum() / nd;
    let newCol = col.sub(mean);
    let stdev = Math.sqrt(newCol.dotPow(2).sum() / (nd - 1));

    means.push(mean);

    if (stdev <= Number.EPSILON && mean === 1) {
      stdevs.push(1);
      intercept = i;
    } else {
      X.col(i, newCol.dotDivide(stdev).data);
      stdevs.push(stdev);
    }
  }

  return {
    stdev: new Matrix(stdevs).T,
    mean: new Matrix(means).T,
    intercept
  };
}

/**
 * Compute least squares regression using singular value decomposition, then
 * compute analytical statistics to determine the quality of the fit for the
 * model and for each term in the model.
 *
 *    U, s, V = svd(X)
 *    B'      = V(U'b ./ s)                       See svd.lstsq for more
 *    y'      = XB'
 *
 * @return {object} Regression results
 */
function lstsqSVDWithStats(X, y, predictors) {
  let i;
  let stdev = 1, mean = 0, intercept = -1;
  //let { stdev, mean, intercept } = scale(X);

  let decomposition = svd(X)
    , U             = decomposition[0]
    , w             = Matrix.from(decomposition[1])
    , V             = decomposition[2]
    , VdivwSq       = V.dotDivide(w).dotPow(2)

    , BHat          = predictors || lstsqSVD(X, U, w, V, y)
    , weights       = BHat.dotDivide(stdev);

  // If there is an intercept, un-scale its weight by subtracting the means of
  // the other columns times the corresponding sign of their weights
  //
  //          B_0 = B_0 - sum(mean(i) * sign(weights(i)))
  //
  if (intercept >= 0) {
    let interceptWeight = weights.get(0, intercept) + 1;

    for (i = 0; i < weights.shape[0]; i += 1) {
      interceptWeight -= mean.data[i] * utils.sign(weights.data[i]);
    }
    weights.data[intercept] = interceptWeight;
  }

  // Remove infinitely high values to work around potential divide-by-zero issue
  for (i = 0; i < VdivwSq.data.length; i += 1) {
    if (Math.abs(VdivwSq.data[i]) === Infinity || isNaN(VdivwSq.data[i])) {
      VdivwSq.data[i] = 0;
    }
  }

  return { X, y, BHat, VdivwSq, stdev, mean, weights, V, w };
}

module.exports.lstsqSVD = lstsqSVDWithStats;
module.exports.lstsqNE  = lstsqNEWithStats;

