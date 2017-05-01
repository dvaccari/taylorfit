
#include "model.h"

Model *Model::add_term(const part_set &parts) {
  // If we already have the term, ignore
  for (Term *t : terms_) {
    if (*t == parts) {
      return this;
    }
  }

  terms_.push_back(termpool_.get(parts));
  fire("addTerm");
  return this;
}

Model *Model::remove_term(const part_set &parts) {
  std::vector<Term*>::iterator it = terms_.begin();

  while (it != terms_.end()) {
    if (**it == parts) {
      terms_.erase(it);
      return this;
    }
  }
  fire("removeTerm");
  return this;
}

