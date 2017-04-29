
#include "matrix.h"

Matrix *Matrix::operator/(const Matrix &other) {
  Matrix *product = new Matrix(*this);
  int other_size = other.m() * other.n();
  int i;

  for (i = 0; i < _m * _n; i++) {
    product->_data[i] /= other._data[i % other_size];
  }

  return product;
}


Matrix *Matrix::operator/(const double n) {
  Matrix *product = new Matrix(*this);
  int i;

  for (i = 0; i < _m * _n; i++) {
    product->_data[i] /= n;
  }

  return product;
}

