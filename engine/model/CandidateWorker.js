/*global Worker*/

const { FIT_LABEL, CROSS_LABEL }  = require('../labels.json');
//const CandidateWorkerScript       = require('../worker/candidate-worker.js');
const perf                        = require('../perf');

const randomId = () => Math.floor(Math.random() * 1e16).toString(16);

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
    this.worker = new Worker('candidate-worker.js');
    this.model = model;
  }

  compute(candidates, update) {
    let thisJobId = randomId();

    return new Promise((resolve, reject) => {
      this.worker.addEventListener(
        'message',
        ({ data: { data, type, jobId } }) => {
          if (jobId !== thisJobId) {
            return;
          }

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
            perf.end('candidate-worker');
            break;

          default:
            console.error(`[CandidateWorker${this.id}]: Invalid type '${type}'`);
            break;
          }
        }
      );
      perf.start('candidate-worker');

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

      this.worker.postMessage({
        fit,
        cross,
        candidates: unwrappedCandidates,
        jobId: thisJobId
      }, transferables);
    });
  }

}

module.exports = CandidateWorker;
