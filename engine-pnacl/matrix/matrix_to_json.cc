
#include "matrix.h"

Json::Value Matrix::toJSON() {
  Json::Value json = Json::Value(Json::arrayValue);
  Json::Value row;
  int i, j;

  for (i = 0; i < _m; i++) {
    row = Json::Value(Json::arrayValue);
    for (j = 0; j < _n; j++) {
      row.append(Json::Value(_data[i * _n + j]));
    }
    json.append(row);
  }

  return json;
}

