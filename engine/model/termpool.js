
const Term  = require('./term');
const md5   = require('blueimp-md5');

function hash(term) {
  return md5(term.map(md5).sort().join());
}

class TermPool {

  constructor(model) {
    this.model = model;
    this.terms = {};
  }

  get(term) {
    let found = this.terms[hash(term)];

    if (!found) {
      found = new Term(this.model, term);
      this.terms[hash(term)] = found;
    }

    return found;
  }

  clearCache() {
    this.terms.forEach((term) => term.clearCache());
  }

}


module.exports = TermPool;
module.exports.hash = hash;
