#include <stdio.h>
#include <math.h>
#include "nrutil.h"

#define	MAX_ITERATE	100

void svdcmp(ElemT **a, int m, int n, ElemT *w, ElemT **v)
{
	ElemT pythag(ElemT a, ElemT b);
	int flag,i,its,j,jj,k,l,nm;
	ElemT anorm, c, f, g, h, s, scale, x, y, z, *rv1;

	rv1	= (ElemT *) vector(n, sizeof(ElemT));
	g = scale = anorm = 0.0;
	for (i = 0; i < n; i++) {
		l=i+1;
		rv1[i]=scale*g;
		g=s=scale=0.0;
		if (i < m) {
			for (k=i;k<m;k++) scale += fabs(a[k][i]);
			if (scale) {
				for (k=i;k<m;k++) {
					a[k][i] /= scale;
					s += a[k][i]*a[k][i];
				}
				f=a[i][i];
				g = -SIGN(sqrt(s),f);
				h=f*g-s;
				a[i][i]=f-g;
				for (j=l;j<n;j++) {
					for (s=0.0,k=i;k<m;k++) s += a[k][i]*a[k][j];
					f=s/h;
					for (k=i;k<m;k++) a[k][j] += f*a[k][i];
				}
				for (k=i;k<m;k++) a[k][i] *= scale;
			}
		}
		w[i]=scale *g;
		g=s=scale=0.0;
		if (i < m && i != n-1) {
			for (k=l;k<n;k++) scale += fabs(a[i][k]);
			if (scale) {
				for (k=l;k<n;k++) {
					a[i][k] /= scale;
					s += a[i][k]*a[i][k];
				}
				f=a[i][l];
				g = -SIGN(sqrt(s),f);
				h=f*g-s;
				a[i][l]=f-g;
				for (k=l;k<n;k++) rv1[k]=a[i][k]/h;
				for (j=l;j<m;j++) {
					for (s=0.0,k=l;k<n;k++) s += a[j][k]*a[i][k];
					for (k=l;k<n;k++) a[j][k] += s*rv1[k];
				}
				for (k=l;k<n;k++) a[i][k] *= scale;
			}
		}
		anorm=FMAX(anorm,(fabs(w[i])+fabs(rv1[i])));
	}
	for (i=n-1;i>=0;i--) {
		if (i < n-1) {
			if (g) {
				for (j=l;j<n;j++)
					v[j][i]=(a[i][j]/a[i][l])/g;
				for (j=l;j<n;j++) {
					for (s=0.0,k=l;k<n;k++) s += a[i][k]*v[k][j];
					for (k=l;k<n;k++) v[k][j] += s*v[k][i];
				}
			}
			for (j=l;j<n;j++) v[i][j]=v[j][i]=0.0;
		}
		v[i][i]=1.0;
		g=rv1[i];
		l=i;
	}
	for (i=IMIN(m,n)-1;i>=0;i--) {
		l=i+1;
		g=w[i];
		for (j=l;j<n;j++) a[i][j]=0.0;
		if (g) {
			g=1.0/g;
			for (j=l;j<n;j++) {
				for (s=0.0,k=l;k<m;k++) s += a[k][i]*a[k][j];
				f=(s/a[i][i])*g;
				for (k=i;k<m;k++) a[k][j] += f*a[k][i];
			}
			for (j=i;j<m;j++) a[j][i] *= g;
		} else for (j=i;j<m;j++) a[j][i]=0.0;
		++a[i][i];
	}
	for (k=n-1;k>=0;k--) {
		for (its=1;its<=MAX_ITERATE;its++) {
			flag=1;
			for (l=k;l>=0;l--) {
				nm=l-1;
				if ((float)(fabs(rv1[l])+anorm) == anorm) {
					flag=0;
					break;
				}
				if (l == 0 || (float)(fabs(w[nm])+anorm) == anorm) break;
				/* break out the loop before l become negative */
			}
			if (flag) {
				c=0.0;
				s=1.0;
				for (i=l;i<=k;i++) {
					f=s*rv1[i];
					rv1[i]=c*rv1[i];
					if ((float)(fabs(f)+anorm) == anorm) break;
					g=w[i];
					h=pythag(f,g);
					w[i]=h;
					h=1.0/h;
					c=g*h;
					s = -f*h;
					for (j=0;j<m;j++) {
						/* exception trap */
						if (nm < 0) nrerror("nm is negative value");
						y=a[j][nm];
						z=a[j][i];
						a[j][nm]=y*c+z*s;
						a[j][i]=z*c-y*s;
					}
				}
			}
			z=w[k];
			if (l == k) {
				if (z < 0.0) {
					w[k] = -z;
					for (j=0;j<n;j++) v[j][k] = -v[j][k];
				}
				break;
			}
			if (its == MAX_ITERATE) nrerror("no convergence in 100 svdcmp iterations");
			x=w[l];
			nm=k-1;
			/* my version */
			if (nm >= 0) {
				y=w[nm];
				g=rv1[nm];
			} else {
				y = g = 0;
			}
			h=rv1[k];
			f=((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y);
			g=pythag(f,1.0);
			f=((x-z)*(x+z)+h*((y/(f+SIGN(g,f)))-h))/x;
			c=s=1.0;
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
				g = g*c-x*s;
				h=y*s;
				y *= c;
				for (jj=0;jj<n;jj++) {
					x=v[jj][j];
					z=v[jj][i];
					v[jj][j]=x*c+z*s;
					v[jj][i]=z*c-x*s;
				}
				z=pythag(f,h);
				w[j]=z;
				if (z) {
					z=1.0/z;
					c=f*z;
					s=h*z;
				}
				f=c*g+s*y;
				x=c*y-s*g;
				for (jj=0;jj<m;jj++) {
					y=a[jj][j];
					z=a[jj][i];
					a[jj][j]=y*c+z*s;
					a[jj][i]=z*c-y*s;
				}
			}
			rv1[l]=0.0;
			rv1[k]=f;
			w[k]=x;
		}

		if (its > 50) {
			fprintf(stderr, "Warning: svdcmp reached %d iterations", its);
		}
	}
	free_vector((char *)rv1);
}

