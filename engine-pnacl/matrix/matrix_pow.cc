
#include "matrix.h"

Matrix *operator^(const Matrix &matrix, const double n) {
  Matrix *product = new Matrix(matrix);
  int i;

  for (i = 0; i < matrix.m() * matrix.n(); i++) {
    product->_data[i] = std::pow(product->_data[i], n);
  }

  return product;
}


Matrix *operator^(const Matrix &matrix, const float n) {
  return matrix ^ (double)n;
}


Matrix *operator^(const Matrix &matrix, const int n) {
  return matrix ^ (double)n;
}

