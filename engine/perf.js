
const utils     = require('./utils');
const appStart  = Date.now();

if (typeof performance === 'undefined') {
  let entries = [];

  var performance = {};

  function PerformanceMark(name) {
    this.startTime = Date.now() - appStart;
    this.duration = 0;
    this.entryType = 'mark';
    this.name = name;
    entries.push(this);
  }

  function PerformanceMeasure(name, startMark, endMark) {
    let timeNow = Date.now() - appStart;

    let i = entries.length - 1;

    while (
      i >= 0 &&
      entries[i].name !== startMark &&
      entries[i].type !== 'mark'
    ) {
      i -= 1;
    }
    if (i >= 0) {
      startMark = entries[i];
    } else {
      startMark = { startTime: 0 };
    }

    i = entries.length - 1;

    while (
      i >= 0 &&
      entries[i].name !== endMark &&
      entries[i].type !== 'mark'
    ) {
      i -= 1;
    }
    if (i >= 0) {
      endMark = entries[i];
    } else {
      endMark = { startTime: timeNow };
    }

    this.startTime = startMark.startTime;
    this.duration = endMark.startTime - startMark.startTime;
    this.name = name;
    this.entryType = 'measure';
    entries.push(this);
  }

  performance.mark = (name) => {
    new PerformanceMark(name);
  };

  performance.measure = (name, startMark, endMark) => {
    new PerformanceMeasure(name, startMark, endMark);
  };

  performance.getEntriesByName = (name) =>
    entries.filter((e) => e.name === name);

  performance.getEntries = () => entries.slice();

  performance.getEntriesByType = (type) =>
    entries.filter((e) => e.entryType === type);
}

function start(name) {
  performance.mark(name + ':start');
}

function end(name) {
  performance.mark(name + ':end');
  performance.measure(name + ':measure', name + ':start', name + ':end');
}

function getMeanDuration(name) {
  let measures = performance.getEntriesByName(name + ':measure');

  return measures.reduce(
    (sum, measure) => sum + measure.duration
    , 0
  ) / measures.length;
}

function log(name) {
  let logFn = console.log;

  if (console.debug) {
    logFn = console.debug;
  }

  logFn(`[Performance] ${name}: ${getMeanDuration(name)}ms (avg)`);
}

function report(name, nLatestRecords=0) {
  let logFn = console.log;

  if (console.debug) {
    logFn = console.debug;
  }

  let measures = performance
        .getEntriesByName(name + ':measure')
        .slice(-nLatestRecords);
  let padWidth = measures.reduce(
    (best, m) => Math.max(best, Math.floor(Math.log10(m.duration) + 1))
    , 0
  );

  logFn(`[Performance] ${name} (report)`);
  measures.forEach((measure) => logFn(`  ${name}: ${
    utils.formatNum(padWidth, 4, measure.duration, 0)
  }ms`));
}

module.exports = { start, end, getMeanDuration, log, report };

