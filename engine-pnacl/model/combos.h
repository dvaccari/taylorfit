#ifndef _COMBOS_H_
#define _COMBOS_H_

template <typename T>
std::vector<std::vector<T>> _sub_combinations(
    typename std::vector<T>::iterator begin,
    typename std::vector<T>::iterator end,
    int k,
    bool replacement
) {
  typename std::vector<T>::iterator iter;
  std::vector<std::vector<T>> combos;
  std::vector<std::vector<T>> sub_combos;

  if (k < 1) {
    return combos;
  }
  if (k == 1) {
    for (iter = begin; iter != end; iter++) {
      combos.push_back({ *iter });
    }
    return combos;
  }

  for (iter = begin; iter != end; iter++) {
    sub_combos = _sub_combinations<T>(
        iter + !replacement,
        end,
        k - 1,
        replacement
    );

    for (std::vector<T> &combo : sub_combos) {
      combo.emplace(combo.begin(), *iter);
    }
    combos.insert(combos.end(), sub_combos.begin(), sub_combos.end());
  }
  return combos;
}

template <typename T>
std::vector<std::vector<T>> combinations(
    std::vector<T> &terms,
    int k,
    bool replacement
) {
  return _sub_combinations<T>(terms.begin(), terms.end(), k, replacement);
}


template <typename T>
std::vector<std::vector<T>> _sub_combinations_from_bins(
    typename std::vector<std::vector<T>>::iterator begin,
    typename std::vector<std::vector<T>>::iterator end,
    int k
) {
  int i;
  typename std::vector<std::vector<T>>::iterator iter;
  std::vector<std::vector<T>> combos;
  std::vector<std::vector<T>> sub_combos;

  if (k < 1) {
    return combos;
  }
  if (std::distance(begin, end) <= 0) {
    return combos;
  }
  if (k == 1) {
    // Get each element out of each bin, and make each a 1-elem combo
    for (iter = begin; iter != end; iter++) {
      for (T item : *iter) {
        combos.push_back({ item });
      }
    }
    return combos;
  }

  for (i = 0; i < begin->size(); i++) {
    sub_combos = _sub_combinations_from_bins<T>(begin + 1, end, k - 1);

    for (std::vector<T> &combo : sub_combos) {
      combo.emplace(combo.begin(), (*begin)[i]);
    }
    combos.insert(combos.end(), sub_combos.begin(), sub_combos.end());
  }

  sub_combos = _sub_combinations_from_bins<T>(begin + 1, end, k);
  combos.insert(combos.end(), sub_combos.begin(), sub_combos.end());

  return combos;
}


template <typename T>
std::vector<std::vector<T>> combinations_from_bins(
    std::vector<std::vector<T>> bins,
    int k
) {
  return _sub_combinations_from_bins<T>(bins.begin(), bins.end(), k);
}


#endif
