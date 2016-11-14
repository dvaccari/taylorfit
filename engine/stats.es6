
const Matrix = require('./playground/matrix.es6');

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
module.exports.lstsqWithStats = (X, y) => {
  var XT            = X.T
  , pseudoInverse = XT.multiply(X).inv()
  , BHat          = pseudoInverse.multiply(XT).multiply(y)
  , yHat          = X.multiply(BHat)
  , sse           = y.add(yHat.dotMultiply(-1)).dotPow(2).sum()
  , mse           = sse / X.shape[0]
  , sec           = pseudoInverse.diag().dotMultiply(mse).dotPow(0.5)
  , tstats        = BHat.dotDivide(sec);

  /*
  console.log();
  console.log(XT.multiply(X).toString());
  console.log('invX:');
  console.log(pseudoInverse.toString());
  console.log('BHAT:', BHat.data);
  console.log('SEC :', sec.data);
   */

  return {
    weights : BHat,
    tstats  : tstats,
    mse     : mse
  };
};

/*
var x = math.matrix([[41.9, 29.1],
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
var y = math.matrix([251.3, 251.3, 248.3, 267.5,
                     273.0, 276.5, 270.3, 274.9,
                     285.0, 290.0, 297.0, 302.5,
                     304.5, 309.3, 321.7, 330.7,
                     349.0]);
var z = math.matrix([[1]]).resize([x.size()[0], 1], 1);
 */
