
#include "matrix.h"

Matrix Matrix::T() const {
  Matrix transpose(n_, m_);
  int i, j;

  for (i = 0; i < m_; i += 1) {
    for (j = 0; j < n_; j += 1) {
      transpose.data_[j * m_ + i] = data_[i * n_ + j];
    }
  }
  return transpose;
}

