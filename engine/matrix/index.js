
// lstsqSVD | lstsqNE
const METHOD = 'lstsqSVD';

module.exports.Matrix = require('./matrix.es6');
module.exports.svd    = require('./svd-golub-reinsch.es6');
module.exports.lstsq  = require('./lstsq.es6')[METHOD];

