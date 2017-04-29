
#include "term.h"

Json::Value Term::get_stats() {
  Json::Value json = toJSON();

  // mimic heavy computation
  usleep(1000);

  return json;
}


