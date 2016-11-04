
//const math = require('mathjs');

const fn = {
  //                 =   (X'X)^-1X'
  _psinv: math.parse("inv(A'*A)"),
  //               H =  X(X'X)^-1X'
  _hat  : math.parse("A*inv(A'*A)*A'"),
  //             MSE =     SSe       /  dof(A)
  _mse  : math.parse("(b'*(I - H)*b) / (n - k)"),
  //               B =  (X'X)^-1X'y
  _lstsq: math.parse("inv(A'*A)*A'*b"),

  _tstat: math.parse("B ./ sqrt(diag(C))"),

  hat   : (A) => fn._hat.eval({ A: A }),
  mse   : (A, b, H) => fn._mse.eval({
    A   : A,
    I   : math.eye(A.size()[0]),
    H   : H || fn.hat(A),
    b   : b,
    n   : A.size()[0],
    k   : A.size()[1]
  }),
  lstsq : (A, b) => math.squeeze(fn._lstsq.eval({ A: A, b: b })),
  tstat : (B, C) => fn._tstat.eval({ B: B, C: C })
};

module.exports.lstsq = fn.lstsq;
module.exports.hatmatrix = fn.hat;
module.exports.mse = fn.mse;

module.exports.lstsqWithStats = (A, b) => {
  var pseudoInverse = fn._psinv.eval({ A: A })
    , invTimzAPrime = math.multiply(pseudoInverse, math.transpose(A))
    , hatMatrix     = math.multiply(A, invTimzAPrime)
    , mse           = fn.mse(A, b, hatMatrix)
    , lstsq         = math.multiply(invTimzAPrime, b)
    , tstats        = fn.tstat(lstsq, math.multiply(mse, pseudoInverse));

  return {
    weights : lstsq,
    tstats  : tstats,
    mse     : mse
  };
};

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

x = math.concat(z, x);

//console.log(module.exports.hatmatrix(x));
console.log(module.exports.lstsqWithStats(x, y));
