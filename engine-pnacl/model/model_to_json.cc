
#include <vector>
#include "model.h"

Json::Value Model::toJSON() {
  Json::Value json = Json::Value(Json::objectValue);

  json["multiplicands"] = Json::fromVector(_multiplicands);
  json["data"] = _data->toJSON();

  return json;
}

