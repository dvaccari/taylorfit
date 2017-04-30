
#include "matrix.h"

Json::Value Matrix::toJSON() {
  Json::Value json = Json::Value(Json::arrayValue);
  Json::Value row;
  int i, j;

  for (i = 0; i < m_; i++) {
    row = Json::Value(Json::arrayValue);
    for (j = 0; j < n_; j++) {
      row.append(Json::Value(data_[i * n_ + j]));
    }
    json.append(row);
  }

  return json;
}

