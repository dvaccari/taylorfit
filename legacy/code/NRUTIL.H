#ifndef _NR_UTILS_H_
#define _NR_UTILS_H_

typedef	float	ElemT;

static ElemT sqrarg;
#define SQR(a) ((sqrarg=(a)) == 0.0 ? 0.0 : sqrarg*sqrarg)

#define SIGN(a,b) ((b) >= 0.0 ? fabs(a) : -fabs(a))

static float maxarg1,maxarg2;
#define FMAX(a,b) (maxarg1=(a),maxarg2=(b),(maxarg1) > (maxarg2) ?\
        (maxarg1) : (maxarg2))

static int iminarg1,iminarg2;
#define IMIN(a,b) (iminarg1=(a),iminarg2=(b),(iminarg1) < (iminarg2) ?\
        (iminarg1) : (iminarg2))

void	nrerror(char error_text[]);
char	*vector(int n, int size);
void	free_vector(char *v);
ElemT	**myMatrix(int row, int col);
void	myFreeMatrix(int row, ElemT **m);

/*	gaussj() retursns 1 if OK otherwise 0 for singular matrix */
int		gaussj(ElemT **a, int n, ElemT **b, int m);
void	svdcmp(ElemT **a, int m, int n, ElemT *w, ElemT **v);
void	svbksb(ElemT **u, ElemT *w, ElemT **v, int m, int n, ElemT *b,
			ElemT *x);
void	svdvar(ElemT **v, int ma, ElemT w[], ElemT **cvm);
ElemT	pythag(ElemT a, ElemT b);

#endif
