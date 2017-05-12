
const Term  = require('./Term');

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

  uncache() {
    Object.values(this.terms).forEach((term) => term.uncache('col'));
  }

}

module.exports = TermPool;

