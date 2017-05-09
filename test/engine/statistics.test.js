
/*global describe, it, before*/

const chai        = require('chai')
    , expect      = chai.expect
    , should      = chai.should
    , csv         = require('fast-csv');

const Matrix      = require('../../engine/matrix')
    , lstsq       = require('../../engine/regression').lstsq
    , statistics  = require('../../engine/statistics')
    , metadata    = require('../../engine/statistics/metadata.json');

const rootdir     = '/../../';
const retail      = require('./testdata/retail.data.json');

describe('statistics', () => {

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

  // Test each statistic for which the value is known pretty much the same way
  for (let stat in retail.stats) {

    it(`computes ${stat} reasonably well`, () => {
      let predicted = statistics(lstsq(retail.X, retail.y))[stat];

      if (Array.isArray(retail.stats[stat])) {
        for (let i in predicted.data) {
          expect(predicted.data[i]).to.be.approximately(
            retail.stats[stat][i],
            1e-6
          );
        }
      } else {
        expect(predicted).to.be.approximately(
          retail.stats[stat].val,
          retail.stats[stat].var
        );
      }
    });

  }

});
