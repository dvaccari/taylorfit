
#include "matrix.h"

Matrix *Matrix::col(int i) {
  Matrix *col = new Matrix(_m, 1);
  int j;

  for (j = 0; j < _m; j++) {
    col->_data[j] = _data[i + j*_n];
  }
  return col;
}

Matrix *Matrix::row(int i) {
  Matrix *row = new Matrix(1, _n);

  std::copy(_data + i*_n, _data + (i+1)*_n, row->_data);
  return row;
}

