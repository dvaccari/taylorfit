/*global describe, it, before*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should;

const Matrix  = require('../../engine/matrix').Matrix
    , Model   = require('../../engine/model/model2')
    , Term    = require('../../engine/model/term')
    , utils   = require('../../engine/utils')
    , dataset = require('./testdata/test.data.json')
    , bi_md5  = require('blueimp-md5')
    , md5     = (x) => bi_md5(x);

describe('Term', () => {

  let data;

  before(() => {
    data = new Matrix(dataset.y).T.hstack(new Matrix(dataset.X));
  });

  describe('constructor()', () => {

    let m;

    before(() => {
      m = new Model()
        .setData(data)
        .setExponents([1, 2])
        .setMultiplicands(2);
    });

    it('creates a new term given a model and a valid set of tripels', () => {
      var t = new Term(m, [[1, 1], [2, 1]]);
      expect(t.valueOf()).to.eql([[1, 1, 0], [2, 1, 0]]);
      expect(t.col().data).to.eql(
        data.subset(':', 1).dotMultiply(data.subset(':', 2)).data
      );
    });

    it('throws when a model isnt given', () => {
      var f = () => new Term([[0, 1]]);
      expect(f).to.throw();
    });

  });

  describe('getStats()', () => {

    let m;

    before(() => {
      m = new Model()
        .setData(data)
        .setExponents([1, 2])
        .setMultiplicands(1);
      m.subset('fit', 0, 10);
      m.subset('test', 10);
    });

    it('returns the t-statistic and MSE when the candidate term is included', () => {
      let t = new Term(m, [[1, 1], [2, 1]]);
      let stats = t.getStats();

      ['mse', 'rsq', 'crsq', 'adjrsq', 'f', 'pf', 'aic', 'bic']
        .forEach((stat) => expect(stats).to.have.property(stat));
    });

    it('gets the proper stats for the given subset label', () => {
      let t = new Term(m, [[1, 1]]);
      let fitStats = t.getStats('fit');
      let testStats = t.getStats('test');

      // The training and test statistics should *most likely* not be equal
      expect(fitStats.mse).not.to.equal(testStats.mse);
    });

    // FIXME : need to cross check t-statistic values for accuracy

  });

  describe('equals()', () => {

    it('accurately compares two Term instances', () => {
      let m = new Model();
      let t1 = new Term(m, [[1, 1]]);
      let t2 = new Term(m, [[1, 1]]);
      let t3 = new Term(m, [[2, 1]]);
      let t4 = new Term(m, [[1, 2]]);
      let t5 = new Term(m, [[1, 1, 0]]);

      expect(t1).not.to.equal(t2);
      expect(t1.equals(t2)).to.be.true;
      expect(t1.equals(t3)).to.be.false;
      expect(t1.equals(t4)).to.be.false;
      expect(t1.equals(t5)).to.be.true;
    });

    it('accepts a set of [col, exp, lag]s (not a Term instance)', () => {
      let m = new Model();
      let t = new Term(m, [[1, 1]]);

      expect(t.equals([[1, 1]])).to.be.true;
      expect(t.equals([[1, 1, 0]])).to.be.true;
      expect(t.equals([[1, 2]])).to.be.false;
      expect(t.equals([[2, 1]])).to.be.false;
    });

  });

  describe('valueOf()', () => {

    it('returns the [[col, exp, lag], ...] set used to create the instance', () => {
      let t = new Term(new Model(), [[0, 1], [1, 1], [2, 1], [2, 2]]);
      expect(t.valueOf()).to.eql([[0, 1, 0], [1, 1, 0], [2, 1, 0], [2, 2, 0]]);
    });

  });

  describe('col()', () => {

    let m;

    before(() => {
      m = new Model().setData(data);
      m.subset('fit', 0, 10);
      m.subset('test', 10);
    });

    it('computes the column using the saved model\'s data', () => {
      let t = new Term(m, [[1, 1], [2, 2]]);
      let fitCol1 = data.subset(utils.range(0, 10), [1]);
      let fitCol2 = data.subset(utils.range(0, 10), [2]);

      expect(t.col().data).to.eql(
        fitCol1.dotMultiply(fitCol2.dotPow(2)).data);
    });

    it('computes the column for the given subset label', () => {
      let t = new Term(m, [[1, 1], [2, 2]]);
      let fitCol1 = data.subset(utils.range(10, data.shape[0]), [1]);
      let fitCol2 = data.subset(utils.range(10, data.shape[0]), [2]);

      expect(t.col('test').data).to.eql(
        fitCol1.dotMultiply(fitCol2.dotPow(2)).data);
    });

  });

  describe('get lag()', () => {

    it('gets the greatest lag (how much the col should be truncated by)', () => {
      let t = new Term(new Model(), [[1, 1, 0], [1, 1, 1], [1, 1, 2]]);
      expect(t.lag).to.equal(2);

      t = new Term(new Model(), [[3, 2, 10]]);
      expect(t.lag).to.equal(10);
    });

  });

  describe('static hash()', () => {

    it('returns the md5 hash of the sorted md5 hashes of the term\'s parts', () => {
      let t = new Term(new Model(), [[1, 2, 3], [4, 5, 6]]);
      let partHashes = [md5([1, 2, 3]), md5([4, 5, 6])];
      expect(Term.hash(t)).to.equal(md5(partHashes.sort().join()));
    });

  });

  // TODO: Perhaps make cache public so it can be tested

});
