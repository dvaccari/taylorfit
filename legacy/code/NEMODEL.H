#ifndef	__NE_MODEL_H
#define	__NE_MODEL_H

/////////////////  The Model Using Normal Equation Method //////////////////
#include "Model.h"

extern "C" {
	ElemT** myMatrix(int num_row, int num_col);		// nrutil.c
	void	myFreeMatrix(int row, ElemT **matrix);	// nrutil.c
	int	gaussj(ElemT **iMatrix, int x, ElemT **coeff, int y);	// gaussj.c
};

class NeModel : public Model {
public:
	// Constructors and destructor
	// depTerm should be lagged term
	NeModel(const Term& fittingDepTerm, const Term& testDepTerm);
	~NeModel();

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
	ElemT	newElement(const Term& term);
	void	expandMatrix();
	void	fixMatrix(const Term& depTerm);

	void	calSEC();
private:
	ElemT	**_matrix;		// X matrix for Normal Equation
	ElemT	**_invMatrix;		// placeholder for inverse matrix
	ElemT	**_coeff;		// coefficient	- a vector
	ElemT	**_result;		// result	- b vector
};

#endif	__NE_MODEL_H
