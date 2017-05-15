
const Statistic   = require('./Statistic');
const topsort     = require('./topsort');
const definitions = require('./definitions');
const metadata    = require('./metadata.json');


// used for t-stat calculations
//let VdivwSq = V.dotDivide(w).dotPow(2);

const sorted = topsort(definitions);

const noShow = metadata.filter(({ show }) => !show);

module.exports = (predefinedStats) => {
  let stats = sorted.reduce((calculatedStats, stat) =>
    stat.calc(calculatedStats), predefinedStats);

  /*
  for (let key of noShow) {
    delete stats[key];
  }
   */

  return stats;
};

module.exports.compute = (stat, args) => {
  stat = definitions.find((s) => s.name === stat);

  if (stat == null) {
    throw new ReferenceError('Cannot find statistic \'' + stat + '\'');
  }

  return stat.calc(args)[stat];
};

