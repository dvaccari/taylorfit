
#include "term.h"

bool Term::operator==(const part_set parts) const {
  bool found;

  for (part other_p : parts) {
    found = false;

    for (part my_p : parts_) {
      found = found || (other_p == my_p);
    }
    if (!found) {
      return false;
    }
  }
  return true;
}

