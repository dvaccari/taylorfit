#ifndef _TF_LSTSQ_H_
#define _TF_LSTSQ_H_

#include <vector>
#include "../matrix/matrix.h"

// Decomposes A into U, e, and V
void svd(Matrix *A, Matrix **U, Matrix **S, Matrix **V);

// Computes the coefficients for Ax = b using U, S, and V (from svd)
Matrix *lstsq_svd(Matrix *A, Matrix *U, Matrix *S, Matrix *V, Matrix *b);


#endif
