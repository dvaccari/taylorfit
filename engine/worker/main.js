
var engine = new Worker('bundle.js');

engine.onmessage = function (e) {
  var pre = document.createElement('pre');

  if (e.data.type === 'candidates') {
    pre.innerText = '~candidates~\n' + e.data.candidates.map(
      (term) => JSON.stringify(term)
    ).join('\n');
  } else {
    pre.innerText = JSON.stringify(e.data, null, 2);
  }
  document.body.appendChild(pre);
};


engine.postMessage({
  type: 'update_model',
  data: {
    model: [[1, 2, 3, 4],
            [3, 2, 1, 4],
            [5, 6, 3, 2],
            [3, 3, 2, 7],
            [9, 8, 2, 6],
            [3, 2, 3, 4]],
    dependent: 3,
    exponents: [1],
    multiplicands: 1
  }
});

//engine.postMessage({ type: 'get_terms' });
engine.postMessage({ type: 'add_term', data: [[0, 1]] });
engine.postMessage({ type: 'add_term', term: [[1, 1]] });

