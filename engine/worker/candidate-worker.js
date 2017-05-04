/*global postMessage, onmessage*/

require('./subworkers');

const UPDATE_INTERVAL = 200;

const Matrix  = require('../matrix');
const lstsq   = require('../regression').lstsq;

onmessage = ({ data }) => {
  let results = data.map(({ X, y }, i) => {
    let theStats;

    // reconstruct matrices (they were deconstructed for transport)
    X = new Matrix(X.m, X.n, X.data);
    y = new Matrix(y.m, y.n, y.data);

    if (i % UPDATE_INTERVAL === 0) {
      postMessage({ type: 'progress', data: i });
    }

    try {
      theStats = lstsq(X, y);
      theStats.coeff = theStats.weights.get(0, theStats.weights.shape[0]-1);
      theStats.t = theStats.t.get(0, theStats.t.shape[0]-1);
      theStats.pt = theStats.pt.get(0, theStats.pt.shape[0]-1);
      delete theStats.weights;

      return theStats;
    } catch (e) {
      console.error(e);
      console.log(this.valueOf());
      console.log(this.col());
      return NaN;
    }
  });
  postMessage({ type: 'result', data: results });
};

