
#include "matrix.h"

Matrix Matrix::operator+(const Matrix &other) {
  if (other.m() != m_ || other.n() != n_) {
    throw "Matrix addition failed (misaligned)";
  }

  Matrix sum(*this);
  int i;

  for (i = 0; i < m_ * n_; i++) {
    sum.data_[i] += other.data_[i];
  }

  return sum;
}

Matrix Matrix::operator+(const double n) {
  Matrix sum(*this);
  int i;

  for (i = 0; i < m_ * n_; i++) {
    sum.data_[i] += n;
  }

  return sum;
}

Matrix Matrix::operator-(const Matrix &other) {
  if (other.m() != m_ || other.n() != n_) {
    throw "Matrix addition failed (misaligned)";
  }

  Matrix sum(*this);
  int i;

  for (i = 0; i < m_ * n_; i++) {
    sum.data_[i] -= other.data_[i];
  }

  return sum;
}

Matrix Matrix::operator-(const double n) {
  Matrix sum(*this);
  int i;

  for (i = 0; i < m_ * n_; i++) {
    sum.data_[i] -= n;
  }

  return sum;
}


