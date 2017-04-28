
#include "model.h"

std::vector<part_set> generate_terms(
    std::vector<int> features,
    std::vector<float> exponents,
    std::vector<int> multipliers,
    std::vector<int> lags
) {
  std::vector<part_set> bins;
  std::vector<part_set> terms;
  std::vector<part_set> combos_for_m;

  lags.emplace(lags.begin(), 0);

  for (int i : features) {
    std::vector<part> bin;

    for (float e : exponents) {
      for (int l : lags) {
        bin.push_back((part) { i, e, l });
      }
    }

    bins.push_back(bin);
  }

  for (int m : multipliers) {
    combos_for_m = combinations_from_bins(bins, m);
    terms.insert(terms.begin(), combos_for_m.begin(), combos_for_m.end());
  }

  return terms;
}

