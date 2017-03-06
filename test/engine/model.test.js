/*global describe, it, before*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should;

const Matrix  = require('../../engine/matrix').Matrix
    , combos  = require('../../engine/model/combos')
    , Model   = require('../../engine/model/model')
    , dataset = require('./testdata/test.data.json');

describe.skip('Model', () => {

  var data;

  before(() => {
    data = {
      X: new Matrix(dataset.X),
      y: new Matrix(dataset.y).T,
      headers: dataset.headers
    };
  });

  describe('constructor()', () => {

    it('accepts an input data matrix and an expected output vector', () => {
      var m = new Model(data.X, data.y, [1, 2], 1);
      expect(m.X).to.eql(data.X);
      expect(m.weights).to.eql([]);
      expect(m.terms.length).to.equal(1);
    });

    it('computes an augmented matrix if a list of terms is given', () => {
      var terms = combos.generateTerms(data.X.shape[1], [1, 2], [1]);
      var m = new Model(data.X, data.y, [1, 2], 1, terms);

      m.terms.forEach((term, i) => {
        expect(data.X.subset(':', term.term[0][0]).dotPow(term.term[0][1]))
          .to.eql(m.data.subset(':', i));
      });
    });

  });

  describe('addTerm()', () => {

    it('accepts a valid term [[column, exponent], ...]', () => {
      var m = new Model(data.X, data.y, [1, 2], 2);

      m.addTerm([[0, 1]]);
      expect(m.terms.map((t) => t.term)).to.include.deep.members([[[0, 1]]]);
      m.addTerm([[1, 1]]);
      expect(m.terms.map((t) => t.term)).to.include.deep.members([
        [[0, 1]],
        [[1, 1]]
      ]);
      m.addTerm([[0, 1], [1, 1]]);
      expect(m.terms.map((t) => t.term)).to.include.deep.members([
        [[0, 1]],
        [[1, 1]],
        [[0, 1], [1, 1]]
      ]);
    });

    it('does not add duplicate terms', () => {
      var m = new Model(data.X, data.y, [1, 2], 1)
        , lengthAfterFirstAdd;

      m.addTerm([[0, 1]]);
      lengthAfterFirstAdd = m.terms.length;
      expect(m.terms.map((t) => t.term)).to.include.deep.members([[[0, 1]]]);

      m.addTerm([[0, 1]]);
      expect(m.terms.map((t) => t.term)).to.include.deep.members([[[0, 1]]]);
      expect(m.terms.length).to.equal(lengthAfterFirstAdd);
    });

    it('throw a TypeError if `term` is not an array', () => {
      var f = () => new Model(data.X, data.y).addTerm('hola');
      expect(f).to.throw(TypeError);
    });

    it('throw a DimensionError if `term` is not the proper shape', () => {
      var f = () => new Model(data.X, data.y).addTerm([1, 2]);
      expect(f).to.throw(/*some kind of dimension error*/);
    });

    it('recomputes the augmented data matrix & weights automatically', () => {
      var m = new Model(data.X, data.y);
      var ones = new Matrix(data.X.shape[0], 1).add(1);

      m.addTerm([[0, 1]]);
      expect(m.data.data).to.eql(ones.hstack(data.X.subset(':', 0)).data);
      m.addTerm([[1, 1]]);
      expect(m.data.data).to.eql(ones.hstack(data.X.subset(':', [0, 1])).data);
    });

  });

  describe('removeTerm()', () => {

    it('removes an existing term', () => {
      var m = new Model(data.X, data.y, [1, 2], 2);

      m.addTerm([[0, 1]]);
      expect(m.terms.map((t) => t.term)).to.include.deep.members([[[0, 0]], [[0, 1]]]);
      m.removeTerm([[0, 1]]);
      expect(m.terms.map((t) => t.term)).to.eql([[[0, 0]]]);
      m.addTerm([[0, 1], [1, 2]]);
      expect(m.terms.map((t) => t.term)).to.include.deep.members([[[0, 0]], [[0, 1], [1, 2]]]);
      m.removeTerm([[0, 1], [1, 2]]);
      expect(m.terms.map((t) => t.term)).to.eql([[[0, 0]]]);
    });

    it('does nothing if the term is not found', () => {
      var m = new Model(data.X, data.y);

      m.addTerm([[0, 1]]);
      m.removeTerm([[1, 0]]);
      expect(m.terms.map((t) => t.term)).to.include.deep.members([[[0, 1]]]);
    });

  });

  describe('compute()', () => {});
  describe('predict()', () => {});
  describe('toJSON()', () => {});

});
