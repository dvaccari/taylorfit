
#include "termpool.h"

Term *TermPool::get(part_set parts) {
  std::unordered_map<part_set, Term*>::const_iterator got;

  got = _terms.find(parts);

  if (got == _terms.end()) {
    _terms.insert({ parts, new Term(_model, parts) });
  }

  return _terms.at(parts);
}

