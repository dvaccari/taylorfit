
const inDegree = (stat, statistics) => {
  let names = statistics.map(({ name }) => name);
  return stat.args.filter((s) => names.includes(s)).length;
};

const topsort = (statistics) => {
  let S = statistics.filter((stat) => stat.args.length === 0);
  let L = [];
  let remaining = statistics.filter((stat) => !S.includes(stat));
  let node;

  while (S.length > 0) {
    node = S.shift();
    remaining = remaining.filter((n) => n !== node);
    L.push(node);
    S = S.concat(remaining.filter((stat) => inDegree(stat, remaining) === 0));
    remaining = remaining.filter((stat) => !S.includes(stat));
  }
  if (remaining.length > 0) {
    throw new Error('Statistics are co-dependent');
  }
  return L;
};

module.exports = topsort;
