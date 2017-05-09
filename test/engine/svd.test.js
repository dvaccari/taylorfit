/*global describe, it, before*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should;

const Matrix  = require('../../engine/matrix')
    , svd     = require('../../engine/regression').svd
    , dataset = require('./testdata/svd.data.json');

describe('svd', () => {

  var data;

  before(() => {
    data = {
      A: new Matrix(dataset.A),
      w: dataset.w
    };
  });

  it('computes the proper singular values of a matrix', () => {
    var singularVals = svd(data.A)[1]
      , i;

    // Check each singular value for approximate equality (+/- 1e-12)
    for (i = 0; i < singularVals.length; i += 1) {
      expect(singularVals[i]).to.be.approximately(data.w[i], 1e-12);
    }
  });

  it('svd(A) -> U,S,V s.t. A = U * diag(S) * V.T', () => {
    var [u, s, v] = svd(data.A)
      , usv = u.dot(Matrix.diag(s)).dot(v.T)
      , i;

    // Check each element of A with USV for approximate equality (+/- 1e-12)
    for (i = 0; i < data.A.data.length; i += 1) {
      expect(usv.data[i]).to.be.approximately(data.A.data[i], 1e-12);
    }
  });

});
