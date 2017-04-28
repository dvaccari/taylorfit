
#include "matrix.h"

Matrix *Matrix::operator+(const Matrix &other) {
  if (other.m() != _m || other.n() != _n) {
    throw "Matrix addition failed (misaligned)";
  }

  Matrix *sum = new Matrix(*this);
  int i;

  for (i = 0; i < _m * _n; i++) {
    sum->_data[i] += other._data[i];
  }

  return sum;
}

Matrix *Matrix::operator+(const double n) {
  Matrix *sum = new Matrix(*this);
  int i;

  for (i = 0; i < _m * _n; i++) {
    sum->_data[i] += n;
  }

  return sum;
}

Matrix *Matrix::operator-(const Matrix &other) {
  if (other.m() != _m || other.n() != _n) {
    throw "Matrix addition failed (misaligned)";
  }

  Matrix *sum = new Matrix(*this);
  int i;

  for (i = 0; i < _m * _n; i++) {
    sum->_data[i] -= other._data[i];
  }

  return sum;
}

Matrix *Matrix::operator-(const double n) {
  Matrix *sum = new Matrix(*this);
  int i;

  for (i = 0; i < _m * _n; i++) {
    sum->_data[i] -= n;
  }

  return sum;
}


