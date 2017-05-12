/*global describe, it, before*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should;

const Matrix  = require('../../engine/matrix')
    , dataset = require('./testdata/test.data.json');

describe('Matrix', () => {

  var data;

  before(() => {
    data = {
      X: new Matrix(dataset.X),
      y: new Matrix(dataset.y).T,
      headers: dataset.headers
    };
  });

  describe('constructor()', () => {

    it('creates an empty matrix given row and column dimensions', () => {
      var m = new Matrix(2, 3);
      expect(m.shape[0]).to.eql(2);
      expect(m.shape[1]).to.eql(3);
      expect(m.data.length).to.eql(6);
    });

    it('creates a matrix using the Float64Array (by ref) provided', () => {
      var a = new Float64Array([1, 2, 3]);
      var m = new Matrix(1, 3, a);

      expect(m.data).to.equal(a);
      a[1] = 5;
      expect(m.data[1]).to.equal(5);
    });

    it('throws if the provided Float64Array does not match dimensions', () => {
      expect(() => new Matrix(4, 2, new Float64Array([1, 2, 3]))).to.throw();
    });

    it('creates a matrix using a copy of an array provided', () => {
      var a = [1, 2, 3, 4, 5, 6];
      var m = new Matrix(2, 3, a);

      expect(m.data).to.eql(Float64Array.from(a));
      a[0] = 7;
      expect(m.data[0]).to.equal(1);
    });

    it('accepts nested arrays as the only argument', () => {
      var m = new Matrix([[1, 2, 3], [4, 5, 6]]);

      expect(m.shape[0]).to.equal(2);
      expect(m.shape[1]).to.equal(3);
      expect(m.data).to.eql(Float64Array.from([1, 2, 3, 4, 5, 6]));
    });

  });

  describe('add()', () => {

    it('should add two matrices of the same size', () => {
      var m = new Matrix(2, 2, [1, 2, 3, 4]).add(new Matrix(2, 2, [4, 3, 2, 1]));

      expect(m.data).to.eql(new Float64Array([5, 5, 5, 5]));
      expect(m.shape).to.eql([2, 2]);
    });

    it('should throw if the matrices are of different sizes', () => {
      var f = () => new Matrix(2, 2, [1, 2, 3, 4]).add(new Matrix(1, 1, [5]));
      expect(f).to.throw();
    });

  });

  describe('dot()', () => {

    it('multiplies two compatible matrices', () => {
      var a = new Matrix([[1, 2], [3, 4]]);
      var b = new Matrix([[4, 3], [2, 1]]);
      expect(a.dot(b).data).to.eql(Float64Array.from([8, 5, 20, 13]));
      expect(a.dot(b).shape).to.eql([2, 2]);

      a = new Matrix([[1, 2, 3],
                      [1, 2, 3]]);
      b = new Matrix([[1, 2],
                      [1, 2],
                      [1, 2]]);
      expect(a.dot(b).data).to.eql(Float64Array.from([6, 12, 6, 12]));
      expect(a.dot(b).shape).to.eql([2, 2]);
    });

    it('throws if the matrices cannot be multiplied', () => {
      var a = new Matrix([[1, 2, 3],
                          [4, 5, 6]]);
      expect(() => a.dot(a)).to.throw();
    });

  });

  describe('inv()', () => {

    it('finds the inverse of a non-singular matrix', () => {
      var a = new Matrix([[ 1, -1, 1],
                          [ 0, -2, 1],
                          [-2, -3, 0]]);
      expect(a.inv().data).to.eql(Float64Array.from([ 3, -3,  1,
                                                     -2,  2, -1,
                                                     -4,  5, -2]));
      expect(a.inv().shape).to.eql([3, 3]);
    });

    it.skip('doesnt handle singular matrices well', () => {
      expect(() => new Matrix([[1, -1], [1, -1]]).inv()).to.throw();
    });

    it('throws if the matrix is not square', () => {
      expect(() => new Matrix([[1, 2, 3], [4, 2, 3]]).inv()).to.throw();
    });

  });

  describe('clone()', () => {

    it('makes a clone identical to the original', () => {
      var a = new Matrix([[1, 2], [3, 4]])
        , b = a.clone();

      expect(a.data).to.eql(b.data);
      expect(a.shape).to.eql(b.shape);
      expect(a.data).to.not.equal(b.data);
      expect(a.shape).to.not.equal(b.shape);
    });

  });

  describe('hstack()', () => {

    it('stacks two matrices horizontally', () => {
      var a = new Matrix([[1, 2], [3, 4]]);
      var b = new Matrix([[5], [6]]);

      expect(a.hstack(b).data).to.eql(Float64Array.from([1, 2, 5, 3, 4, 6]));
      expect(a.hstack(b).shape).to.eql([2, 3]);
    });

    it('throws if matrices do not have the same # of rows', () => {
      var a = new Matrix([[1, 2], [3, 4]]);
      var b = new Matrix([5, 6]);

      expect(() => a.hstack(b).data).to.throw();
    });

    it('works find for matrices with 0 columns', () => {
      var a = new Matrix([[1, 2], [3, 4]]);
      var b = new Matrix(2, 0);

      expect(a.hstack(b).data).to.eql(Float64Array.from([1, 2, 3, 4]));
      expect(a.hstack(b).shape).to.eql([2, 2]);
    });

  });

  describe('vstack()', () => {

    it('stacks two matrices vertically', () => {
      var a = new Matrix([[1, 2], [3, 4]]);
      var b = new Matrix([5, 6]);

      expect(a.vstack(b).data).to.eql(Float64Array.from([1, 2, 3, 4, 5, 6]));
      expect(a.vstack(b).shape).to.eql([3, 2]);
    });

    it('throws if matrices do not have the same # of columns', () => {
      var a = new Matrix([[1, 2], [3, 4]]);
      var b = new Matrix([[5], [6]]);

      expect(() => a.vstack(b).data).to.throw();
    });

    it('works find for matrices with 0 rows', () => {
      var a = new Matrix([[1, 2], [3, 4]]);
      var b = new Matrix(0, 2);

      expect(a.vstack(b).data).to.eql(Float64Array.from([1, 2, 3, 4]));
      expect(a.vstack(b).shape).to.eql([2, 2]);
    });

  });

  describe('dotPow()', () => {

    it('does Math.pow() for each element in the matrix', () => {
      var a = new Matrix([[1, 2], [3, 4]]);

      expect(a.dotPow(2).data).to.eql(Float64Array.from([1, 4, 9, 16]));
      expect(a.dotPow(2).shape).to.eql([2, 2]);
    });

    it('does negative exponents too!', () => {
      var a = new Matrix([[1, 2], [3, 4]]);
      expect(a.dotPow(-1).data).to.eql(Float64Array.from([1, 1/2, 1/3, 1/4]));
    });

  });

  describe('dotMultiply', () => {

    it('accepts a number and multiplies each element by that', () => {
      var m = new Matrix([[1, 2, 3], [4, 5, 6]]);

      expect(m.dotMultiply(2).data).to.eql(
        Float64Array.from([2, 4, 6, 8, 10, 12])
      );
      expect(m.dotMultiply(2).shape).to.eql([2, 3]);
    });

    it('accepts a Matrix and multiplies each element element-wise', () => {
      var a = new Matrix([[1, 2, 3], [4, 5, 6]]);
      var b = new Matrix([[7, 6, 9], [2, 4, 8]]);

      expect(a.dotMultiply(b).data).to.eql(
        Float64Array.from([7, 12, 27, 8, 20, 48])
      );
      expect(a.dotMultiply(b).shape).to.eql([2, 3]);
    });

    it('does not throw if the matrices are not the same shape/size', () => {
      var a = new Matrix([1, 2, 3, 4]);
      var b = new Matrix([[1], [2], [3], [4]]);
      var c = new Matrix([[1], [2]]);

      expect(a.dotMultiply(b).data).to.eql(Float64Array.from([1, 4, 9, 16]));
      expect(a.dotMultiply(c).data).to.eql(Float64Array.from([1, 4, NaN, NaN]));
    });

  });

  // dotDivide doesn't get tested because it's basically the same as dotMultiply

  // TODO
  describe('col()', () => {});
  describe('row()', () => {});
  describe('subset()', () => {});
  describe('diag()', () => {});
  describe('sum()', () => {});
  describe('get T()', () => {});

  describe('static random()', () => {});
  describe('static eye()', () => {});
  describe('static from()', () => {});

});
