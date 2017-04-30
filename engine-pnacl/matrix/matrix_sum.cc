
#include "matrix.h"

double Matrix::sum() {
  double total = 0;
  int i;
  int size = m_ * n_;

  for (i = 0; i < size; i++) {
    total += data_[i];
  }
  return total;
}

