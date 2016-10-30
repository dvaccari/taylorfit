/*global describe, it, before*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should;

const math    = require('mathjs')
    , combos  = require('../../engine/combos')
    , Model   = require('../../engine/model')
    , dataset = require('./test.data.json');

describe('Model', () => {

  var data;

  before(() => {
    data = {
      X: math.matrix(dataset.X),
      y: math.matrix(dataset.y),
      headers: dataset.headers
    };
  });

  describe('constructor()', () => {

    it('accepts an input data matrix and an expected output vector', () => {
      var m = new Model(data.X, data.y);
      expect(m.data).to.eql(data.X);
      expect(m.weights).to.eql([]);
      expect(m.terms).to.eql([]);
    });

    it('computes an augmented matrix if a list of terms is given', () => {
      var terms = combos.generateTerms(data.X.size()[1], [1, 2], [1]);
      var m = new Model(data.X, data.y, terms);

      m.terms.forEach((term, i) => {
        var dataindex = math.index(math.range(0, m.data.size()[0]), term[0][0]);
        var augindex = math.index(math.range(0, m.data.size()[0]), i);

        expect(math.dotPow(data.X.subset(dataindex), term[0][1]))
          .to.eql(m.data.subset(augindex));
      });
    });

  });

  describe('addTerm()', () => {

    it('accepts a valid term [[column, exponent], ...]', () => {
      var m = new Model(data.X, data.y);

      m.addTerm([[0, 1]]);
      expect(m.terms).to.include.deep.members([[[0, 1]]]);
      m.addTerm([[1, 1]]);
      expect(m.terms).to.include.deep.members([
        [[0, 1]],
        [[1, 1]]
      ]);
      m.addTerm([[0, 1], [1, 1]]);
      expect(m.terms).to.include.deep.members([
        [[0, 1]],
        [[1, 1]],
        [[0, 1], [1, 1]]
      ]);
    });

    it('does not add duplicate terms', () => {
      var m = new Model(data.X, data.y);

      m.addTerm([[0, 1]]);
      expect(m.terms).to.include.deep.members([[[0, 1]]]);
      m.addTerm([[0, 1]]);
      expect(m.terms).to.include.deep.members([[[0, 1]]]);
      expect(m.terms.length).to.equal(1);
    });

    it('throw a TypeError if `term` is not an array', () => {
      var f = () => new Model(data.X, data.y).addTerm('hola');
      expect(f).to.throw(TypeError);
    });

    it('throw a DimensionError if `term` is not the proper shape', () => {
      var f = () => new Model(data.X, data.y).addTerm([1, 2]);
      expect(f).to.throw(math.error.DimensionError);
    });

    it('recomputes the augmented data matrix & weights automatically', () => {
      var m = new Model(data.X, data.y);

      m.addTerm([[0, 1]]);
      expect(m.data).to.eql(data.X.subset(
        math.index(math.range(0, data.X.size()[0]), 0)
      ));
      m.addTerm([[1, 1]]);
      expect(m.data).to.eql(data.X.subset(
        math.index(math.range(0, data.X.size()[0]), [0, 1])
      ));
    });

  });

  describe('removeTerm()', () => {

    it('removes an existing term', () => {
      var m = new Model(data.X, data.y);

      m.addTerm([[0, 1]]);
      expect(m.terms).to.include.deep.members([[[0, 1]]]);
      m.removeTerm([[0, 1]]);
      expect(m.terms).to.eql([]);
      m.addTerm([[0, 1], [1, 2]]);
      expect(m.terms).to.include.deep.members([[[0, 1], [1, 2]]]);
      m.removeTerm([[0, 1], [1, 2]]);
      expect(m.terms).to.eql([]);
    });

    it('does nothing if the term is not found', () => {
      var m = new Model(data.X, data.y);

      m.addTerm([[0, 1]]);
      m.removeTerm([[1, 0]]);
      expect(m.terms).to.include.deep.members([[[0, 1]]]);
    });

  });

  describe('compute()', () => {});
  describe('predict()', () => {});
  describe('toJSON()', () => {});

});
