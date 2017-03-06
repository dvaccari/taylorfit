/*global describe, it, before*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should
    , csv     = require('fast-csv');

const Matrix  = require('../../engine/matrix').Matrix
    , lstsqNE = require('../../engine/matrix/lstsq').lstsqNE
    , lstsqSVD= require('../../engine/matrix/lstsq').lstsqSVD;

const rootdir = '/../../';
const retail  = require('./testdata/retail.data.json');

const scalarStatistics = ['mse', 'rsq', 'crsq', 'adjrsq',
                          'f'  , 'pf' , 'aic' , 'bic'];

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

  // Both lstsqNE and lstsqSVD have the same requirements, so why not test both
  // at the same time?
  for (let lstsq of [lstsqNE, lstsqSVD]) {

    describe(lstsq.name, () => {

      it('computes coefficients properly', () => {
        var coeffs = lstsq(retail.X, retail.y).weights.data
          , i;

        for (i = 0; i < coeffs.length; i += 1) {
          expect(coeffs[i]).to.be.approximately(retail.stats.weights[i], 1e-10);
        }
      });

      it('computes t-statistics properly', () => {
        var tstats = lstsq(retail.X, retail.y).tstats.data
          , i;

        for (i = 0; i < tstats.length; i += 1) {
          expect(tstats[i]).to.be.approximately(retail.stats.tstats[i], 1e-5);
        }
      });

      it('computes Pr(t) for each t properly', () => {
        var pts = lstsq(retail.X, retail.y).pts.data
          , i;

        for (i = 0; i < pts.length; i += 1) {
          expect(pts[i]).to.be.approximately(retail.stats.pts[i], 1e-10);
        }
      });

      // Again, this is the same for each scalar statistic (pretty much)
      for (let statistic of scalarStatistics) {

        it('computes ' + statistic + ' properly', () => {
          var predicted = lstsq(retail.X, retail.y)[statistic];
          expect(predicted).to.be.approximately(
            retail.stats[statistic].val,
            retail.stats[statistic].var
          );
        });

      }

    });

  }

});
