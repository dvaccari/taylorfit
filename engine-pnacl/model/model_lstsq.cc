
#include "model.h"
#include "../regression/lstsq.h"
#include "../utils/utils.h"


Json::Value Model::lstsq() {
  std::vector<int> cols = range(0, _data->n());

  cols.erase(std::remove(cols.begin(), cols.end(), _dependent), cols.end());

  Matrix *X = _data->cols(cols);
  Matrix *y = _data->col(_dependent);

  Matrix *U;
  Matrix *S;
  Matrix *V;

  svd(X, &U, &S, &V);

  Matrix *beta = lstsq_svd(X, U, S, V, y);

  return beta->toJSON();
}




