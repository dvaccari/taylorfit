

const load  = require('./load.es6');
const Model = require('./model.es6');
const math  = require('./math.es6');

var DIV = 1;

load('prototype/concrete_data.csv', true, (data) => {
  var X = data.subset(math.index(
    math.range(0, data.size()[0]/DIV),
    math.range(0, data.size()[1]-1)
  ));
  var y = data.subset(
    math.index(math.range(0, data.size()[0]/DIV), data.size()[1]-1)
  );

  var m = new Model(X, math.squeeze(math.transpose(y)), [1, 2, 3], [1, 2]);
  var comp;

  console.log(m.candidates.map((term, i, all) => {
    console.log('computing', i, '/', all.length, JSON.stringify(term.term));
    return {
      term: JSON.stringify(term.term),
      stats: term.getStats()
    };
  }));

  comp = m.compute();
  console.log('terms', comp.model.terms);
  console.log('stats', comp.model.tstats);
  console.log('potential', comp.potential);
});
