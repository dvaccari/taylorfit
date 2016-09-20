#include <stdio.h>
#include <stddef.h>
#include <stdlib.h>
#include "nrutil.h"

void nrerror(char error_text[])
/* Numerical Recipes standard error handler */
{
	fprintf(stderr,"Numerical Recipes run-time error...\n");
	fprintf(stderr,"%s\n",error_text);
	fprintf(stderr,"...now exiting to system...\n");
	exit(1);
}

char *vector(int n, int size)
{
	char *v;

	v = malloc((size_t) (n*size));
	if (!v) {
		char msg[50];
		sprintf(msg, "allocation failure in vector(%d, %d)", n, size);
		nrerror(msg);
	}
	return v;
}

void free_vector(char *v)
/* free an int vector allocated with vector() */
{
	free(v);
}

ElemT **myMatrix(int row, int col)
{
	ElemT **m;
	int i;

	/* allocate pointers to rows */
	m=(ElemT **) malloc((size_t)(row*sizeof(ElemT*)));
	if (!m) {
		char msg[50];
		sprintf(msg, "allocation failure 1 in myMatrix() %d",
			row * sizeof(ElemT*));
		nrerror(msg);
	}

	for (i = 0; i < row; i++) {
		if ((m[i] = (ElemT *) malloc((size_t)(col * sizeof(ElemT)))) == NULL) {
			char msg[50];
			sprintf(msg, "allocation failure 2 in myMatrix() %d",
				col * sizeof(ElemT));
			nrerror(msg);
		}
	}

	/* return pointer to array of pointers to rows */
	return m;
}

void myFreeMatrix(int row, ElemT **m)
{
	int i;

	for (i = 0; i < row; i++)
		free((char *) m[i]);

	free((char *) m);
}

/* (C) Copr. 1986-92 Numerical Recipes Software $!6)$6;#>). */
