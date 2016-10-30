

const math    = require('mathjs');
//const load = require('./load');
const Model   = require('./model');
const combos  = require('./combos');

module.exports.buildModel = (data, indepCol) => {
  indepCol = indepCol || (data.size()[1] - 1);

  var inputColumns = math.index(
      // all rows
      math.range(0, data.size()[0]),
      // columns
      math.concat(
        // cols ..[indepCol]
        math.range(0, indepCol),
        // cols [indepCol+1]..
        math.range(indepCol + 1, data.size()[1])
      ))
    , outputColumn = math.index(math.range(0, data.size()[0]), indepCol);

  return new Model(
    data.subset(inputColumns),
    data.subset(outputColumn)
  );
};

module.exports.generateTerms = combos.generateTerms;


/*
load('./prototype/bla.data', true, (data) => {
  console.time('compute');
  var model = module.exports.buildModel(data, [1, 2, 3], [1, 2], 2);
  console.timeEnd('compute');

  console.log(model.predict([1, 2]));

  var weights = model.weights.map((weight) => math.round(weight, 10));
});
*/
