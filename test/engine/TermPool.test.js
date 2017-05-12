/*global describe, it, before*/

const chai      = require('chai')
    , expect    = chai.expect
    , should    = chai.should;

const Matrix    = require('../../engine/matrix')
    , Model     = require('../../engine/model')
    , TermPool  = require('../../engine/model/TermPool')
    , Term      = require('../../engine/model/Term')
    , utils     = require('../../engine/utils')
    , dataset   = require('./testdata/test.data.json');

describe('TermPool', () => {

  let data, model;

  before(() => {
    data = new Matrix(dataset.y).T.hstack(new Matrix(dataset.X));
    model = new Model().setData(data).setExponents([1, 2]);
  });

  describe('constructor()', () => {

    it('creates an empty pool of terms', () => {
      let tp = new TermPool(model);
      expect(tp.model).to.equal(model);
      expect(tp.terms).to.be.empty;
    });

  });

  describe('get()', () => {

    it('creates + saves a new Term if it is not found', () => {
      let tp = new TermPool(model);
      expect(tp.terms).to.be.empty;

      let term = tp.get([[1, 2, 0]]);
      expect(term.valueOf()).to.eql([[1, 2, 0]]);
      expect(tp.terms).to.have.property(Term.hash(term), term);
    });

    it('returns a found term instance', () => {
      let tp = new TermPool(model);
      expect(tp.terms).to.be.empty;

      let term = tp.get([[1, 1, 0]]);
      expect(term).to.equal(Object.values(tp.terms)[0]);

      expect(tp.get([[1, 1, 0]])).to.equal(term);
      expect(tp.get([[1, 1]])).to.equal(term);
      expect(tp.get([[1, 2, 0]])).not.to.equal(term);
      expect(tp.get([[1, 2]])).not.to.equal(term);
    });

  });

});
