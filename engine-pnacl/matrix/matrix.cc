
#include "matrix.h"

Matrix::Matrix(const pp::VarArray &data) {
  if (!data.Get(0).is_array()) {
    throw "Attempted to construct matrix out of non-nested array";
  }

  m_ = data.GetLength();
  n_ = pp::VarArray(data.Get(0)).GetLength();
  data_ = new double[m_ * n_];

  int i, j;
  pp::VarArray curr;

  // Flatten VarArray, placing elements accordingly into data_
  for (i = 0; i < m_; i++) {
    curr = pp::VarArray(data.Get(i));

    for (j = 0; j < n_; j++) {
      data_[i * n_ + j] = curr.Get(j).AsDouble();
    }
  }
}


Matrix::Matrix(const std::vector<std::vector<double>> &data) {
  m_ = data.size();
  n_ = data[0].size();
  data_ = new double[m_ * n_];

  int i, j;

  // Flatten nested vectors, placing elements accordingly into data_
  for (i = 0; i < m_; i++) {
    if (data[i].size() != n_) {
      throw "Attempted to construct matrix from non-square data";
    }
    for (j = 0; j < n_; j++) {
      data_[i * n_ + j] = data[i][j];
    }
  }
}


Matrix::Matrix(const Matrix &matrix) {
  n_ = matrix.n();
  m_ = matrix.m();
  data_ = new double[n_ * m_];

  std::copy(matrix.data_, matrix.data_ + (n_ * m_), data_);
}


Matrix::Matrix(Matrix *matrix) : Matrix(*matrix) { }
