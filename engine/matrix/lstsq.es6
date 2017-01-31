
const Matrix  = require('./matrix.es6');
const svd     = require('./svd-golub-reinsch.es6');

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
 *    B'  = inv(X'X)X'y                     <-- weight vector
 *    y'  = XB'
 *    SSE = sum((y - y')^2)                     ^2 is element-wise
 *    MSE = SSE / n
 *    t_i = B' / sqrt( inv(X'X)[i,i] * MSE )    / is element-wise
 *
 * @return {object} Regression results
 */
function lstsqNEWithStats(X, y) {
  var XT            = X.T
    , pseudoInverse = XT.dot(X).inv()
    , BHat          = pseudoInverse.dot(XT).dot(y)
    , yHat          = X.dot(BHat)
    , sse           = y.add(yHat.dotMultiply(-1)).dotPow(2).sum()
    , mse           = sse / X.shape[0]
    , rtmse         = Math.sqrt(mse)
    , sec           = pseudoInverse.diag().abs().dotPow(0.5).dotMultiply(rtmse)
    , tstats        = BHat.dotDivide(sec);

  return {
    weights : BHat,
    tstats  : tstats,
    mse     : mse
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
 *    SSE     = sum((y - y')^2)                   ^2 is element-wise
 *    MSE     = SSE / n
 *    t_i     = it's complicated...see code
 *
 * @return {object} Regression results
 */
function lstsqSVDWithStats(X, y) {
  var decomposition = svd(X)
    , U             = decomposition[0]
    , w             = Matrix.from(decomposition[1])
    , V             = decomposition[2]
    , BHat          = lstsqSVD(X, U, w, V, y)
    , yHat          = X.dot(BHat)
    , sse           = y.add(yHat.dotMultiply(-1)).dotPow(2).sum()
    , mse           = sse / (X.shape[0] - 2)
    , VdivwSq       = V.dotDivide(w).dotPow(2)
    , i;

  for (i = 0; i < VdivwSq.data.length; i += 1) {
    if (Math.abs(VdivwSq.data[i]) === Infinity || isNaN(VdivwSq.data[i])) {
      VdivwSq.data[i] = 0;
    }
  }

  var sec = new Matrix(1, X.shape[1])
    , stdModelErr;
  for (i = 0; i < X.shape[1]; i += 1) {
    stdModelErr = Math.sqrt(VdivwSq.row(i).sum() * mse);
    sec.data[i] = stdModelErr;
  }

  var tstats        = BHat.dotDivide(sec);

  return {
    weights : BHat,
    tstats  : tstats,
    mse     : mse
  };
}

module.exports.lstsqSVD = lstsqSVDWithStats;
module.exports.lstsqNE  = lstsqNEWithStats;

var a = Matrix.from([[41.9, 29.1],
                     [43.4, 29.3],
                     [43.9, 29.5],
                     [44.5, 29.7],
                     [47.3, 29.9],
                     [47.5, 30.3],
                     [47.9, 30.5],
                     [50.2, 30.7],
                     [52.8, 30.8],
                     [53.2, 30.9],
                     [56.7, 31.5],
                     [57.0, 31.7],
                     [63.5, 31.9],
                     [65.3, 32.0],
                     [71.1, 32.1],
                     [77.0, 32.5],
                     [77.8, 32.9]]);
var b = new Matrix(17, 1, [251.3, 251.3, 248.3, 267.5,
                           273.0, 276.5, 270.3, 274.9,
                           285.0, 290.0, 297.0, 302.5,
                           304.5, 309.3, 321.7, 330.7,
                           349.0]);


var a = new Matrix([[22,10, 2,  3, 7],
                    [14, 7,10,  0, 8],
                    [-1,13,-1,-11, 3],
                    [-3,-2,13, -2, 4],
                    [ 9, 8, 1, -2, 4],
                    [ 9, 1,-7,  5,-1],
                    [ 2,-6, 6,  5, 1],
                    [ 4, 5, 0, -2, 2]]);
var b = new Matrix(8, 1, [12, 5, -2, -7, 1, 3, 10, 3]);

// taylorfit's Bhat
//var tfguess = Matrix.from([1.79903, 6.11149]).T;
var tfguess = Matrix.from([0.308165, 0.0720651, -0.0893553, 0.602561, 0.210042]).T;

// rms test
var rms = [];
var ndf = a.shape[0] - 2;
for (var i = 0; i < a.shape[1]; i += 1) {
  rms.push(a.col(i).abs().sum() / ndf);
}

/*
rms = Matrix.from(rms);
var anorm = a.dotDivide(rms);
var bnorm = b.dotDivide(b.abs().sum() / ndf);

console.log('rms', rms);
var estNE = lstsqNEWithStats(a, b);
var estSVD = lstsqSVDWithStats(a, b);

console.log('ne  B:', estNE.weights.T);
console.log('svd B:', estSVD.weights.T);

console.log('ne  T:', estNE.tstats.T);
console.log('svd T:', estSVD.tstats.T);
console.log('realB:', tfguess.T);

console.log(Math.sqrt(a.dot(estSVD.weights).dotMultiply(-1).add(b).dotPow(2).sum()));
console.log(Math.sqrt(a.dot(tfguess).dotMultiply(-1).add(b).dotPow(2).sum()));
console.log();

console.log('       [ actual   , my guess , taylorfit ]');
console.log('       -----------------------------------');
console.log(b.hstack(a.dot(estSVD.weights)).hstack(a.dot(tfguess)));
 */


/*
console.log('NE  MSE:', estNE.mse);
console.log('SVD MSE:', estSVD.mse);
console.log();
console.log('NE  Ts:');
console.log(estNE.tstats.toString());
console.log('SVD Ts:');
console.log(estSVD.tstats.toString());
console.log('NE  B:');
console.log(estNE.weights.toString());
console.log('SVD B:');
console.log(estSVD.weights.toString());
*/
