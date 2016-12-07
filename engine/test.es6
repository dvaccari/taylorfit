
const load  = require('./load.es6');
const Model = require('./model.es6');

load('data/concrete_data.csv', true, (data) => {
  var X = data.subset(':', ':-1');
  var y = data.subset(':', [-1]);

  var m = new Model(X, y, [1, 2, 3, 4], [1, 2, 3]);
  var comp;

  //m.addTerm([[0, 1]]);
  //m.addTerm([[1, 1]]);

  m.addTerm([[0, 1]]);

  console.log(m.candidates.length, 'candidate terms');
  console.time('termstats');
  console.log(m.candidates.map((term, i, all) => {
    console.log('computing', i, '/', all.length, JSON.stringify(term.term));
    return {
      term: JSON.stringify(term.term),
      stats: term.getStats()
    };
  }));
  console.timeEnd('termstats');

  //comp = m.compute();
  //console.log('terms', comp.model.terms.map((term) => term.term));
  //console.log('stats', comp.model.tstats.data);
});

