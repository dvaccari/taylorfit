#ifndef _TERM_H_
#define _TERM_H_

#include <vector>
#include "json/json.h"
//#include "model.h"
#include "../utils/bitops.h"
#include "../matrix/matrix.h"
#include "../statistics/statistics.h"

class Model;

// Define type for [ col, exp, lag ] type
struct part {
  int   col;
  float exp;
  int   lag;

  bool operator==(const part &other) const {
    return other.col == col && other.exp == exp && other.lag == lag;
  }
};

typedef std::vector<part> part_set;


class Term {
  public:
    Term(Model *model, part_set p)
      : is_intercept(p.size() > 0
                     && p[0].col == 0
                     && p[0].exp == 0
                     && p[0].lag == 0),
        parts_(p),
        model_(model) { }

    Matrix        col();
    bool          operator==(const part_set) const;
    Json::Value   toJSON();
    stats_bundle  get_stats();

    bool          is_intercept;
    part_set      parts_;

  private:
    Model        *model_;
};


// Define std::hash() for two types:
//  1) Term
//  2) part_set   (std::vector<part>)
namespace std {
  template <>
  struct hash<part_set>
  {
    size_t operator()(const part_set &parts) const {
      size_t value = 0;
      int i;

      for (i = 0; i < parts.size(); i++) {
        value ^= tf_utils::rotl32(hash<int>()(parts[i].col), i);
        value ^= tf_utils::rotl32(hash<float>()(parts[i].exp), i);
        value ^= tf_utils::rotl32(hash<int>()(parts[i].lag), i);
        value = tf_utils::rotr32(value, i);
      }
      return value;
    }
  };

  template <>
  struct hash<Term>
  {
    size_t operator()(const Term &t) const {
      return std::hash<part_set>()(t.parts_);
    }
  };
}

#endif
