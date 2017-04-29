#ifndef _TERMPOOL_H_
#define _TERMPOOL_H_

#include <unordered_map>
#include <vector>
#include "term.h"

class Model;

class TermPool {
  public:
    TermPool(Model *model) : model_(model) { }

    Term   *get(part_set);
    void    clear_cache();

  private:
    Model  *model_;
    std::unordered_map<part_set, Term*> terms_;
};

#endif
