
#include "matrix.h"

Matrix Matrix::cols(const std::vector<int> &cols) {
  Matrix subset = new Matrix(m_, 0);

  for (int c : cols) {
    subset = subset | col(c);
  }
  return subset;
}

