'use strict';

const Matrix  = require('../matrix');

function pythag(a, b) {
  var absa = Math.abs(a)
    , absb = Math.abs(b);

  return (absa > absb
          ? absa * Math.sqrt(1 + Math.pow(absb/absa, 2))
          : (absb === 0 ? 0 : absb*Math.sqrt(1 + Math.pow(absa/absb, 2))));
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
function svd(A) {
  var eps = Number.EPSILON
    , tol = Number.MIN_VALUE / eps;

  if (1.0 + eps <= 1.0) {
    throw new Error('Make eps bigger');
  }
  if (tol <= 0.0) {
    throw new Error('Make tol bigger');
  }

  var itmax = 50
    , u = A.clone()
    , m = u.shape[0]
    , n = u.shape[1]
    , e = []
    , q = []
    , v = new Matrix(n, n)
    , g = 0.0
    , x = 0.0
    , i, j, k, l, s, f, h, y, iteration, gotoTestFConvergence, z, c, l1;

  if (m < n) {
    throw new Error('m is less than n');
  }

  for (i = 0; i < n; i++) {
    e[i] = g;
    s = 0.0;
    l = i + 1;
    for (j = i; j < m; j++) s += u.data[j*n+i]*u.data[j*n+i];
    if (s < tol) {
      g = 0.0;
    } else {
      f = u.data[i*n+i];
      if (f < 0.0) {
        g = Math.sqrt(s);
      } else {
        g = -Math.sqrt(s);
      }
      h = f*g-s;
      u.data[i*n+i] = f-g;
      for (j = l; j < n; j++) {
        s = 0.0;
        for (k = i; k < m; k++) s += u.data[k*n+i]*u.data[k*n+j];
        f = s/h;
        for (k = i; k < m; k++) u.data[k*n+j] = u.data[k*n+j] + f*u.data[k*n+i];
      }
    }
    q[i] = g;
    s = 0.0;
    for (j = l; j < n; j++) s = s + u.data[i*n+j]*u.data[i*n+j];
    if (s <= tol) {
      g = 0.0;
    } else {
      f = u.data[i*n+i+1];
      if (f < 0.0) {
        g = Math.sqrt(s);
      } else {
        g = -Math.sqrt(s);
      }
      h = f*g - s;
      u.data[i*n+i+1] = f-g;
      for (j = l; j < n; j++) e[j] = u.data[i*n+j]/h;
      for (j = l; j < m; j++) {
        s = 0.0;
        for (k = l; k < n; k++) s = s + (u.data[j*n+k]*u.data[i*n+k]);
        for (k = l; k < n; k++) u.data[j*n+k] = u.data[j*n+k]+(s*e[k]);
      }
    }
    y = Math.abs(q[i]) + Math.abs(e[i]);
    if (y > x) {
      x = y;
    }
  }
  // accumulation of right hand transformations
  for (i = n-1; i > -1; i--) {
    if (g !== 0) {
      h = g*u.data[i*n+i+1];
      for (j = l; j < n; j++) v.data[j*n+i] = u.data[i*n+j]/h;
      for (j = l; j < n; j++) {
        s = 0.0;
        for (k = l; k < n; k++) s += (u.data[i*n+k]*v.data[k*n+j]);
        for (k = l; k < n; k++) v.data[k*n+j] += (s*v.data[k*n+i]);
      }
    }
    for (j = l; j < n; j++) {
      v.data[i*n+j] = 0.0;
      v.data[j*n+i] = 0.0;
    }
    v.data[i*n+i] = 1.0;
    g = e[i];
    l = i;
  }
  // accumulation of left hand transformations
  for (i = n-1; i > -1; i--) {
    l = i+1;
    g = q[i];
    for (j = l; j < n; j++) u.data[i*n+j] = 0.0;
    if (g !== 0.0) {
      h = u.data[i*n+i]*g;
      for (j = l; j < n; j++)  {
        s = 0.0;
        for (k = l; k < m; k++) s += (u.data[k*n+i]*u.data[k*n+j]);
        f = s/h;
        for (k = i; k < m; k++) u.data[k*n+j] += (f*u.data[k*n+i]);
      }
      for (j = i; j < m; j++) u.data[j*n+i] = u.data[j*n+i] / g;
    } else {
      for (j = i; j < m; j++) u.data[j*n+i] = 0.0;
    }
    u.data[i*n+i] += 1.0;
  }
  // diagonalization of the bidiagonal form
  eps = eps*x;
  for (k = n-1; k > -1; k--) {
    for (iteration = 0; iteration < itmax; iteration++) {
      // test f splitting
      for (l = k; l > -1; l--) {
        gotoTestFConvergence = false;
        if (Math.abs(e[l]) <= eps) {
          // goto test f convergence
          gotoTestFConvergence = true;
          break;
        }
        if (Math.abs(q[l-1]) <= eps) {
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
          if (Math.abs(f) <= eps) {
            // goto test f convergence
            break;
          }
          g = q[i];
          h = pythag(f, g);
          q[i] = h;
          c = g/h;
          s = -f/h;
          for (j = 0; j < m; j++) {
            y = u.data[j*n+l1];
            z = u.data[j*n+i];
            u.data[j*n+l1] = y*c+z*s;
            u.data[j*n+i] = -y*s+z*c;
          }
        }
      }
      // test f convergence
      z = q[k];
      if (l === k) {
        // convergence
        if (z < 0.0) {
          // q[k] is made non-negative
          q[k] = -z;
          for (j = 0; j < n; j++) {
            v.data[j*n+k] = -v.data[j*n+k];
          }
        }
        break; // break out of iteration loop and move on to next k value
      }
      if (iteration >= itmax-1) {
        throw new Error('SVD: No convergence');
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
          x = v.data[j*n+i-1];
          z = v.data[j*n+i];
          v.data[j*n+i-1] = x*c+z*s;
          v.data[j*n+i] = -x*s+z*c;
        }
        z = pythag(f, h);
        q[i-1] = z;
        c = f/z;
        s = h/z;
        f = c*g+s*y;
        x = -s*g+c*y;
        for (j = 0; j < m; j++) {
          y = u.data[j*n+i-1];
          z = u.data[j*n+i];
          u.data[j*n+i-1] = y*c+z*s;
          u.data[j*n+i] = -y*s+z*c;
        }
      }
      e[l] = 0.0;
      e[k] = f;
      q[k] = x;
      // goto test f splitting
    }
  }

  return [u, q, v];
}

module.exports = svd;

