
#include "model.h"
#include "term.h"
#include "../regression/lstsq.h"

stats_bundle Term::get_stats() {
  Matrix *X = model_->X();
  Matrix *y = model_->y();

  X = *X | *col(); // append this term to the matrix

  stats_bundle stats = lstsq(X, y);

  return stats;
}


