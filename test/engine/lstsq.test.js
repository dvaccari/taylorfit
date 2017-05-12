/*global describe, it, before*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should
    , csv     = require('fast-csv');

const Matrix  = require('../../engine/matrix')
    , lstsq   = require('../../engine/regression').lstsq;

const rootdir = '/../../';
const retail  = require('./testdata/retail.data.json');

describe('lstsq', () => {

  before((done) => {
    var data = [];

    csv.fromPath(__dirname + rootdir + retail.datasetPath)
      .on('data', (row) => {
        data.push(row.map((x) => parseFloat(x)));
      })
      .on('end', () => {
        data = new Matrix(data);
        retail.X = new Matrix(data.shape[0], 1)
          .add(1)
          .hstack(data.subset(':', [1, 2]));
        retail.y = data.col(0);
        done();
      });
  });

  describe(lstsq.name, () => {

    it('computes coefficients properly', () => {
      var coeffs = lstsq(retail.X, retail.y).weights.data
        , i;

      for (i = 0; i < coeffs.length; i += 1) {
        expect(coeffs[i]).to.be.approximately(retail.stats.weights[i], 1e-10);
      }
    });

  });

});
