
// lstsqSVD | lstsqNE
const METHOD = 'lstsqSVD';

module.exports.svd    = require('./svd-golub-reinsch');
module.exports.lstsq  = require('./lstsq')[METHOD];

