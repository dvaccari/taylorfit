/*global Worker*/

var i = 0;

function unwrapMatrix(matrix) {
  return {
    m: matrix.shape[0],
    n: matrix.shape[1],
    data: matrix.data
  };
}


class CandidateWorker {

  constructor(scriptName) {
    if (!Worker) {
      throw new Error('Web workers unavailable');
    }
    this.id = i++;
    this.worker = new Worker(scriptName);
  }

  compute(terms, update) {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = ({ data: { data, type } }) => {
        switch (type) {
        case 'progress':
          update && update(this.id, data);
          break;

        case 'result':
          resolve(data.map((stats, i) => ({
            term: terms[i].valueOf(),
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

      let transformedTerms = terms.map((term) => {
        let X = unwrapMatrix(term.X());
        let y = unwrapMatrix(term.y());

        transferables.push(X.data, y.data);

        return { X, y };
      });

      this.worker.postMessage(transformedTerms, transferables);
    });
  }

}

module.exports = CandidateWorker;
