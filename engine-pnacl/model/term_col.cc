
#include "model.h"

Matrix *Term::col() {
  Matrix *data = _model->data();
  Matrix *prod = *Matrix::zeros(data->m(), 1) + 1;
  int i;

  for (i = 0; i < _parts.size(); i++) {
    prod = *prod * (*data->col(_parts[i].col) ^ _parts[i].exp);
  }
  return prod;
}

