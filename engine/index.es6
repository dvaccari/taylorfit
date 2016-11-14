
const Model   = require('./model.es6');
const utils   = require('./playground/utils.es6');
const Matrix  = require('./playground/matrix.es6');
const combos  = require('./combos.es6');


// TODO: replace input to model() with object per data contract once it is
//       finalized

module.exports.model = (data, indepCol, exponents, multipliers) => {
  indepCol = indepCol || (data.size()[1] - 1);
  data = new Matrix(data);

  var inputColumns = data.subset(
    ':',
    utils.range(0, indepCol).concat(utils.range(indepCol, data[0].length))
  ) , outputColumn = data.col(indepCol);

  return new Model(inputColumns, outputColumn, exponents, multipliers);
};

