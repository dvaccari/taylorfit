
const Statistic   = require('./Statistic');
const topsort     = require('./topsort');
const definitions = require('./definitions');
const metadata    = require('./metadata.json');


// used for t-stat calculations
//let VdivwSq = V.dotDivide(w).dotPow(2);

const sorted = topsort(definitions);

const noShow = Object.keys(metadata).filter(
  (key) => metadata[key].show === false);

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

