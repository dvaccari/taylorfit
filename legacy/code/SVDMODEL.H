#ifndef	__SVD_MODEL_H
#define	__SVD_MODEL_H

/////////////////// The Model Using SVD Method ////////////////////////
#include "Model.h"

extern "C" {
	ElemT** myMatrix(int num_row, int num_col);		// nrutil.c
	void	myFreeMatrix(int row, ElemT **matrix);	// nrutil.c
	char *	vector(int n, int elem_size);
	void	free_vector(char *v);
	void	svdcmp(ElemT **a, int m, int n, ElemT *w, ElemT **v);
	void	svbksb(ElemT **u, ElemT *w, ElemT **v, int m, int n, ElemT *b,
				ElemT *x);
	void	svdvar(ElemT **v, int ma, ElemT w[], ElemT **cvm);
	double	sqrt(double value);
	double	fabs(double value);
};

class SvdModel : public Model {
public:
	// Constructors and destructor
	// depTerm should be lagged term
	SvdModel(const Term& fittingDepTErm, const Term& testDepTerm);
	~SvdModel();

	void		normalized(BooleanT flag);
	BooleanT	normalized() const;

	void	covariance(ostream& strm = cout);

	float	defaultTolerance() const;
	void	tolerance(float tol);
	float	tolerance() const;

	//	virtual functions from base class
	void	addTerm(const CanTerm& fittingTerm,
			const Term& fittingDepTerm,
			const CanTerm& testTerm,
			const Term& testDepTerm);
	void	addTerm(const Term& fittingTerm,
			const Term& fittingDepTerm,
			const Term& testTerm,
			const Term& testDepTerm);
	void	delTerm(int idx);

	BooleanT	fit(const Term& fittingDepTerm,
				DataT fittingTSS,
				const Term& testDepTerm,
				DataT testTSS);

protected:
	void	expandMatrix();
	void	fixMatrix(const Term& depTerm);

	void	calSEC();
private:
	static const float _TOLERANCE;

	float		_tolerance;
	BooleanT	_normalized;
	ElemT		**_UMatrix;		// U matrix for SVD
	ElemT		**_uMatrix;		// u matrix for SVD
	ElemT		**_vMatrix;		// v matrix for SVD
	ElemT		*_wVector;		// w vector for SVD
	ElemT		*_aVector;		// a vector for SVD
	ElemT		*_bVector;		// b vector for SVD
};

inline void
SvdModel::normalized(BooleanT flag)
{
	_normalized = flag;
}

inline BooleanT
SvdModel::normalized() const
{
	return _normalized;
}

inline float
SvdModel::defaultTolerance() const
{
	return _TOLERANCE;
}

inline void
SvdModel::tolerance(float tol)
{
	_tolerance = tol;
}

inline float
SvdModel::tolerance() const
{
	return _tolerance;
}

#endif	__SVD_MODEL_H
