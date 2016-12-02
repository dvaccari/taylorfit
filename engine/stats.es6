
const Matrix = require('./playground/matrix.es6');
const svd = require('./playground/svd-golum-reinsch.es6');

/**
 * Computes the hat matrix for X.
 *
 *    H = X*inv(X'X)*X'
 *
 * @param {Matrix<n,m>} X
 * @return {Matrix<n,n>} Hat matrix for `X`
 */
module.exports.hatmatrix = (X) => {
  return X.multiply(X.T.multiply(X).inv()).multiply(X.T);
};

/**
 * Computes the mean square error of X and y.
 *
 * @param {Matrix<n,m>} X
 * @param {Matrix<n,1>} y
 * @param {Matrix<n,n>} [H] Optional -- hat matrix (if not supplied, it will be
 *                          computed)
 * @return {number} MSE of X and y
 */
module.exports.mse = (X, y, H) => {
  var I = Matrix.eye(X.shape[0])
    , n = X.shape[0]
    , k = X.shape[1];

  H = H || module.exports.hatmatrix(X);

  return y.T.multiply(I.add(H.dotMultiply(-1)))
            .multiply(y).dotMultiply(1 / (n - k));
};

/**
 * Compute least squares regression using normal equations.
 *
 *    B' = inv(X'X)X'y
 *
 * @return {Matrix<n,1>} Coefficients for each term in X that best fit the model
 */
module.exports.lstsq = (X, y) => {
  return (X.T.multiply(X)).inv().multiply(X.T).multiply(y);
};

/**
 * Compute least squares regression using normal equations, then compute
 * analytical statistics to determine the quality of the fit for the model and
 * for each term in the model.
 *
 *    B'  = inv(X'X)X'y
 *    y'  = XB'
 *    SSE = sum((y - y')^2)                     ^2 is element-wise
 *    MSE = SSE / n
 *    t_i = B' / sqrt( inv(X'X)[i,i] * MSE )    / is element-wise
 *
 * @return {object} Regression results
 */
function lstsqNEWithStats(X, y) {
  var XT            = X.T
    , pseudoInverse = XT.multiply(X).inv()
    , BHat          = pseudoInverse.multiply(XT).multiply(y)
    , yHat          = X.multiply(BHat)
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
 *    t_i     = 
 *
 * @return {object} Regression results
 */
function lstsqSVDWithStats(X, y) {
  var XT            = X.T
    , svdstuff      = svd.svd(X)
    , U             = svdstuff[0]
    , w             = Matrix.from(svdstuff[1])
    , V             = svdstuff[2]
    , BHat          = svd.lstsq(X, U, w, V, y)
    , yHat          = X.multiply(BHat)
    , sse           = y.add(yHat.dotMultiply(-1)).dotPow(2).sum()
    , mse           = sse / X.shape[0]
    , Vdivw         = V.dotDivide(w)
    , i;

  for (i = 0; i < Vdivw.data.length; i += 1) {
    if (Math.abs(Vdivw.data[i]) === Infinity || isNaN(Vdivw.data[i])) {
      Vdivw.data[i] = 0;
    }
  }

  var stdModelErr   = Math.sqrt(Vdivw.dotPow(2).sum() * mse)
    , sec           = new Matrix(1, X.shape[1]);

  for (i = 0; i < X.shape[1]; i += 1) {
    sec.data[i] = stdModelErr / (X.col(i).sum() / X.shape[0]);
  }

  var tstats        = BHat.dotDivide(sec);

  return {
    weights : BHat,
    tstats  : tstats,
    mse     : mse
  };
};

module.exports.lstsqWithStats = lstsqSVDWithStats;

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
/*

var z = math.matrix([[1]]).resize([x.size()[0], 1], 1);
 */

/*
var a = new Matrix(8, 5, Float64Array.from([22,10, 2,  3, 7,
                                            14, 7,10,  0, 8,
                                            -1,13,-1,-11, 3,
                                            -3,-2,13, -2, 4,
                                             9, 8, 1, -2, 4,
                                             9, 1,-7,  5,-1,
                                             2,-6, 6,  5, 1,
                                             4, 5, 0, -2, 2]));
var b = new Matrix(8, 1, [12, 5, -2, -7, 1, 3, 10, 3]);
*/

var estNE = lstsqNEWithStats(a, b);
var estSVD = lstsqSVDWithStats(a, b);

console.log(estNE.weights.T.toString());
console.log(estSVD.weights.T.toString());

console.log(estNE.tstats.T.toString());
console.log(estSVD.tstats.T.toString());

console.log(Math.sqrt(a.multiply(estSVD.weights).dotMultiply(-1).add(b).dotPow(2).sum()));


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
