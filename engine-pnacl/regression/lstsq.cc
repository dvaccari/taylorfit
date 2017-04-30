
#include "json/json.h"
#include "lstsq.h"
#include "../statistics/statistics.h"

stats_bundle lstsq(const Matrix &X, const Matrix &y) {
  Json::FastWriter writer;
  Matrix *U;
  Matrix *w;
  Matrix *V;

  svd(X, &U, &w, &V);
  Matrix beta = lstsq_svd(X, *U, *w, *V, y);

  stats_bundle stats;

  // Note: no scaling being done here
  stats["BHat"] = beta;
  stats["weights"] = beta; // to conform with JS version
  stats["X"] = X;
  stats["y"] = y;
  stats["VdivwSq"] = (*V / *w) ^ 2;

  return Statistic::compute(stats);
}

