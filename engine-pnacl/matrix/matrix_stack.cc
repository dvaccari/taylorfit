
#include "matrix.h"

/**
 * Horizontally stack matrices
 */
Matrix *Matrix::operator|(const Matrix &other) {
  if (_m != other.m()) {
    throw "Matrix hstack failed (misalignment)";
  }

  int newN = _n + other.n();
  int i, j;
  Matrix *stacked = new Matrix(_m, newN);

  for (i = 0; i < _m; i++) {
    for (j = 0; j < _n; j++) {
      stacked->_data[i*newN + j] = _data[i*_n + j];
    }
    for (j = 0; j < other.n(); j++) {
      stacked->_data[i*newN + _n + j] = other._data[i*other.n() + j];
    }
  }

  return stacked;
}


/**
 * Vertically stack matrices
 */
Matrix *Matrix::operator||(const Matrix &other) {
  if (_n != other.n()) {
    throw "Matrix vstack failed (misalignment)";
  }

  Matrix *stacked = new Matrix(_m + other.m(), _n);

  std::copy(_data, _data + (_m * _n), stacked->_data);
  std::copy(
    other._data,
    other._data + (other.m() * other.n()),
    stacked->_data + (_m * _n)
  );

  return stacked;
}