void svbksb(ElemT **u, ElemT w[], ElemT **v, int m, int n, ElemT b[], ElemT x[])
{
	int jj,j,i;
	ElemT s,*tmp;

	tmp = (ElemT *)vector(n, sizeof(ElemT));
	for (j=0;j<n;j++) {
		s=0.0;
		if (w[j]) {
			for (i=0;i<m;i++) s += u[i][j]*b[i];
			s /= w[j];
		}
		tmp[j]=s;
	}
	for (j=0;j<n;j++) {
		s=0.0;
		for (jj=0;jj<n;jj++) s += v[j][jj]*tmp[jj];
		x[j]=s;
	}
	free_vector((char *)tmp);
}

void svdvar(ElemT **v, int ma, ElemT w[], ElemT **cvm)
{
	int k,j,i;
	ElemT sum,*wti;

	wti = (ElemT *)vector(ma, sizeof(ElemT));
	for (i = 0; i < ma; i++) {
		wti[i] = 0.0;
		if (w[i] != 0.0) {
			wti[i] = 1.0 /(w[i] * w[i]);
		}
	}
	for (i = 0; i < ma; i++) {
		for (j = 0; j < i; j++) {
			for (sum = 0.0, k = 0; k < ma; k++) {
				sum += v[i][k]*v[j][k]*wti[k];
			}
			cvm[j][i] = cvm[i][j] = sum;
		}
	}
	free_vector((char *)wti);
}

ElemT pythag(ElemT a, ElemT b)
{
	ElemT absa,absb;
	absa=fabs(a);
	absb=fabs(b);
	if (absa > absb) return absa*sqrt(1.0+SQR(absb/absa));
	else return (absb == 0.0 ? 0.0 : absb*sqrt(1.0+SQR(absa/absb)));
}
/* (C) Copr. 1986-92 Numerical Recipes Software 39,{sLs<,1`. */
