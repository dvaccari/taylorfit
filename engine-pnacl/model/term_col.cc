
#include "model.h"

Matrix Term::col() {
  Matrix data = model_->data();
  Matrix prod = Matrix::zeros(data.m(), 1) + 1;
  int i;

  for (i = 0; i < parts_.size(); i++) {
    prod = prod * (data.col(parts_[i].col) ^ parts_[i].exp);
  }

  return prod;
}

