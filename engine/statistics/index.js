
const Statistic   = require('./Statistic');
const topsort     = require('./topsort');
const definitions = require('./definitions');
const metadata    = require('./metadata.json');


// used for t-stat calculations
//let VdivwSq = V.dotDivide(w).dotPow(2);

const sorted = topsort(definitions);

const noShow = Object.keys(metadata).filter(
  (key) => metadata[key].show === false);

const diffName = Object.keys(metadata).reduce(
  (names, key) => {
    if (metadata[key].displayName) {
      names[key] = metadata[key].displayName;
    }
    return names;
  },
  {});

module.exports = (predefinedStats) => {
  let stats = sorted.reduce((calculatedStats, stat) =>
    stat.calc(calculatedStats), predefinedStats);

  for (let key of noShow) {
    delete stats[key];
  }

  for (let name in diffName) {
    stats[diffName[name]] = stats[name];
    delete stats[name];
  }

  return stats;
};

