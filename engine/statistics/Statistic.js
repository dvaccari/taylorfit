
const defaults = ['X', 'y', 'BHat'];

class Statistic {

  constructor(name, args, fn, description) {
    this.name = name;
    this.args = args;
    this.fn = fn;
  }

  calc(statistics) {
    statistics[this.name] = this.fn(statistics);
    return statistics;
  }

  inspect(depth, options={ stylize: (x) => ''+x }) {
    return `${this.name}(${this.args})`;
  }

}

module.exports = (...args) => new Statistic(...args);
