
#include <cmath>
#include <vector>
#include <limits>
#include "lstsq.h"

double pythag(double a, double b) {
  double absa = std::fabs(a);
  double absb = std::fabs(b);

  return (absa > absb
          ? absa * std::sqrt(1 + std::pow(absb/absa, 2))
          : (absb == 0 ? 0 : absb*std::sqrt(1 + std::pow(absa/absb, 2))));
}

/**
 * Translation of the SVD algorithm published in Numer. Math. 14, 403-420 (1970)
 * by G. H. Golub and C. Reinsch.
 *
 * Source: http://cs.brown.edu/courses/csci0530/current/homeworks/svd.py
 *
 * @param {Matrix<m,n>} A Matrix to decompose (m >= n)
 * @return {[Matrix<m,m>, Matrix<m,n>, Matrix<n,n>]} [U, E, V] s.t. A = U*E*V
 */
void svd(Matrix *A, Matrix **U, Matrix **S, Matrix **V) {
  double eps = std::numeric_limits<double>::epsilon();
  double tol = std::numeric_limits<double>::min() / eps;

  if (1.0 + eps <= 1.0) {
    throw "Make eps bigger";
  }
  if (tol <= 0.0) {
    throw "Make tol bigger";
  }

  int itmax = 50;
  int m = A->m();
  int n = A->n();
  double g = 0.0;
  double x = 0.0;
  std::vector<double> e(n, 0);

  *S = new Matrix(n, 1);
  *U = new Matrix(A);
  *V = new Matrix(n, n);

  double *q = (*S)->_data;
  Matrix *u = *U;
  Matrix *v = *V;

  int i, j, k, l, iteration, l1;
  double s, f, h, y, z, c;
  bool gotoTestFConvergence;

  if (m < n) {
    throw "m is less than n";
  }

  for (i = 0; i < n; i++) {
    e[i] = g;
    s = 0.0;
    l = i + 1;
    for (j = i; j < m; j++) s += u->_data[j*n+i] * u->_data[j*n+i];
    if (s < tol) {
      g = 0.0;
    } else {
      f = u->_data[i*n+i];
      if (f < 0.0) {
        g = std::sqrt(s);
      } else {
        g = -std::sqrt(s);
      }
      h = f*g-s;
      u->_data[i*n+i] = f-g;
      for (j = l; j < n; j++) {
        s = 0.0;
        for (k = i; k < m; k++) s += u->_data[k*n+i] * u->_data[k*n+j];
        f = s/h;
        for (k = i; k < m; k++) u->_data[k*n+j] = u->_data[k*n+j] + f*u->_data[k*n+i];
      }
    }
    q[i] = g;
    s = 0.0;
    for (j = l; j < n; j++) s = s + u->_data[i*n+j] * u->_data[i*n+j];
    if (s <= tol) {
      g = 0.0;
    } else {
      f = u->_data[i*n+i+1];
      if (f < 0.0) {
        g = std::sqrt(s);
      } else {
        g = -std::sqrt(s);
      }
      h = f*g - s;
      u->_data[i*n+i+1] = f-g;
      for (j = l; j < n; j++) e[j] = u->_data[i*n+j]/h;
      for (j = l; j < m; j++) {
        s = 0.0;
        for (k = l; k < n; k++) s = s + (u->_data[j*n+k] * u->_data[i*n+k]);
        for (k = l; k < n; k++) u->_data[j*n+k] = u->_data[j*n+k]+(s*e[k]);
      }
    }
    y = std::fabs(q[i]) + std::abs(e[i]);
    if (y > x) {
      x = y;
    }
  }
  // accumulation of right hand transformations
  for (i = n-1; i > -1; i--) {
    if (g != 0) {
      h = g*u->_data[i*n+i+1];
      for (j = l; j < n; j++) v->_data[j*n+i] = u->_data[i*n+j]/h;
      for (j = l; j < n; j++) {
        s = 0.0;
        for (k = l; k < n; k++) s += (u->_data[i*n+k]*v->_data[k*n+j]);
        for (k = l; k < n; k++) v->_data[k*n+j] += (s*v->_data[k*n+i]);
      }
    }
    for (j = l; j < n; j++) {
      v->_data[i*n+j] = 0.0;
      v->_data[j*n+i] = 0.0;
    }
    v->_data[i*n+i] = 1.0;
    g = e[i];
    l = i;
  }
  // accumulation of left hand transformations
  for (i = n-1; i > -1; i--) {
    l = i+1;
    g = q[i];
    for (j = l; j < n; j++) u->_data[i*n+j] = 0.0;
    if (g != 0.0) {
      h = u->_data[i*n+i]*g;
      for (j = l; j < n; j++)  {
        s = 0.0;
        for (k = l; k < m; k++) s += (u->_data[k*n+i]*u->_data[k*n+j]);
        f = s/h;
        for (k = i; k < m; k++) u->_data[k*n+j] += (f*u->_data[k*n+i]);
      }
      for (j = i; j < m; j++) u->_data[j*n+i] = u->_data[j*n+i] / g;
    } else {
      for (j = i; j < m; j++) u->_data[j*n+i] = 0.0;
    }
    u->_data[i*n+i] += 1.0;
  }
  // diagonalization of the bidiagonal form
  eps = eps*x;
  for (k = n-1; k > -1; k--) {
    for (iteration = 0; iteration < itmax; iteration++) {
      // test f splitting
      for (l = k; l > -1; l--) {
        gotoTestFConvergence = false;
        if (std::abs(e[l]) <= eps) {
          // goto test f convergence
          gotoTestFConvergence = true;
          break;
        }
        if (std::abs(q[l-1]) <= eps) {
          // goto cancellation
          break;
        }
      }
      if (!gotoTestFConvergence) {
        // cancellation of e[l] if l>0
        c = 0.0;
        s = 1.0;
        l1 = l-1;
        for (i = l; i < k+1; i++) {
          f = s*e[i];
          e[i] = c*e[i];
          if (std::abs(f) <= eps) {
            // goto test f convergence
            break;
          }
          g = q[i];
          h = pythag(f, g);
          q[i] = h;
          c = g/h;
          s = -f/h;
          for (j = 0; j < m; j++) {
            y = u->_data[j*n+l1];
            z = u->_data[j*n+i];
            u->_data[j*n+l1] = y*c+z*s;
            u->_data[j*n+i] = -y*s+z*c;
          }
        }
      }
      // test f convergence
      z = q[k];
      if (l == k) {
        // convergence
        if (z < 0.0) {
          // q[k] is made non-negative
          q[k] = -z;
          for (j = 0; j < n; j++) {
            v->_data[j*n+k] = -v->_data[j*n+k];
          }
        }
        break; // break out of iteration loop and move on to next k value
      }
      if (iteration >= itmax-1) {
        throw "SVD: No convergence";
      }
      // shift from bottom 2x2 minor
      x = q[l];
      y = q[k-1];
      g = e[k-1];
      h = e[k];
      f = ((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y);
      g = pythag(f, 1.0);
      if (f < 0) {
        f = ((x-z)*(x+z)+h*(y/(f-g)-h))/x;
      } else {
        f = ((x-z)*(x+z)+h*(y/(f+g)-h))/x;
      }
      // next QR transformation
      c = 1.0;
      s = 1.0;
      for (i = l+1; i < k+1; i++) {
        g = e[i];
        y = q[i];
        h = s*g;
        g = c*g;
        z = pythag(f,h);
        e[i-1] = z;
        c = f/z;
        s = h/z;
        f = x*c+g*s;
        g = -x*s+g*c;
        h = y*s;
        y = y*c;
        for (j = 0; j < n; j++) {
          x = v->_data[j*n+i-1];
          z = v->_data[j*n+i];
          v->_data[j*n+i-1] = x*c+z*s;
          v->_data[j*n+i] = -x*s+z*c;
        }
        z = pythag(f, h);
        q[i-1] = z;
        c = f/z;
        s = h/z;
        f = c*g+s*y;
        x = -s*g+c*y;
        for (j = 0; j < m; j++) {
          y = u->_data[j*n+i-1];
          z = u->_data[j*n+i];
          u->_data[j*n+i-1] = y*c+z*s;
          u->_data[j*n+i] = -y*s+z*c;
        }
      }
      e[l] = 0.0;
      e[k] = f;
      q[k] = x;
      // goto test f splitting
    }
  }

  //return [u, q, v];
}


