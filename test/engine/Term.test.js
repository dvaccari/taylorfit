/*global describe, it, before, beforeEach*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should;

const Matrix  = require('../../engine/matrix')
    , Model   = require('../../engine/model')
    , Term    = require('../../engine/model/Term')
    , utils   = require('../../engine/utils')
    , dataset = require('./testdata/test.data.json');

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

    beforeEach(() => {
      m = new Model()
        .setData(data)
        .setData(data, 'cross')
        .setData(data, 'validation')
        .setExponents([1, 2])
        .setMultiplicands(1)
        .subset('fit', 0, 10)
        .subset('cross', 10)
        .subset('validation', 10);
    });

    it('returns the statistics when the candidate term is included', () => {
      let t = new Term(m, [[1, 1], [2, 1]]);
      let stats = t.getStats();

      ['MSE', 'Rsq', 'cRsq', 'adjRsq', 'F', 'pF', 'AIC', 'BIC']
        .forEach((stat) => expect(stats).to.have.property(stat));
    });

    it('fits with "fit", but gets the stats using the "cross" data', () => {
      let t = new Term(m, [[1, 1]]);
      let termStats = t.getStats();

      m.addTerm([[1, 1]]);
      let crossModelStatsWithTerm = m.getModel('cross').stats;
      let fitModelStatsWithTerm = m.getModel('fit').stats;

      // With the term included, cross validation stats should equal what
      // Term.getStats() gave us. Fit stats, on the other hand, should not
      expect(termStats.MSE).to.equal(crossModelStatsWithTerm.MSE);
      expect(termStats.MSE).not.to.equal(fitModelStatsWithTerm.MSE);
    });

    // TODO : need to cross check t-statistic values for accuracy

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

    beforeEach(() => {
      m = new Model().setData(data).setData(data, 'test');
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

    it('returns an ordered stringy representation of the term\'s parts', () => {
      let t = new Term(new Model(), [[1, 2, 3], [4, 5, 6]]);
      expect(Term.hash(t)).to.equal('(1,2,3),(4,5,6)');
    });

    it('will fix missing lags in a part (by appending 0)', () => {
      expect(Term.hash([[0, 1, 0]]))
        .to.equal(Term.hash([[0, 1]]));

      expect(Term.hash([[0, 1, 0], [1, 2]]))
        .to.equal(Term.hash([[0, 1], [1, 2, 0]]));
    });

  });

  // TODO: Perhaps make cache public so it can be tested

});
