
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
  Statistic('MSR', ['SSR', 'np'], ({SSR, np}) => SSR / (np - 0)),
  Statistic('MSE', ['SSE', 'nd', 'np'], ({SSE, nd, np}) => SSE / (nd - np)),
  Statistic('Rsq', ['SSE', 'TSS'], ({SSE, TSS}) => 1 - (SSE / TSS)),
  Statistic('cRsq', ['Rsq'], ({Rsq}) => 1 - Rsq),
  Statistic('adjRsq', ['Rsq', 'np', 'nd'],
    ({Rsq, nd, np}) => 1 - ((1 - Rsq)*(nd - 1) / (nd - np - 1))),
  Statistic('F', ['MSR', 'MSE'], ({MSR, MSE}) => MSR / MSE),

  Statistic('AIC', ['MSE', 'np', 'nd'],
    ({MSE, np, nd}) => Math.log10(MSE) + 2*(np / nd)),

  Statistic('BIC', ['MSE', 'np', 'nd'],
    ({MSE, np, nd}) => Math.log10(MSE) + np*(Math.log10(nd) / nd)),


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
      pt.data.set(pt.data.map((t) => dist.pt(t, nd - np)));
      return pt;
    }),

  Statistic('pF', ['F', 'np', 'nd'],
    ({F, np, nd}) => dist.pf(Math.abs(F), nd - np, np))
];
