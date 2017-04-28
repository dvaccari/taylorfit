#ifndef _TERMPOOL_H_
#define _TERMPOOL_H_

#include <unordered_map>
#include <vector>
#include "term.h"

class Model; // placeholder


class TermPool {
  public:
    TermPool(Model *model) : _model(model) { }

    Term   *get(part_set);
    void    clear_cache();

  private:
    Model  *_model;
    std::unordered_map<part_set, Term*> _terms;
};

#endif
