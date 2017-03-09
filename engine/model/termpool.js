
const Term  = require('./term');
const md5   = require('blueimp-md5');

class TermPool {

  constructor(model) {
    this.model = model;
    this.terms = {};
  }

  get(term) {
    let found = this.terms[Term.hash(term)];

    if (!found) {
      found = new Term(this.model, term);
      this.terms[Term.hash(found.valueOf())] = found;
    }

    return found;
  }

  clearCache() {
    Object.values(this.terms).forEach((term) => term.clearCache());
  }

}


module.exports = TermPool;
