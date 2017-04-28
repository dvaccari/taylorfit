#ifndef _TF_UTILS_H_
#define _TF_UTILS_H_

#include <vector>
#include <functional>
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"

inline std::vector<int> range(int a, int b) {
  std::vector<int> nums;

  if (a >= b) {
    return nums;
  }

  for(; a < b; a++) {
    nums.push_back(a);
  }

  return nums;
}

template <typename T>
std::vector<T> ppvar_to_vec(
    const pp::VarArray         &vararray,
    std::function<T(pp::Var)>   converter
) {
  std::vector<T> vec;
  int i;

  for (i = 0; i < vararray.GetLength(); i++) {
    vec.push_back(converter(vararray.Get(i)));
  }
  return vec;
}

inline std::vector<int> ppvar_to_int_vec(const pp::VarArray &vararray) {
  return ppvar_to_vec<int>(
      vararray,
      [](pp::Var val) { return val.AsInt(); }
  );
}

inline std::vector<float> ppvar_to_float_vec(const pp::VarArray &vararray) {
  return ppvar_to_vec<float>(
      vararray,
      [](pp::Var val) { return val.AsInt(); }
  );
}

#endif
