
const load  = require('./load');
const Model = require('./model/model2');
const Term  = require('./model/term');

load('data/concrete_data.csv', true, (data) => {
  var X = data.subset(':', ':-1');
  var y = data.subset(':', [-1]);

  var m = new Model();
  var comp;

  m.setData(data);
  m.subset('fit', 0, 700);
  m.subset('test', 700);
  m.subset('validation', 400, 800);
  m.setExponents([1, 2, 3, 4]);
  m.setMultiplicands(3);

  //m.addTerm([[0, 1]]);
  //m.addTerm([[1, 1]]);

  m.addTerm([[1, 1]]);
  m.on('getCandidates', (data) => {
    if (data.curr % 100 === 0) {
      process.stdout.write(`computing ${data.curr} / ${data.total}\r`);
    }
  });

  console.time('termstats');
  let cands = m.getCandidates();
  console.timeEnd('termstats');

  console.time('termstats');
  m.getCandidates();
  console.timeEnd('termstats');

  console.time('model');
  console.log(m.getModel().stats);
  console.log(m.getModel('test').stats);
  console.log(m.getModel('validation').stats);
  console.timeEnd('model');

  //comp = m.compute();
  //console.log('terms', comp.model.terms.map((term) => term.term));
  //console.log('stats', comp.model.tstats.data);
});

