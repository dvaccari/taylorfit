#ifndef _TF_UTILS_H_
#define _TF_UTILS_H_

#include <vector>
#include <functional>
#include <cassert>
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"
#include "json/json.h"
#include "../model/term.h"
//#include "../statistics/statistics.h"

namespace tf_utils {

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
      [](pp::Var val) { return val.AsDouble(); }
  );
}

inline part_set ppvar_to_part_set(const pp::VarArray &vararray) {
  return ppvar_to_vec<part>(
      vararray,
      [](pp::Var val) {
        pp::VarArray elem(val);
        return (part){
          elem.Get(0).AsInt(),
          (float)elem.Get(1).AsDouble(),
          elem.Get(2).AsInt()
        };
      }
  );
}

inline Json::Value stats_bundle_to_json(const stats_bundle &stats) {
  Json::Value json = Json::Value(Json::objectValue);

  for (auto it = stats.begin(); it != stats.end(); it++) {
    switch (it->second.type()) {
      case stat::MATRIX:
        json[it->first] = it->second.matrix_val()->toJSON();
        break;

      case stat::DOUBLE:
        json[it->first] = Json::Value(it->second.double_val());
        break;
    }
  }

  return json;
}

} // end tf_utils

#endif
