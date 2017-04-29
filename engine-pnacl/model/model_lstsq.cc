
#include "model.h"
#include "../statistics/statistics.h"
#include "../regression/lstsq.h"

Json::Value Model::lstsq() {
  Matrix *X = this->X(DEFAULT_LABEL);
  Matrix *y = this->y(DEFAULT_LABEL);

  stats_bundle stats = ::lstsq(X, y);

  Matrix *bhat = stats["BHat"].matrix_val();
  return bhat->toJSON();
}

