
#include <cstring>
#include "matrix.h"

Matrix *Matrix::zeros(int m, int n) {
  Matrix *result = new Matrix(m, n);

  memset(result->_data, 0, m*n*sizeof(double));
  return result;
}

