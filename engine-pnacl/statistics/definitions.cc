
#include <functional>
#include "statistics.h"

void yHat(stats_bundle &stats) {
  Matrix X = stats["X"].matrix_val();
  Matrix BHat = stats["BHat"].matrix_val();
  stats["yHat"] = X.dot(BHat);
}

void SSE(stats_bundle &stats) {
  Matrix y = stats["y"].matrix_val();
  Matrix yHat = stats["yHat"].matrix_val();
  stats["SSE"] = ((y - yHat) ^ 2).sum();
}

// BEWARE: not thread safe. this must be DONE before threads start calling
// compute()
void Statistic::init() {
  Statistic::define("X", { }, [](stats_bundle&) {});
  Statistic::define("y", { }, [](stats_bundle&) {});
  Statistic::define("BHat", { }, [](stats_bundle&) {});
  Statistic::define("yHat", { "X", "BHat" }, yHat);
  Statistic::define("SSE" , { "y", "yHat" }, SSE);

  Statistic::initialized_ = true;
  Statistic::sort_statistics();
}


