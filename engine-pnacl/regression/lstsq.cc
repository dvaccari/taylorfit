
#include "lstsq.h"
#include <iostream>
#include "json/json.h"

stats_bundle lstsq(Matrix *X, Matrix *y) {
  Json::FastWriter writer;
  Matrix *U;
  Matrix *S;
  Matrix *V;

  svd(X, &U, &S, &V);
  Matrix *beta = lstsq_svd(X, U, S, V, y);

  stats_bundle stats;

  stats["BHat"] = beta;

  Matrix *bhat = stats["BHat"].matrix_val();

  std::cout << writer.write(bhat->toJSON()) << std::endl;

  return stats;
}

