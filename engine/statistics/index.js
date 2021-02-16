const Statistic   = require('./Statistic');
const topsort     = require('./topsort');
const definitions = require('./definitions');
const metadata    = require('./metadata.json');

const sorted = topsort(definitions);

const noShow = metadata.filter(({ show }) => !show);

module.exports = (predefinedStats) => {
  let stats = sorted.reduce((calculatedStats, stat) =>
    stat.calc(calculatedStats), predefinedStats);

  return stats;
};

module.exports.compute = (stat, args) => {
  stat_def = definitions.find((s) => s.name === stat);

  if (stat_def == null)
    throw new ReferenceError('Cannot find statistic \'' + stat + '\'');

  return stat_def.calc(args)[stat];
};
