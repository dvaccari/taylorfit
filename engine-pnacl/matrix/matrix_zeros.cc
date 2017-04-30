
#include <cstring>
#include "matrix.h"

Matrix Matrix::zeros(int m, int n) {
  Matrix result(m, n);

  memset(result.data_, 0, m*n*sizeof(double));
  return result;
}

