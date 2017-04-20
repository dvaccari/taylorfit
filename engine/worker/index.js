/*global onmessage, postMessage*/
'use strict';

const statsMeta = require('../statistics/metadata.json');
const Model     = require('../model/model2');
const m         = new Model();

var log = function () {
  console.debug('[Engine]:', ...arguments);
};

m.on('getCandidates.start', () => postMessage({
  type: 'progress.start',
  data: {}
}));

m.on('getCandidates.start', () => console.time('getCandidates'));
m.on('getCandidates.end', () => console.timeEnd('getCandidates'));

// Subscribe to progress changes
let getCandidateProgressInterval = 50;
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

// Whenever a parameter changes, let's update the UI
let subscriptionIds = [];
let subscribeToChanges = () => {
  m.removeListener(subscriptionIds);

  subscriptionIds = m.on([
    'setData', 'setExponents', 'setMultiplicands', 'setDependent',
    'setLags', 'addTerm', 'removeTerm'
  ], () => {
    postMessage({ type: 'candidates', data: m.getCandidates() });
    postMessage({ type: 'model', data: m.getModel() });

    m.subsets.forEach((subset) =>
      postMessage({ type: `model:${subset}`, data: m.getModel(subset) })
    );
  });
  m.fire('setData');
};
let unsubscribeToChanges = () => m.removeListener(subscriptionIds);

// By default, subscribe
subscribeToChanges();


onmessage = function (e) {
  let type = e.data.type
    , data = e.data.data
    , temp;

  log(e.data);

  switch(type) {

  // only works because the event type is the same as the method name
  case 'setData':
  case 'setExponents':
  case 'setMultiplicands':
  case 'setDependent':
  case 'setLags':
  case 'addTerm':
  case 'removeTerm':
    m[type](data);
    break;

  // XXX: DEPRECATED
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
    break;

  case 'getTerms':
    postMessage({ type: 'candidates', data: m.getCandidates() });
    break;

  case 'getStatisticsMetadata':
    postMessage({ type: 'statisticsMetadata', data: statsMeta });
    break;

  case 'subscribeToChanges':
    subscribeToChanges();
    break;

  case 'unsubscribeToChanges':
    unsubscribeToChanges();
    break;

  case 'subset':
    m.subset(data.label, data.start, data.end);
    break;

  default:
    postMessage({ type: 'error', data: 'Invalid type: ' + type });

  }
};
