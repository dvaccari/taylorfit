
#include "term.h"

Json::Value Term::toJSON() {
  Json::Value json = Json::Value(Json::arrayValue);
  Json::Value part_json;

  for (part p : parts_) {
    part_json = Json::Value(Json::arrayValue);
    part_json.append(Json::Value(p.col));
    part_json.append(Json::Value(p.exp));
    part_json.append(Json::Value(p.lag));
    json.append(part_json);
  }

  return json;
}

