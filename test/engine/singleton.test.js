/*global describe, it, before, beforeEach*/

const chai      = require('chai')
    , expect    = chai.expect
    , should    = chai.should;

const Matrix    = require('../../engine/matrix').Matrix
    , combos    = require('../../engine/model/combos')
    , Singleton = require('../../engine/model/singleton')
    , dataset   = require('./test.data.json');

describe('SingletonModel', () => {

  var data, instance;

  let bfEach = () => {
    Singleton.reset();
  };

  before(() => {
    data = {
      X: new Matrix(dataset.X),
      y: new Matrix(dataset.y).T,
      headers: dataset.headers
    };
    instance = new Singleton();
  });

  describe('constructor()', () => {

    beforeEach(bfEach);

    it('returns a reference to the existing singleton', () => {
      var s = new Singleton;
      expect({a: 1}).not.to.equal({a: 1});
      expect(new Singleton).to.equal(s);
    });

    it('gives the singleton default params', () => {
      expect(new Singleton().exponents).to.exist;
      expect(new Singleton().multiplicands).to.exist;
      expect(new Singleton().dependent).to.exist;
      expect(new Singleton().dataset).to.exist;
    });

  });

  describe('static getInstance()', () => {

    beforeEach(bfEach);

    it('gets the sole instance of SingletonModel', () => {
      expect(Singleton.getInstance()).to.equal(new Singleton);
    });

  });

  describe('static reset()', () => {

    beforeEach(bfEach);

    it('creates a new singleton and replaces the instance', () => {
      var oneandonly = new Singleton;
      var apparentlynot = Singleton.reset();

      expect(apparentlynot).not.to.equal(oneandonly);
      expect(apparentlynot).to.equal(new Singleton);
    });

  });

  describe('setDataset', () => {

    beforeEach(bfEach);

    it('assigns a new dataset to the instance', () => {
      var existingDataset = Singleton.getInstance().dataset;

      new Singleton().setDataset([[1, 2], [3, 4]]);
      expect(new Singleton().dataset).not.to.equal(existingDataset);
      expect(new Singleton().dataset).to.eql(new Matrix([[1, 2], [3, 4]]));
    });

    it('accpets nested arrays or a Matrix', () => {
      let mx = new Matrix([[1, 2], [3, 4]]);
      let f0 = () => new Singleton().setDataset([[1, 2], [3, 4]]);
      let f1 = () => new Singleton().setDataset(mx);

      expect(f0).not.to.throw();
      expect(f1).not.to.throw();

      expect(new Singleton().dataset).to.equal(mx);
    });

    // TODO: adding/removing columns is TRICKY -- implement separate function

  });

  describe('setMultiplicands', () => {

    beforeEach(bfEach);

    it('properly sets multiplicands', () => {
      var s = new Singleton()
            .setDataset([[1, 2, 3], [4, 5, 6]])
            .setMultiplicands(2);

      expect(s.model.candidates.length).to.equal(3);
    });

    it('throws TypeError if the arg is not an integer', () => {
      let f0 = () => new Singleton().setMultiplicands('3');
      let f1 = () => new Singleton().setMultiplicands(1.2);
      let f2 = () => new Singleton().setMultiplicands({a: 1});
      let f3 = () => new Singleton().setMultiplicands(3);

      expect(f0).to.throw(TypeError);
      expect(f1).to.throw(TypeError);
      expect(f2).to.throw(TypeError);
      expect(f3).not.to.throw();
    });

  });

  describe('setDependent', () => {

    beforeEach(bfEach);

    it('throws TypeError if the arg is not an integer', () => {
      let f0 = () => new Singleton().setMultiplicands('3');
      let f1 = () => new Singleton().setMultiplicands(1.2);
      let f2 = () => new Singleton().setMultiplicands({a: 1});
      let f3 = () => new Singleton().setMultiplicands(3);

      expect(f0).to.throw(TypeError);
      expect(f1).to.throw(TypeError);
      expect(f2).to.throw(TypeError);
      expect(f3).not.to.throw();
    });

    it('throws RangeError if the arg is not a valid column', () => {
      new Singleton().setDataset([[1, 2, 3], [4, 5, 6]]);

      let f_1 = () => new Singleton().setDependent(-1);
      let f0 = () => new Singleton().setDependent(0);
      let f1 = () => new Singleton().setDependent(1);
      let f2 = () => new Singleton().setDependent(2);
      let f3 = () => new Singleton().setDependent(3);

      expect(f_1).to.throw(RangeError); // -1 not a valid column
      expect(f0).not.to.throw(RangeError); // 0 is valid ([1, 4])
      expect(f1).not.to.throw(RangeError); // 1 is valid ([2, 4])
      expect(f2).not.to.throw(RangeError); // 2 is valid ([3, 6])
      expect(f3).to.throw(RangeError); // 3 not a valid column
    });

    it('properly sets a valid dependent column', () => {
      var s = new Singleton()
        .setDataset([[1, 2, 3], [4, 5, 6]])
        .setDependent(2);

      expect(s.model.X.data).to.eql(new Matrix([[1, 2], [4, 5]]).data);
      expect(s.model.y.data).to.eql(new Matrix([[3], [6]]).data);
    });

  });

  describe('setExponents', () => {

    beforeEach(bfEach);

    it('throws TypeError if the arg is not an array of numbers', () => {
      let f0 = () => new Singleton().setExponents('3');
      let f1 = () => new Singleton().setExponents(['1', '2', '3']);
      let f2 = () => new Singleton().setExponents({a: 1});
      let f3 = () => new Singleton().setExponents([1, 2, 3]);

      expect(f0).to.throw(TypeError);
      expect(f1).to.throw(TypeError);
      expect(f2).to.throw(TypeError);
      expect(f3).not.to.throw();
    });

    it('properly sets the list of exponents', () => {
      var s = new Singleton()
            .setDataset([[1, 2, 3], [4, 5, 6]])
            .setExponents([1, 2]);
      expect(s.model.candidates.map((term) => term.term))
        .to.eql([[[0, 1]], [[0, 2]], [[1, 1]], [[1, 2]]]);
    });

  });

  describe('getX', () => {

    beforeEach(bfEach);

    it('returns the independent columns / input data from the dataset', () => {
      var s = new Singleton().setDataset([[1, 2, 3], [4, 5, 6]]);
      expect(s.getX().data).to.eql(new Matrix([[2, 3], [5, 6]]).data);
    });

  });

  describe('gety', () => {

    beforeEach(bfEach);

    it('returns the dependent column / output data from the dataset', () => {
      var s = new Singleton().setDataset([[1, 2, 3], [4, 5, 6]]);
      expect(s.gety().data).to.eql(new Matrix([1, 4]).data);
    });

  });

});
