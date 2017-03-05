
const load  = require('./load');
const Model = require('./model/model2');
const Term  = require('./model/term');

load('data/concrete_data.csv', true, (data) => {
  var X = data.subset(':', ':-1');
  var y = data.subset(':', [-1]);

  var m = new Model();
  var comp;

  m.setData(data);
  m.setExponents([1, 2, 3, 4]);
  m.setMultiplicands(3);

  //m.addTerm([[0, 1]]);
  //m.addTerm([[1, 1]]);

  m.addTerm([[1, 1]]);

  console.time('termstats');
  let cands = m.getCandidates();

    /*.map((term, i, all) => {
    console.log('computing', i, '/', all.length, JSON.stringify(term.term.valueOf()));
    return term;
  }));
  */
  console.timeEnd('termstats');
  console.time('termstats');
  m.getCandidates();
  console.timeEnd('termstats');

  //comp = m.compute();
  //console.log('terms', comp.model.terms.map((term) => term.term));
  //console.log('stats', comp.model.tstats.data);
});

