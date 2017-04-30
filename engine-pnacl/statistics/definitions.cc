
#include <functional>
#include <cmath>
#include "statistics.h"

void yHat(stats_bundle &stats) {
  Matrix X = stats["X"];
  Matrix BHat = stats["BHat"];
  stats["yHat"] = X.dot(BHat);
}

void nd(stats_bundle &stats) {
  stats["nd"] = stats["X"].matrix_val().m();
}

void np(stats_bundle &stats) {
  stats["np"] = stats["X"].matrix_val().n();
}

void SSE(stats_bundle &stats) {
  Matrix y = stats["y"];
  Matrix yHat = stats["yHat"];
  stats["SSE"] = ((y - yHat) ^ 2).sum();
}

void TSS(stats_bundle &stats) {
  Matrix y = stats["y"];
  stats["TSS"] = ((y - (y.sum() / y.m())) ^ 2).sum();
}

void SSR(stats_bundle &stats) {
  stats["SSR"] = stats["TSS"] - stats["SSE"];
}

void Vary(stats_bundle &stats) {
  stats["Vary"] = stats["TSS"] / (stats["nd"] - 1);
}

void MSR(stats_bundle &stats) {
  stats["MSR"] = stats["SSR"] / stats["np"];
}

void MSE(stats_bundle &stats) {
  stats["MSE"] = stats["SSE"] / (stats["nd"] - stats["np"]);
}

void Rsq(stats_bundle &stats) {
  stats["Rsq"] = 1 - (stats["SSE"] / stats["TSS"]);
}

void cRsq(stats_bundle &stats) {
  stats["cRsq"] = 1 - stats["Rsq"];
}

void adjRsq(stats_bundle &stats) {
  stats["adjRsq"] = 1 - (
      (1 - stats["Rsq"])*(stats["nd"] - 1) /
      (stats["nd"] - stats["np"] - 1)
  );
}

void F(stats_bundle &stats) {
  stats["F"] = stats["MSR"] / stats["MSE"];
}

void AIC(stats_bundle &stats) {
  stats["AIC"] = std::log10(stats["MSE"]) + 2*(stats["np"] / stats["nd"]);
}

void BIC(stats_bundle &stats) {
  stats["BIC"] = std::log10(stats["MSE"]) +
                 stats["np"]*(std::log10(stats["nd"]) / stats["nd"]);
}

void t(stats_bundle &stats) {
  Matrix X        = stats["X"];
  Matrix VdivwSq  = stats["VdivwSq"];
  Matrix BHat     = stats["BHat"];
  double MSE      = stats["MSE"];
  Matrix sec(1, X.n());
  int i;

  for (i = 0; i < X.n(); i++) {
    sec.data_[i] = std::sqrt(VdivwSq.row(i).sum() * MSE);
  }
  stats["t"] = BHat / sec;
}

void pt(stats_bundle &stats) {
  // TODO
}

void pF(stats_bundle &stats) {
  // TODO
}

// BEWARE: this must be DONE before threads start calling compute(), otherwise
// multiple initializations may occur
void Statistic::init() {
  // Given
  Statistic::define("X", { }, [](stats_bundle&) {});
  Statistic::define("y", { }, [](stats_bundle&) {});
  Statistic::define("BHat", { }, [](stats_bundle&) {});

  Statistic::define("yHat", { "X", "BHat" }, yHat);
  Statistic::define("nd", { "X" }, nd);
  Statistic::define("np", { "X" }, np);
  Statistic::define("SSE" , { "y", "yHat" }, SSE);
  Statistic::define("TSS" , { "y" }, TSS);
  Statistic::define("SSR" , { "TSS", "SSE" }, SSR);
  Statistic::define("Vary" , { "TSS", "nd" }, Vary);
  Statistic::define("MSR" , { "SSR", "np" }, MSR);
  Statistic::define("MSE" , { "TSS", "nd", "np" }, MSE);
  Statistic::define("Rsq" , { "SSE", "TSS" }, Rsq);
  Statistic::define("cRsq" , { "Rsq" }, cRsq);
  Statistic::define("adjRsq" , { "Rsq", "np", "nd" }, adjRsq);
  Statistic::define("F" , { "MSR", "MSE" }, F);
  Statistic::define("AIC" , { "MSE", "np", "nd" }, AIC);
  Statistic::define("BIC" , { "MSE", "np", "nd" }, BIC);
  Statistic::define("t" , { "X", "VdivwSq", "MSE", "BHat" }, t);

  Statistic::initialized_ = true;
  Statistic::sort_statistics();
}


