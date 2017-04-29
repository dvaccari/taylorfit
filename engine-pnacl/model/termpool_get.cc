
#include "termpool.h"

Term *TermPool::get(part_set parts) {
  std::unordered_map<part_set, Term*>::const_iterator got;

  got = terms_.find(parts);

  if (got == terms_.end()) {
    terms_.insert({ parts, new Term(model_, parts) });
  }

  return terms_.at(parts);
}

