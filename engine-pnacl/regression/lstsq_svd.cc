
#include <limits>
#include "lstsq.h"

Matrix lstsq_svd(
  const Matrix &A,
  const Matrix &U,
  const Matrix &S,
  const Matrix &V,
  const Matrix &b
) {
  int m = A.m();
  int n = A.n();
  double eps = std::numeric_limits<double>::epsilon();
  Matrix d;

  double max_eig = -std::numeric_limits<double>::max();
  int i;

  for (i = 0; i < n; i++) {
    max_eig = std::max(max_eig, S.data_[i]);
  }

  for (i = 0; i < n; i++) {
    if (S.data_[i] < std::max(m, n)*eps*max_eig) {
      S.data_[i] = 0;
    }
  }

  d = U.T().dot(b);
  d = d / S;

  for (i = 0; i < n; i++) {
    if (std::fabs(d.data_[i]) >= std::numeric_limits<double>::max()) {
      d.data_[i] = 0;
    }
  }
  return V.dot(d);
}

