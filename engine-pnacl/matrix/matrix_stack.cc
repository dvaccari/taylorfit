
#include "matrix.h"

/**
 * Horizontally stack matrices
 */
Matrix Matrix::operator|(const Matrix &other) {
  if (m_ != other.m()) {
    throw "Matrix hstack failed (misalignment)";
  }

  int newN = n_ + other.n();
  int i, j;
  Matrix stacked(m_, newN);

  for (i = 0; i < m_; i++) {
    for (j = 0; j < n_; j++) {
      stacked.data_[i*newN + j] = data_[i*n_ + j];
    }
    for (j = 0; j < other.n(); j++) {
      stacked.data_[i*newN + n_ + j] = other.data_[i*other.n() + j];
    }
  }

  return stacked;
}


/**
 * Vertically stack matrices
 */
Matrix Matrix::operator||(const Matrix &other) {
  if (n_ != other.n()) {
    throw "Matrix vstack failed (misalignment)";
  }

  Matrix stacked(m_ + other.m(), n_);

  std::copy(data_, data_ + (m_ * n_), stacked.data_);
  std::copy(
    other.data_,
    other.data_ + (other.m() * other.n()),
    stacked.data_ + (m_ * n_)
  );

  return stacked;
}


