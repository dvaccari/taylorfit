/*global describe, it, before*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should;

const Matrix  = require('../../engine/matrix').Matrix
    , Model   = require('../../engine/model/model')
    , Term    = require('../../engine/model/term')
    , dataset = require('./test.data.json');

describe('Term', () => {

  var data;

  before(() => {
    data = {
      X: new Matrix(dataset.X),
      y: new Matrix(dataset.y).T,
      headers: dataset.headers
    };
  });

  describe('constructor()', () => {

    var m;

    before(() => {
      m = new Model(data.X, data.y, [1, 2], 2);
    });

    it('creates a new term given a valid set of pairs and a model', () => {
      var t = new Term([[0, 1], [1, 1]], m);
      expect(t.term).to.eql([[0, 1], [1, 1]]);
      expect(t.col.data).to.eql(
        data.X.subset(':', 0).add(data.X.subset(':', 1)).data
      );
    });

    it('throws when a model isnt given', () => {
      var f = () => new Term([[0, 1]]);
      expect(f).to.throw();
    });

  });

  describe('getStats()', () => {

    var m;

    before(() => {
      m = new Model(data.X, data.y, [1, 2], 2);
    });

    it('returns the t-statistic and MSE when the candidate term is included', () => {
      var t = new Term([[0, 1], [1, 1]], m);
      expect(t.getStats().t).to.be.a('number');
      expect(t.getStats().mse).to.be.a('number');
    });

    // FIXME : need to cross check t-statistic values for accuracy

  });

});
