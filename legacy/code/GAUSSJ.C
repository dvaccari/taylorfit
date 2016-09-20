#include <math.h>
#define NRANSI
#include "nrutil.h"
#define SWAP(a,b) {temp=(a);(a)=(b);(b)=temp;}

/*	return 1 if OK otherwise 0 for singular matrix */

int gaussj(ElemT **a, int n, ElemT **b, int m)
{
	int *indxc,*indxr,*ipiv;
	int i,icol,irow,j,k,l,ll;
	ElemT big,dum,pivinv,temp;

	indxc	= (int *)vector(n, sizeof(int));
	indxr	= (int *)vector(n, sizeof(int));
	ipiv	= (int *)vector(n, sizeof(int));
	for (j=0;j<n;j++) ipiv[j]=0;
	for (i=0;i<n;i++) {
		big=0.0;
		for (j=0;j<n;j++)
			if (ipiv[j] != 1)
				for (k=0;k<n;k++) {
					if (ipiv[k] == 0) {
						if (fabs(a[j][k]) >= big) {
							big=fabs(a[j][k]);
							irow=j;
							icol=k;
						}
					} else if (ipiv[k] > 1) {
#ifdef	NOTDEF
						nrerror("gaussj: Singular Matrix-1");
#endif	NOTDEF
						return 0;
					}
				}
		++(ipiv[icol]);
		if (irow != icol) {
			for (l=0;l<n;l++) SWAP(a[irow][l],a[icol][l])
			for (l=0;l<m;l++) SWAP(b[irow][l],b[icol][l])
		}
		indxr[i]=irow;
		indxc[i]=icol;
		if (a[icol][icol] == 0.0) {
#ifdef	NOTDEF
			nrerror("gaussj: Singular Matrix-2");
#endif	NOTDEF
			return 0;
		}
		pivinv=1.0/a[icol][icol];
		a[icol][icol]=1.0;
		for (l=0;l<n;l++) a[icol][l] *= pivinv;
		for (l=0;l<m;l++) b[icol][l] *= pivinv;
		for (ll=0;ll<n;ll++)
			if (ll != icol) {
				dum=a[ll][icol];
				a[ll][icol]=0.0;
				for (l=0;l<n;l++) a[ll][l] -= a[icol][l]*dum;
				for (l=0;l<m;l++) b[ll][l] -= b[icol][l]*dum;
			}
	}
	for (l=n-1;l>=0;l--) {
		if (indxr[l] != indxc[l])
			for (k=0;k<n;k++)
				SWAP(a[k][indxr[l]],a[k][indxc[l]]);
	}
	free_vector((char *)ipiv);
	free_vector((char *)indxr);
	free_vector((char *)indxc);

	return 1;
}
#undef SWAP
#undef NRANSI
/* (C) Copr. 1986-92 Numerical Recipes Software -)#+%9. */
