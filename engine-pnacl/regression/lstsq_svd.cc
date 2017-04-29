
#include <limits>
#include "lstsq.h"

Matrix *lstsq_svd(Matrix *A, Matrix *U, Matrix *S, Matrix *V, Matrix *b) {
  int m = A->m();
  int n = A->n();
  double eps = std::numeric_limits<double>::epsilon();
  Matrix *d;

  double max_eig = -std::numeric_limits<double>::max();
  int i;

  for (i = 0; i < n; i++) {
    max_eig = std::max(max_eig, S->_data[i]);
  }

  for (i = 0; i < n; i++) {
    if (S->_data[i] < std::max(m, n)*eps*max_eig) {
      S->_data[i] = 0;
    }
  }

  d = U->T()->dot(*b);
  d = *d / *S;

  for (i = 0; i < n; i++) {
    if (std::fabs(d->_data[i]) >= std::numeric_limits<double>::max()) {
      d->_data[i] = 0;
    }
  }
  return V->dot(d);
}

