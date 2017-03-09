/*global describe, it, before*/

const chai      = require('chai')
    , expect    = chai.expect
    , should    = chai.should;

const Matrix    = require('../../engine/matrix').Matrix
    , Model     = require('../../engine/model/model2')
    , TermPool  = require('../../engine/model/termpool')
    , Term      = require('../../engine/model/term')
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
      expect(tp.terms).to.include(term);
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
