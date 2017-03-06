/*global onmessage, postMessage*/
'use strict';

const Model = require('../model/model2');
const m     = new Model();

var log = function () {
  console.debug('[Engine]:', ...arguments);
};

m.on('getCandidates.start', () => postMessage({
  type: 'progress.start',
  data: {}
}));

m.on('getCandidates.start', () => console.time('getCandidates'));
m.on('getCandidates.end', () => console.timeEnd('getCandidates'));

let getCandidateProgressInterval = 100;
let onGetCandidateId = m.on('getCandidates.each', (data) => {
  if (data.curr % getCandidateProgressInterval === 0) {
    postMessage({
      type: 'progress',
      data: { curr: data.curr, total: data.total }
    });
  }
});

m.on('getCandidates.end', () => postMessage({
  type: 'progress.end',
  data: {}
}));

onmessage = function (e) {
  var type = e.data.type
    , data = e.data.data;

  log(e.data);

  switch(type) {

  case 'update':
    if (data.dataset != null) {
      m.setData(data.dataset);
    }
    if (data.exponents != null) {
      m.setExponents(data.exponents);
    }
    if (data.multiplicands != null) {
      m.setMultiplicands(data.multiplicands);
    }
    if (data.dependent != null) {
      m.setDependent(data.dependent);
    }
    if (data.lags != null) {
      m.setLags(data.lags);
    }

    postMessage({
      type: 'candidates',
      data: m.getCandidates()
    });
    break;

  case 'get_terms':
    postMessage({
      type: 'candidates',
      data: m.getCandidates()
    });
    break;

  case 'add_term':
    m.addTerm(data);

    postMessage({
      type: 'candidates',
      data: m.getCandidates()
    });
    postMessage({
      type: 'model',
      data: m.getModel()
    });
    break;

  case 'remove_term':
    m.removeTerm(data);

    postMessage({
      type: 'candidates',
      data: m.getCandidates()
    });
    postMessage({
      type: 'model',
      data: m.getModel()
    });
    break;

  default:
    postMessage({ type: 'error', data: 'Invalid type: ' + type });

  }
};
