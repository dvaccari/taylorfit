/*global Worker*/

const { FIT_LABEL, CROSS_LABEL }  = require('../labels.json');
const CandidateWorkerScript       = require('../worker/candidate-worker.js');

let counter = (() => {
  let next = 0;
  return () => next += 1;
})();

function unwrapMatrix(matrix) {
  return {
    m: matrix.shape[0],
    n: matrix.shape[1],
    data: matrix.data
  };
}

class CandidateWorker {

  constructor(model) {
    if (typeof Worker === 'undefined' || !Worker) {
      throw new Error('Web workers unavailable');
    }
    this.id = counter();
    this.worker = new CandidateWorkerScript();
    this.model = model;
  }

  compute(candidates, update) {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = ({ data: { data, type } }) => {
        switch (type) {
        case 'progress':
          update && update(this.id, data);
          break;

        case 'result':
          resolve(data.map((stats, i) => ({
            term: candidates[i].valueOf(),
            coeff: stats.coeff,
            stats
          })));
          console.timeEnd(`CANDIDATEWORKER[${this.id}]`);
          break;

        default:
          console.error(`[CandidateWorker${this.id}]: Invalid type '${type}'`);
          break;
        }
      };
      console.time(`CANDIDATEWORKER[${this.id}]`);

      let transferables = [];

      let fit = {
        X: unwrapMatrix(this.model.X(FIT_LABEL)),
        y: unwrapMatrix(this.model.y(FIT_LABEL))
      };

      let cross;
      try {
        cross = {
          X: unwrapMatrix(this.model.X(CROSS_LABEL)),
          y: unwrapMatrix(this.model.y(CROSS_LABEL))
        };
      } catch (e) {
        cross = fit;
      }

      console.time('TERMINATRIX' + this.id);
      let unwrappedCandidates = candidates.map((term) => {
        let fit = unwrapMatrix(term.col(FIT_LABEL));
        let lag = Math.max(this.model.highestLag(), term.lag);
        let cross;

        try {
          cross = unwrapMatrix(term.col(CROSS_LABEL));
        } catch (e) {
          cross = fit;
        }

        transferables.push(fit.data, cross.data);

        return { fit, lag, cross };
      });
      console.timeEnd('TERMINATRIX' + this.id);

      this.worker.postMessage({
        fit,
        cross,
        candidates: unwrappedCandidates
      }, transferables);
    });
  }

}

module.exports = CandidateWorker;
