
const Model   = require('./model');
const utils   = require('./utils');
const Matrix  = require('./matrix').Matrix;


// TODO: replace input to model() with object per data contract once it is
//       finalized

module.exports.model = (data, dependent, exponents, multipliers) => {
  data = new Matrix(data);
  dependent = dependent || (data.shape[1] - 1);

  var inputColumns = data.subset(
    ':',
    utils.range(0, dependent).concat(utils.range(dependent + 1, data.shape[1]))
  ) , outputColumn = data.col(dependent);

  return new Model(inputColumns, outputColumn, exponents, multipliers);
};

