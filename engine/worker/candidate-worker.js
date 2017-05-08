/*global postMessage, onmessage*/

require('./subworkers');

const UPDATE_INTERVAL = 200;

const Matrix      = require('../matrix');
const lstsq       = require('../regression').lstsq;
const statistics  = require('../statistics');

onmessage = ({ data: { fit, cross, candidates } }) => {
  fit.X = new Matrix(fit.X.m, fit.X.n, fit.X.data);
  fit.y = new Matrix(fit.y.m, fit.y.n, fit.y.data);

  if (cross !== fit) {
    cross.X = new Matrix(cross.X.m, cross.X.n, cross.X.data);
    cross.y = new Matrix(cross.y.m, cross.y.n, cross.y.data);
  }

  let model = { fit, cross };

  let results = candidates.map(({ fit, cross, lag }, i) => {
    // reconstruct matrices (they were deconstructed for transport)
    fit = {
      X: model.fit.X
        .hstack(new Matrix(fit.m, fit.n, fit.data))
        .lo(lag),
      y: model.fit.y.lo(lag)
    };
    cross = {
      X: model.cross.X
        .hstack(new Matrix(cross.m, cross.n, cross.data))
        .lo(lag),
      y: model.cross.y.lo(lag)
    };

    if (i % UPDATE_INTERVAL === 0) {
      postMessage({ type: 'progress', data: i });
    }

    try {
      let regression = lstsq(fit.X, fit.y);
      Object.assign(regression, { X: cross.X, y: cross.y });

      let stats = statistics(regression);

      stats.coeff = stats.weights.get(0, stats.weights.shape[0]-1);
      stats.t = stats.t.get(0, stats.t.shape[0]-1);
      stats.pt = stats.pt.get(0, stats.pt.shape[0]-1);
      delete stats.weights;

      return stats;
    } catch (e) {
      console.error(e);
      return NaN;
    }
  });
  postMessage({ type: 'result', data: results });
};

