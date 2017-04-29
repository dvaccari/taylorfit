
#include "matrix.h"

Matrix *Matrix::T() {
  Matrix *transpose = new Matrix(_n, _m);
  int i, j;

  for (i = 0; i < _m; i += 1) {
    for (j = 0; j < _n; j += 1) {
      transpose->_data[j * _m + i] = _data[i * _n + j];
    }
  }
  return transpose;
}

