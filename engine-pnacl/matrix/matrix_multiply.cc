
#include "matrix.h"

Matrix *Matrix::dot(const Matrix &other) {
  if (_n != other.m()) {
    throw "Matrix multiplication: n != m (" + std::to_string(_n) + " != " +
      std::to_string(other.m()) + ")";
  }

  Matrix *product = new Matrix(_m, other.n());
  int i, j, k;
  double sum;

  for (i = 0; i < _m; i++) {
    for (j = 0; j < other.n(); j++) {
      for (k = 0, sum = 0; k < _n; k++) {
        sum += _data[i * _n + k] * other._data[k * other.n() + j];
      }
      product->_data[i * other.n() + j] = sum;
    }
  }

  return product;
}


Matrix *Matrix::operator*(const Matrix &other) {
  if (other.m() != _m || other.n() != _n) {
    throw "Matrix multiplication failed (misaligned)";
  }

  Matrix *product = new Matrix(*this);
  int i;

  for (i = 0; i < _m * _n; i++) {
    product->_data[i] *= other._data[i];
  }

  return product;
}


Matrix *Matrix::operator*(const double n) {
  Matrix *product = new Matrix(*this);
  int i;

  for (i = 0; i < _m * _n; i++) {
    product->_data[i] *= n;
  }

  return product;
}

