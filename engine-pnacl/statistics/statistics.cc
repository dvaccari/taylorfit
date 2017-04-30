
#include "statistics.h"

std::vector<Statistic> Statistic::registered_statistics_;
bool Statistic::initialized_ = false;

stats_bundle &Statistic::compute(stats_bundle &stats) {
  for (Statistic &s : Statistic::registered_statistics_) {
    s.func_(stats);
  }
  return stats;
}

