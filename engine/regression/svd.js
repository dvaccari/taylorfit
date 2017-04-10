
const Matrix  = require('../matrix');

function pythag(a, b) {
  var absa = Math.abs(a)
    , absb = Math.abs(b);

  return (absa > absb
          ? absa * Math.sqrt(1 + Math.pow(absb/absa, 2))
          : (absb === 0 ? 0 : absb*Math.sqrt(1 + Math.pow(absa/absb, 2))));
}

function SIGN(a, b) {
  return b >= 0 ? (a >= 0 ? a : -a) : (a >= 0 ? -a : a); 
}

function svd2(A) {
  var u = A.clone()
    , w = []
    , m = u.shape[0]
    , n = u.shape[1]
    , v = new Matrix(n, n);
  var flag, i, its, j, jj, k, l, nm, anorm, c, f, g, h, s, scale, x, y, z;
  var rv1 = [];

  var abs = Math.abs
    , sqrt = Math.sqrt
    , MAX = Math.max
    , MIN = Math.min
    , eps = Number.EPSILON;

  g = scale = anorm = 0.0;
  for (i=0;i<n;i++) {
    l=i+2;
    rv1[i]=scale*g;
    g=s=scale=0.0;
    if (i < m) {
      for (k=i;k<m;k++) scale += abs(u.data[k * n + i]);
      if (scale != 0.0) {
        for (k=i;k<m;k++) {
          u.data[k * n + i] /= scale;
          s += u.data[k * n + i]*u.data[k * n + i];
        }
        f=u.data[i * n + i];
        g = -SIGN(sqrt(s),f);
        h=f*g-s;
        u.data[i * n + i]=f-g;
        for (j=l-1;j<n;j++) {
          for (s=0.0,k=i;k<m;k++) s += u.data[k * n + i]*u.data[k * n + j];
          f=s/h;
          for (k=i;k<m;k++) u.data[k * n + j] += f*u.data[k * n + i];
        }
        for (k=i;k<m;k++) u.data[k * n + i] *= scale;
      }
    }
    w[i]=scale *g;
    g=s=scale=0.0;
    if (i+1 <= m && i+1 != n) {
      for (k=l-1;k<n;k++) scale += abs(u.data[i * n + k]);
      if (scale != 0.0) {
        for (k=l-1;k<n;k++) {
          u.data[i * n + k] /= scale;
          s += u.data[i * n + k]*u.data[i * n + k];
        }
        f=u.data[i * n + l-1];
        g = -SIGN(sqrt(s),f);
        h=f*g-s;
        u.data[i * n + l-1]=f-g;
        for (k=l-1;k<n;k++) rv1[k]=u.data[i * n + k]/h;
        for (j=l-1;j<m;j++) {
          for (s=0.0,k=l-1;k<n;k++) s += u.data[j * n + k]*u.data[i * n + k];
          for (k=l-1;k<n;k++) u.data[j * n + k] += s*rv1[k];
        }
        for (k=l-1;k<n;k++) u.data[i * n + k] *= scale;
      }
    }
    anorm=MAX(anorm,(abs(w[i])+abs(rv1[i])));
  }
  for (i=n-1;i>=0;i--) { //Accumulation of right-hand transformations.
    if (i < n-1) {
      if (g != 0.0) {
        for (j=l;j<n;j++) //Double division to avoid possible underflow.
          v.data[j * n + i]=(u.data[i * n + j]/u.data[i * n + l])/g;
        for (j=l;j<n;j++) {
          for (s=0.0,k=l;k<n;k++) s += u.data[i * n + k]*v.data[k * n + j];
          for (k=l;k<n;k++) v.data[k * n + j] += s*v.data[k * n + i];
        }
      }
      for (j=l;j<n;j++) v.data[i * n + j]=v.data[j * n + i]=0.0;
    }
    v.data[i * n + i]=1.0;
    g=rv1[i];
    l=i;
  }
  for (i=MIN(m,n)-1;i>=0;i--) { //Accumulation of left-hand transformations.
    l=i+1;
    g=w[i];
    for (j=l;j<n;j++) u.data[i * n + j]=0.0;
    if (g != 0.0) {
      g=1.0/g;
      for (j=l;j<n;j++) {
        for (s=0.0,k=l;k<m;k++) s += u.data[k * n + i]*u.data[k * n + j];
        f=(s/u.data[i * n + i])*g;
        for (k=i;k<m;k++) u.data[k * n + j] += f*u.data[k * n + i];
      }
      for (j=i;j<m;j++) u.data[j * n + i] *= g;
    } else for (j=i;j<m;j++) u.data[j * n + i]=0.0;
    ++u.data[i * n + i];
  }
  for (k=n-1;k>=0;k--) { //Diagonalization of the bidiagonal form: Loop over
    for (its=0;its<30;its++) { //singular values, and over allowed iterations.
      flag=true;
      for (l=k;l>=0;l--) { //Test for splitting.
        nm=l-1;
        if (l == 0 || abs(rv1[l]) <= eps*anorm) {
          flag=false;
          break;
        }
        if (abs(w[nm]) <= eps*anorm) break;
      }
      if (flag) {
        c=0.0; //Cancellation of rv1[l], if l > 0.
        s=1.0;
        for (i=l;i<k+1;i++) {
          f=s*rv1[i];
          rv1[i]=c*rv1[i];
          if (abs(f) <= eps*anorm) break;
          g=w[i];
          h=pythag(f,g);
          w[i]=h;
          h=1.0/h;
          c=g*h;
          s = -f*h;
          for (j=0;j<m;j++) {
            y=u.data[j * n + nm];
            z=u.data[j * n + i];
            u.data[j * n + nm]=y*c+z*s;
            u.data[j * n + i]=z*c-y*s;
          }
        }
      }
      z=w[k];
      if (l == k) { //Convergence.
        if (z < 0.0) { //Singular value is made nonnegative.
          w[k] = -z;
          for (j=0;j<n;j++) v.data[j * n + k] = -v.data[j * n + k];
        }
        break;
      }
      if (its == 29) throw("no convergence in 30 svdcmp iterations");
      x=w[l]; //Shift from bottom 2-by-2 minor.
      nm=k-1;
      y=w[nm];
      g=rv1[nm];
      h=rv1[k];
      f=((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y);
      g=pythag(f,1.0);
      f=((x-z)*(x+z)+h*((y/(f+SIGN(g,f)))-h))/x;
      c=s=1.0; //Next QR transformation:
      for (j=l;j<=nm;j++) {
        i=j+1;
        g=rv1[i];
        y=w[i];
        h=s*g;
        g=c*g;
        z=pythag(f,h);
        rv1[j]=z;
        c=f/z;
        s=h/z;
        f=x*c+g*s;
        g=g*c-x*s;
        h=y*s;
        y *= c;
        for (jj=0;jj<n;jj++) {
          x=v.data[jj * n + j];
          z=v.data[jj * n + i];
          v.data[jj * n + j]=x*c+z*s;
          v.data[jj * n + i]=z*c-x*s;
        }
        z=pythag(f,h);
        w[j]=z; //Rotation can be arbitrary if z D 0.
        if (z) {
          z=1.0/z;
          c=f*z;
          s=h*z;
        }
        f=c*g+s*y;
        x=c*y-s*g;
        for (jj=0;jj<m;jj++) {
          y=u.data[jj * n + j];
          z=u.data[jj * n + i];
          u.data[jj * n + j]=y*c+z*s;
          u.data[jj * n + i]=z*c-y*s;
        }
      }
      rv1[l]=0.0;
      rv1[k]=f;
      w[k]=x;
    }
  }
  return [u, w, v];
}


var a = new Matrix(2, 3, Float64Array.from([3, 2, 2, 2, 3, -2]));

var stuff = svd2(a);

var u = new Matrix(2, 2, [1/Math.sqrt(2),  1/Math.sqrt(2),
                          1/Math.sqrt(2), -1/Math.sqrt(2)]);

var v = new Matrix(3, 3, [1/Math.sqrt(2) ,  1/Math.sqrt(2) , 0,
                          1/Math.sqrt(18), -1/Math.sqrt(18), 4/Math.sqrt(18),
                          2/3            , -2/3            , -1/3]);

console.log(u.toString());
console.log(v.toString());

console.log(stuff[0].toString());
console.log(stuff[1].toString());
console.log(stuff[2].toString());

