
#include "model.h"
#include "../utils/bitops.h"

/*
namespace std {
  template <>
  struct hash<std::vector<part>>
  {
    size_t operator()(const std::vector<part> &parts) const {
      size_t value = 0;
      int i;

      for (i = 0; i < parts.size(); i++) {
        value ^= rotl32(hash<int>()(parts[i].col), i);
        value ^= rotl32(hash<float>()(parts[i].exp), i);
        value ^= rotl32(hash<int>()(parts[i].lag), i);
        value = rotr32(value, i);
      }
      return value;
    }
  };

  template <>
  struct hash<Term>
  {
    size_t operator()(const Term &t) const {
      return std::hash<std::vector<part>>()(t._parts);
    }
  };
}
*/

