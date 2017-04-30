
#include "statistics.h"

int in_degree(Statistic &stat, std::vector<Statistic> &stats) {
  int count = 0;

  for (std::string &arg : stat.params_) {
    for (Statistic &s : stats) {
      if (s.name_ == arg) {
        count++;
      }
    }
  }
  return count;
}

void Statistic::sort_statistics() {
  std::vector<Statistic>  S;
  std::vector<Statistic>  L;
  std::vector<Statistic>  remaining = Statistic::registered_statistics_;
  Statistic               node;
  std::vector<Statistic>::iterator it;

  for (it = remaining.begin(); it != remaining.end();) {
    if (it->params_.size() <= 0) {
      S.push_back(*it);
      remaining.erase(it);
    } else {
      it++;
    }
  }

  while (S.size() > 0) {
    node = S[0];
    S.erase(S.begin());
    remaining.erase(
      std::remove(remaining.begin(), remaining.end(), node), remaining.end()
    );
    L.push_back(node);

    for (it = remaining.begin(); it != remaining.end();) {
      if (in_degree(*it, remaining) <= 0) {
        S.push_back(*it);
        remaining.erase(it);
      } else {
        it++;
      }
    }
  }

  Statistic::registered_statistics_ = L;
}

