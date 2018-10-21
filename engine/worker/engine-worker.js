/*global onmessage, postMessage*/
'use strict';

require('./subworkers');

const perf      = require('../perf');
const statsMeta = require('../statistics/metadata.json');
const Model     = require('../model');
const {
  FIT_LABEL, CROSS_LABEL, VALIDATION_LABEL,
  LOG,
  K_ORDER_DIFFERENCE,
  STUDENTIZED,
  NORMALIZED,
} = require('../labels.json');

const Transformation = require("../../interface/components/transform/label.json")

const getCandidateProgressInterval  = 50;
let   onGetCandidateId              = 0;
let   m         = initializeModel();

function log() {
  console.debug('[Engine]:', ...arguments);
};

function initializeModel() {
  let m = new Model();

  m.on('getCandidates.start', () => postMessage({
    type: 'progress.start',
    data: {}
  }));

  m.on('getCandidates.start', () => perf.start('get-candidates'));
  m.on('getCandidates.end', () => {
    perf.end('get-candidates');
    perf.report('get-candidates', 3);
  });

  // Subscribe to progress changes
  onGetCandidateId = m.on('getCandidates.each', (data) => {
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

  m.on("dataTransform", () => {
    postMessage({
      type: `data:transform`,
      data: {
        // This sets the data in the Model, but Model.coffee will not update, need to fire back to adapter new data
        fit: m.getLabelData(FIT_LABEL)
          ? m.getLabelData(FIT_LABEL).toJSON()
          : undefined,
        cross: m.getLabelData(CROSS_LABEL)
          ? m.getLabelData(CROSS_LABEL).toJSON()
          : undefined,
        validation: m.getLabelData(VALIDATION_LABEL)
          ? m.getLabelData(VALIDATION_LABEL).toJSON()
          : undefined
      }
    });
  });

  m.on('error', (error) =>
    postMessage({ type: 'error', data: error })
  );

  return m;
}

// Whenever a parameter changes, let's update the UI
let subscriptionIds = [];
let subscribeToChanges = (m, updateNow = true) => {
  m.removeListener(subscriptionIds);

  subscriptionIds = m.on([
    'setData', 'setExponents', 'setMultiplicands', 'setDependent',
    'setLags', 'addTerm', 'removeTerm', 'clear', 'subset', 'setColumns'
  ], () => {
    m.getCandidates()
     .then((cands) => postMessage({ type: 'candidates', data: cands }));
    m.labels.forEach((label) =>
      postMessage({ type: `model:${label}`, data: m.getModel(label) })
    );
  });

  if (updateNow) {
    m.fire('setData');
  }
};
let unsubscribeToChanges = (m) => m.removeListener(subscriptionIds);

// By default, subscribe
subscribeToChanges(m, false);

/**
 * Function calls off subscription handler from engine/model.js
 */
onmessage = function (e) {
  // If it's for a sub-worker, just ignore it
  if (e.data._from != null) {
    return;
  }

  let type = e.data.type
    , data = e.data.data
    , temp;

  log(e.data);

  switch(type) {
    // only works because the event type is the same as the method name
    case 'setExponents':
    case 'setMultiplicands':
    case 'setDependent':
    case 'setColumns':
    case 'setLags':
    case 'addTerm':
    case 'removeTerm':
    case 'clear':
      m[type](data);
      break;

    // this one's special
    case 'setData':
      m[type](data.data, data.label);
      break;

    case 'getTerms':
      postMessage({ type: 'candidates', data: m.getCandidates() });
      break;

    case 'getStatisticsMetadata':
      postMessage({ type: 'statisticsMetadata', data: statsMeta });
      break;

    case 'subscribeToChanges':
      subscribeToChanges(m);
      break;

    case 'unsubscribeToChanges':
      unsubscribeToChanges(m);
      break;

    case 'subset':
      m.subset(data.label, data.start, data.end);
      break;

    case 'tranformData':
      switch (data.label) {
        case (Transformation.Transform.log):
          m.transformColumn(LOG, data.index);
        default:
          break;
      }
      break;

    case 'reset':
      m = new Model();
      break;

    default:
      postMessage({ type: 'error', data: 'Invalid type: ' + type });
      break;

  }
};
