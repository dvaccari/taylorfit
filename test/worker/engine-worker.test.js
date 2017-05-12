/*global describe, it, before, expect, Worker*/

require('../../engine/worker/subworkers.js');
const EngineWorker = require('../../engine/worker/engine-worker.js');


let sendThenCheck = (worker, messages, after) => {
  let expectedMessages = messages.length;

  worker.onmessage = (message) => {
    message = message.data;

    if (message.type === 'candidates' && --expectedMessages <= 0) {
      after(message);
    }
  };

  messages.forEach((msg) => worker.postMessage(msg));
};


describe('worker adapter', () => {

  describe('setData()', () => {

    it('updates the model\'s dataset and returns candidates', (done) => {
      let worker = new EngineWorker();

      sendThenCheck(worker, [
        { type: 'setData', data: { data: [[1, 2, 3],
                                          [4, 5, 6],
                                          [7, 8, 9]] } }
      ], (message) => {
        expect(message.data).to.be.an('array');
        expect(message.data.length).to.equal(3);
        done();
      });
    });

  });

  describe('setExponents()', () => {

    it('updates model\'s exponents, returns proper candidates', (done) => {
      let worker = new EngineWorker();

      sendThenCheck(worker, [
        { type: 'setData', data: { data: [[ 1,  2,  3],
                                          [ 4,  5,  6],
                                          [ 7,  8,  9],
                                          [10, 11, 12],
                                          [13, 14, 15]] } },
        { type: 'setExponents', data: [1, 2] }
      ], (message) => {
        expect(message.data).to.be.an('array');
        expect(message.data.length).to.equal(5);
        expect(message.data.map((cand) => cand.term)).to.eql([
          [[0, 0, 0]],
          [[1, 1, 0]], [[1, 2, 0]],
          [[2, 1, 0]], [[2, 2, 0]]
        ]);
        done();
      });
    });

  });

  describe('setMultiplicands()', () => {

    it('updates model\'s multiplicands, returns proper candidates', (done) => {
      let worker = new EngineWorker();

      sendThenCheck(worker, [
        { type: 'setData', data: { data: [[ 1,  2,  3],
                                          [ 4,  5,  6],
                                          [ 7,  8,  9],
                                          [10, 11, 12],
                                          [13, 14, 15]] } },
        { type: 'setMultiplicands', data: 2 }
      ], (message) => {
        expect(message.data).to.be.an('array');
        expect(message.data.length).to.equal(4);
        expect(message.data.map((cand) => cand.term)).to.eql([
          [[0, 0, 0]],
          [[1, 1, 0]], [[2, 1, 0]],
          [[1, 1, 0], [2, 1, 0]]
        ]);
        done();
      });
    });

  });

  describe('setDependent()', () => {

    it('updates model\'s dependent col, returns proper candidates', (done) => {
      let worker = new EngineWorker();
      let next;

      sendThenCheck(worker, [
        { type: 'setData', data: { data: [[ 1,  2,  3],
                                          [ 4,  5,  6],
                                          [ 7,  8,  9],
                                          [10, 11, 12],
                                          [13, 14, 15]] } },
        { type: 'setExponents', data: [1, 2] },
        { type: 'setDependent', data: 2 }
      ], (message) => {
        expect(message.data).to.be.an('array');
        expect(message.data.length).to.equal(5);
        expect(message.data.map((cand) => cand.term)).to.eql([
          [[0, 0, 0]],
          [[0, 1, 0]], [[0, 2, 0]],
          [[1, 1, 0]], [[1, 2, 0]]
        ]);
        done();
      });

    });

  });

});
