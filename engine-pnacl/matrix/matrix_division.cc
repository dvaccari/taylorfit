
#include "matrix.h"

Matrix Matrix::operator/(const Matrix &other) {
  Matrix product(*this);
  int other_size = other.m() * other.n();
  int i;

  for (i = 0; i < m_ * n_; i++) {
    product.data_[i] /= other.data_[i % other_size];
  }

  return product;
}


Matrix Matrix::operator/(const double n) {
  Matrix product(*this);
  int i;

  for (i = 0; i < m_ * n_; i++) {
    product.data_[i] /= n;
  }

  return product;
}

