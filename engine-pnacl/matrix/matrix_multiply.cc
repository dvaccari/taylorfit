
#include "matrix.h"

Matrix Matrix::dot(const Matrix &other) const {
  if (n_ != other.m()) {
    throw "Matrix multiplication: n != m (" + std::to_string(n_) + " != " +
      std::to_string(other.m()) + ")";
  }

  Matrix product(m_, other.n());
  int i, j, k;
  double sum;

  for (i = 0; i < m_; i++) {
    for (j = 0; j < other.n(); j++) {
      for (k = 0, sum = 0; k < n_; k++) {
        sum += data_[i * n_ + k] * other.data_[k * other.n() + j];
      }
      product.data_[i * other.n() + j] = sum;
    }
  }

  return product;
}


Matrix Matrix::operator*(const Matrix &other) {
  Matrix product(*this);
  int other_size = other.m() * other.n();
  int i;

  for (i = 0; i < m_ * n_; i++) {
    product.data_[i] *= other.data_[i % other_size];
  }

  return product;
}


Matrix Matrix::operator*(const double n) {
  Matrix product(*this);
  int i;

  for (i = 0; i < m_ * n_; i++) {
    product.data_[i] *= n;
  }

  return product;
}

