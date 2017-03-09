/*global describe, it, before, expect, Worker*/


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

  describe('update(dataset)', () => {

    it('updates the model\'s dataset and returns candidates', (done) => {
      let worker = new Worker('/base/build/engine-worker.js');

      sendThenCheck(worker, [
        { type: 'update', data: { dataset: [[1, 2, 3],
                                            [4, 5, 6],
                                            [7, 8, 9]] } }
      ], (message) => {
        expect(message.data).to.be.an('array');
        expect(message.data.length).to.equal(3);
        done();
      });
    });

  });

  describe('update(exponents)', () => {

    it('updates model\'s exponents, returns proper candidates', (done) => {
      let worker = new Worker('/base/build/engine-worker.js');

      sendThenCheck(worker, [
        { type: 'update', data: { dataset: [[ 1,  2,  3],
                                            [ 4,  5,  6],
                                            [ 7,  8,  9],
                                            [10, 11, 12],
                                            [13, 14, 15]] } },
        { type: 'update', data: { exponents: [1, 2] } }
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

  describe('update(multiplicands)', () => {

    it('updates model\'s multiplicands, returns proper candidates', (done) => {
      let worker = new Worker('/base/build/engine-worker.js');

      sendThenCheck(worker, [
        { type: 'update', data: { dataset: [[ 1,  2,  3],
                                            [ 4,  5,  6],
                                            [ 7,  8,  9],
                                            [10, 11, 12],
                                            [13, 14, 15]] } },
        { type: 'update', data: { multiplicands: 2 } }
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

  describe('update(dependent)', () => {

    it('updates model\'s dependent col, returns proper candidates', (done) => {
      let worker = new Worker('/base/build/engine-worker.js');
      let next;

      sendThenCheck(worker, [
        { type: 'update', data: { dataset: [[ 1,  2,  3],
                                            [ 4,  5,  6],
                                            [ 7,  8,  9],
                                            [10, 11, 12],
                                            [13, 14, 15]] } },
        { type: 'update', data: { exponents: [1, 2] } },
        { type: 'update', data: { dependent: 2 } }
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
