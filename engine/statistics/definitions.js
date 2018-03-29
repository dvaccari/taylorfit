
const Statistic = require('./Statistic');
const Matrix    = require('../matrix');
const dist      = require('./distributions-socr');

// Functional definitions for statistics -- defines how they will be calculated
// NOTE: Make sure each statistic has an entry in `metadata.json`
module.exports = [
  // given
  Statistic('X', [], ({X}) => X),
  Statistic('y', [], ({y}) => y),
  Statistic('BHat', [], ({BHat}) => BHat),

  Statistic('yHat', ['X', 'BHat'], ({X, BHat}) => X.dot(BHat)),

  // fit statistics
  Statistic('nd', ['X'], ({X}) => X.shape[0]),
  Statistic('np', ['X'], ({X}) => X.shape[1]),

  Statistic('SSE', ['y', 'yHat'], ({y, yHat}) => y.sub(yHat).dotPow(2).sum()),
  Statistic('TSS', ['y'], ({y}) => y.sub(y.sum() / y.shape[0]).dotPow(2).sum()),

  // yHat.sub(y.sum() / y.shape[0]).dotPow(2).sum()));
  Statistic('SSR', ['TSS', 'SSE'], ({TSS, SSE}) => TSS - SSE),

  Statistic('Vary', ['TSS', 'nd'], ({TSS, nd}) => TSS / (nd - 1)),
  Statistic('MSR', ['SSR', 'np'], ({SSR, np}) => SSR / (np - 1)),

  Statistic('SKEW', ['y', 'yHat', 'nd'], ({y, yHat, nd}) => {
    let residuals = y.sub(yHat);
    let residMean = residuals.sum() / residuals.shape[0];
    let residStDv = Math.sqrt(residuals.sub(residMean).dotPow(2).sum() / (nd - 1));
 
    return nd * residuals.sub(residMean).dotPow(3).sum() / (nd - 1) / (nd - 2) / residStDv / residStDv / residStDv;
  }),
  Statistic('KURT', ['y', 'yHat', 'nd'], ({y, yHat, nd}) => {
    let residuals = y.sub(yHat);
    let residMean = residuals.sum() / residuals.shape[0];
    let residStDv = Math.sqrt(residuals.sub(residMean).dotPow(2).sum() / (nd - 1));
    
    // let r1 =  nd * (nd + 1) *residuals.sub(residMean).dotPow(4).sum() / (nd - 1) / (nd - 2) / (nd - 3) / residStDev / residStDv / residStDv / residStdDv;
    let r1 =  nd * (nd + 1) * residuals.sub(residMean).dotPow(4).sum() / (nd - 1) / (nd - 2) / (nd - 3) / residStDv / residStDv / residStDv/ residStDv;
    
    let r2 =  3 * (nd-1) * (nd-1) / (nd-2) / (nd-3);
    return r1 - r2;

  }),
  Statistic('seSKEW', ['nd'], ({nd}) => Math.sqrt(6 / nd)),
  Statistic('seKURT', ['nd'], ({nd}) => Math.sqrt(24 / nd)),
  Statistic('MSE', ['SSE', 'nd', 'np'], ({SSE, nd, np}) => SSE / (nd - np)),
  Statistic('RMSE', ['MSE'], ({MSE}) => Math.sqrt(MSE)),
  Statistic('Rsq', ['SSE', 'TSS'], ({SSE, TSS}) => 1 - (SSE / TSS)),
  Statistic('adjRsq', ['Rsq', 'np', 'nd'],
    ({Rsq, nd, np}) => 1 - ((1 - Rsq)*(nd - 1) / (nd - np))),
  Statistic('F', ['MSR', 'MSE'], ({MSR, MSE}) => MSR / MSE),

  Statistic('AIC', ['MSE', 'np', 'nd'],
    ({MSE, np, nd}) => Math.log10(MSE) + 2*(np / nd)),

  Statistic('BIC', ['MSE', 'np', 'nd'],
    ({MSE, np, nd}) => Math.log10(MSE) + np*(Math.log10(nd) / nd)),

  Statistic('MaxAbsErr', ['y', 'yHat'], ({y, yHat}) => y.sub(yHat).abs().max()),

  Statistic('t', ['X', 'VdivwSq', 'MSE', 'BHat'],
    ({X, VdivwSq, MSE, BHat}) => {
      var sec = new Matrix(1, X.shape[1])
        , stdModelErr, i;

      for (i = 0; i < X.shape[1]; i += 1) {
        stdModelErr = Math.sqrt(VdivwSq.row(i).sum() * MSE);
        sec.data[i] = stdModelErr;
      }

      return BHat.dotDivide(sec);
    }),

  Statistic('pt', ['t', 'np', 'nd'],
    ({t, np, nd}) => {
      let pt = t.clone();
      pt.data.set(pt.data.map((t) => Math.max(0, dist.pt(t, nd - np))));
      return pt;
    }),

  Statistic('pF', ['F', 'np', 'nd'],
    ({F, np, nd}) => Math.max(dist.pf(Math.abs(F), np, nd - np) - 1e-15, 0))
];
