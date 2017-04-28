
#include "matrix.h"

Matrix::Matrix(const pp::VarArray &data) {
  if (!data.Get(0).is_array()) {
    throw "Attempted to construct matrix out of non-nested array";
  }

  _m = data.GetLength();
  _n = pp::VarArray(data.Get(0)).GetLength();
  _data = new double[_m * _n];

  int i, j;
  pp::VarArray curr;

  // Flatten VarArray, placing elements accordingly into _data
  for (i = 0; i < _m; i++) {
    curr = pp::VarArray(data.Get(i));

    for (j = 0; j < _n; j++) {
      _data[i * _n + j] = curr.Get(j).AsDouble();
    }
  }
}


Matrix::Matrix(const std::vector<std::vector<double>> &data) {
  _m = data.size();
  _n = data[0].size();
  _data = new double[_m * _n];

  int i, j;

  // Flatten nested vectors, placing elements accordingly into _data
  for (i = 0; i < _m; i++) {
    if (data[i].size() != _n) {
      throw "Attempted to construct matrix from non-square data";
    }
    for (j = 0; j < _n; j++) {
      _data[i * _n + j] = data[i][j];
    }
  }
}


Matrix::Matrix(const Matrix &matrix) {
  _n = matrix.n();
  _m = matrix.m();
  _data = new double[_n * _m];

  std::copy(matrix._data, matrix._data + (_n * _m), _data);
}


Matrix::Matrix(Matrix *matrix) : Matrix(*matrix) { }
