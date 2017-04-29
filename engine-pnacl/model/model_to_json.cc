
#include <vector>
#include "model.h"

Json::Value Model::toJSON() {
  Json::Value json = Json::Value(Json::objectValue);

  json["multiplicands"] = Json::fromVector(multiplicands_);
  json["exponents"] = Json::fromVector(exponents_);
  json["lags"] = Json::fromVector(lags_);

  for (auto it = data_.begin(); it != data_.end(); it++) {
    json["data:" + it->first] = it->second->toJSON();
  }

  Json::Value terms = Json::Value(Json::arrayValue);
  for (Term *t : terms_) {
    terms.append(t->toJSON());
  }
  json["terms"] = terms;

  return json;
}

