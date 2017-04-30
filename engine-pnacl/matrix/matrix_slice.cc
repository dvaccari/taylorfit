
#include "matrix.h"

Matrix Matrix::col(int i) {
  Matrix col(m_, 1);
  int j;

  for (j = 0; j < m_; j++) {
    col.data_[j] = data_[i + j*n_];
  }
  return col;
}

Matrix Matrix::row(int i) {
  Matrix row(1, n_);

  std::copy(data_ + i*n_, data_ + (i+1)*n_, row.data_);
  return row;
}

