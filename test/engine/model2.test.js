/*global describe, it, before*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should;

const Matrix  = require('../../engine/matrix').Matrix
    , Term    = require('../../engine/model/term')
    , combos  = require('../../engine/model/combos')
    , utils   = require('../../engine/utils')
    , Model   = require('../../engine/model/model2')
    , dataset = require('./testdata/test.data.json');

let valuesOf = (arr) => arr.map((elem) => elem.valueOf());

describe('Model2', () => {

  let data;

  before(() => {
    data = new Matrix(dataset.y).T.hstack(new Matrix(dataset.X));
  });

  describe('constructor()', () => {

    it('makes an empty model', () => {
      var m = new Model();

      expect(m.X().data).to.eql(new Matrix(0, 0).data);
      expect(m.data().data).to.eql(new Matrix(0, 0).data);
      expect(m.getTerms().length).to.equal(0);
      expect(m.termpool).not.to.be.undefined;
    });

  });

  describe('addTerm()', () => {

    it('accepts a valid term [[col, exp, lag], ...]', () => {
      var m = new Model();

      m.addTerm([[0, 1, 0]]);
      expect(valuesOf(m.getTerms())).to.eql([[[0, 1, 0]]]);

      m.addTerm([[1, 1, 0]]);
      expect(valuesOf(m.getTerms())).to.eql([[[0, 1, 0]], [[1, 1, 0]]]);

      m.addTerm([[0, 1, 0], [1, 1, 0]]);
      expect(valuesOf(m.getTerms())).to.eql([[[0, 1, 0]],
                                             [[1, 1, 0]],
                                             [[0, 1, 0], [1, 1, 0]]]);
    });

    it('accepts a term without an explicit lag (assumes 0)', () => {
      var m = new Model();

      m.addTerm([[0, 1]]);
      expect(valuesOf(m.getTerms())).to.eql([[[0, 1, 0]]]);
    });

    it('does not add duplicate terms', () => {
      var m = new Model()
        , lengthAfterFirstAdd;

      m.addTerm([[0, 1, 0]]);
      lengthAfterFirstAdd = m.getTerms().length;

      expect(valuesOf(m.getTerms())).to.eql([[[0, 1, 0]]]);

      m.addTerm([[0, 1]]);
      expect(valuesOf(m.getTerms())).to.eql([[[0, 1, 0]]]);

      expect(m.getTerms().length).to.equal(lengthAfterFirstAdd);
    });

    it('throw a TypeError if `term` is not an array', () => {
      var f = () => new Model().setData(data).addTerm('hola');
      expect(f).to.throw();
    });

  });

  describe('removeTerm()', () => {

    it('removes an existing term', () => {
      var m = new Model()
            .setData(data)
            .setExponents([1, 2])
            .setMultiplicands(2);

      m.addTerm([[0, 1]]);
      expect(valuesOf(m.getTerms())).to.eql([[[0, 1, 0]]]);

      m.removeTerm([[0, 1]]);
      expect(valuesOf(m.getTerms())).to.eql([]);

      m.addTerm([[0, 1], [1, 2]]);
      expect(valuesOf(m.getTerms())).to.eql([[[0, 1, 0], [1, 2, 0]]]);

      m.removeTerm([[0, 1], [1, 2]]);
      expect(valuesOf(m.getTerms())).to.eql([]);
    });

    it('does nothing if the term is not found', () => {
      var m = new Model();

      m.addTerm([[0, 1]]);
      m.removeTerm([[1, 0]]);
      expect(valuesOf(m.getTerms())).to.eql([[[0, 1, 0]]]);
    });

  });

  describe('setData()', () => {

    it('sets the dataset', () => {
      let m = new Model();
      m.setData(data);
      expect(m.data().data).to.eql(data.data);
    });

    it('resets the terms', () => {
      let m = new Model();

      m.addTerm([[0, 1]]);
      expect(valuesOf(m.getTerms())).to.eql([[[0, 1, 0]]]);

      m.setData(data);
      expect(valuesOf(m.getTerms())).to.eql([]);
    });

    it('sets the default subset to encompass the entire dataset', () => {
      let m = new Model();
      m.setData(data);
      expect(m.data(m.DEFAULT_SUBSET).data).to.eql(data.data);
    });

  });

  describe('setExponents()', () => {

    it('sets list of exponents to generate terms with', () => {
      let m = new Model().setData(data);

      expect(m.getCandidates().map((c) => c.term))
        .not.to.deep.include.members([[[1, 2, 0]]]);

      m.setExponents([1, 2]);
      expect(m.getCandidates().map((c) => c.term))
        .to.deep.include.members([[[1, 2, 0]]]);
    });

  });

  describe('setMultiplicands()', () => {

    it('sets the number of multiplicands to generate terms with', () => {
      let m = new Model().setData(data);

      expect(m.getCandidates().map((c) => c.term.valueOf()))
        .not.to.deep.include.members([[[1, 1, 0], [2, 1, 0]]]);

      m.setMultiplicands(2);
      expect(m.getCandidates().map((c) => c.term))
        .to.deep.include.members([[[1, 1, 0], [2, 1, 0]]]);
    });

  });

  describe('setDependent()', () => {

    it('defaults to the 0 column', () => {
      let m = new Model().setData(data);

      expect(m.getCandidates().map((c) => c.term))
        .not.to.deep.include.members([[[0, 1, 0]]]);
    });

    it('sets the dependent variable/column', () => {
      let m = new Model().setData(data);

      expect(m.getCandidates().map((c) => c.term))
        .not.to.deep.include.members([[[0, 1, 0]]]);
      expect(m.getCandidates().map((c) => c.term))
        .to.deep.include.members([[[1, 1, 0]], [[2, 1, 0]]]);

      m.setDependent(1);

      expect(m.getCandidates().map((c) => c.term))
        .not.to.deep.include.members([[[1, 1, 0]]]);
      expect(m.getCandidates().map((c) => c.term))
        .to.deep.include.members([[[0, 1, 0]], [[2, 1, 0]]]);
    });

  });

  describe('setLags()', () => {

    it('sets the lags to generate terms with', () => {
      let m = new Model().setData(data);

      expect(m.getCandidates().map((c) => c.term))
        .not.to.deep.include.members([[[1, 1, 1]]]);

      m.setLags([1]);
      expect(m.getCandidates().map((c) => c.term))
        .to.deep.include.members([[[1, 1, 0]]]);
    });

  });

  describe('subset()', () => {

    it('creates a new partition of the data', () => {
      let m = new Model().setData(data);

      expect(m.data().data).to.eql(data.data);

      m.subset('fit', 0, 11);
      expect(m.data('fit').data).to.eql(
        data.subset(utils.range(0, 11), ':').data);
    });

    it('overwrites existing subsets', () => {
      let m = new Model().setData(data);

      expect(m.data().data).to.eql(data.data);

      m.subset('test', 0, 11);
      expect(m.data('test').data).to.eql(
        data.subset(utils.range(0, 11), ':').data);

      m.subset('test', 5, 11);
      expect(m.data('test').data).to.eql(
        data.subset(utils.range(5, 11), ':').data);
    });

    it('takes an array of explicit rows', () => {
      let m = new Model().setData(data);

      m.subset('test', [3, 5, 7]);
      expect(m.data('test').data).to.eql(
        data.subset([3, 5, 7], ':').data);
    });

    it('defaults end index to the end of the dataset', () => {
      let m = new Model().setData(data);

      m.subset('validation', 5);
      expect(m.data('validation').data).to.eql(
        data.subset(utils.range(5, data.shape[0]), ':').data);
    });

  });

  describe('getTerms()', () => {

    it('retrieves all of the terms in the model', () => {
      let m = new Model().setData(data);
      m.addTerm([[1, 1]]);
      expect(valuesOf(m.getTerms())).to.eql([[[1, 1, 0]]]);
    });

    it('returns a list of Term objects', () => {
      let m = new Model().setData(data);
      m.addTerm([[1, 1]]);
      expect(m.getTerms()[0]).to.be.an.instanceof(Term);
    });

  });

  describe('getCandidates()', () => {

    it('gets candidate terms per exponents, multiplicands, and lags', () => {
      let m = new Model().setData(data);

      expect(m.getCandidates().map((c) => c.term))
        .to.eql([[[0, 0, 0]], [[1, 1, 0]], [[2, 1, 0]]]);

      m.setExponents([1, 2]);
      expect(m.getCandidates().map((c) => c.term))
        .to.eql([[[0, 0, 0]],
                 [[1, 1, 0]], [[1, 2, 0]],
                 [[2, 1, 0]], [[2, 2, 0]]]);

      m.setExponents([1]);
      m.setMultiplicands(2);
      expect(m.getCandidates().map((c) => c.term))
        .to.eql([[[0, 0, 0]],
                 [[1, 1, 0]], [[2, 1, 0]],
                 [[1, 1, 0], [2, 1, 0]]]);

      m.setMultiplicands(1);
      m.setLags([1]);
      expect(m.getCandidates().map((c) => c.term))
        .to.eql([[[0, 0, 0]],
                 [[1, 1, 0]], [[1, 1, 1]],
                 [[2, 1, 0]], [[2, 1, 1]],
                 [[0, 1, 1]]]);
    });

    it('excludes terms already in the model', () => {
      let m = new Model().setData(data);
      expect(m.getCandidates().map((c) => c.term))
        .to.eql([[[0, 0, 0]], [[1, 1, 0]], [[2, 1, 0]]]);

      m.addTerm([[1, 1]]);
      expect(m.getCandidates().map((c) => c.term))
        .to.eql([[[0, 0, 0]], [[2, 1, 0]]]);
    });

    it('has a `term`, `coeff`, and `stats` props for each term', () => {
      let m = new Model().setData(data);
      let cand = m.getCandidates()[1];

      expect(cand).to.have.property('term');
      expect(cand.term).to.be.an('array');

      expect(cand).to.have.property('coeff');
      expect(cand.coeff).to.be.a('number');

      expect(cand).to.have.property('stats');

      ['mse', 'rsq', 'crsq', 'adjrsq', 'f', 'pf', 't', 'pt', 'aic', 'bic']
        .forEach((stat) => expect(cand.stats[stat]).to.be.a('number'));
    });

  });

  describe('getModel', () => {

    it('gets the current model, with all statistics', () => {
      let m = new Model().setData(data);

      m.addTerm([[1, 1]]);
      m.addTerm([[2, 1]]);

      let model = m.getModel();

      expect(model).to.have.property('terms');
      expect(model.terms.length).to.equal(2);
      model.terms.forEach((term) => {
        expect(term.term).to.be.an('array');
        expect(term.coeff).to.be.a('number');
        expect(term.stats.t).to.be.a('number');
        expect(term.stats.pt).to.be.a('number');
      });

      expect(model).to.have.property('stats');
      ['mse', 'rsq', 'crsq', 'adjrsq', 'f', 'pf', 'aic', 'bic']
        .forEach((stat) => expect(model.stats).to.have.property(stat));
    });

    it('accepts a subset label to use as a test set', () => {
      let m = new Model().setData(data);

      m.addTerm([[1, 1]]);
      m.addTerm([[2, 1]]);

      m.subset('test', 10);

      let train = m.getModel();
      let test = m.getModel('test');

      expect(train.terms[0].coeff).to.equal(test.terms[0].coeff);
      expect(train.terms[0].stats.t).not.to.equal(test.terms[0].stats.t);
    });

  });

});
