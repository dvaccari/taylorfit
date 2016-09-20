// #include <math.h>
// #include <stdlib.h>
// #include <assert.h>
#include "NeModel.h"

NeModel::NeModel(const Term& fittingDepTerm, const Term& testDepTerm)
	: Model(fittingDepTerm, testDepTerm)
{
	Trace t("NeModel::NeModel()", TRACE_ID);

	_matrix		= myMatrix(getTermUpper(), getTermUpper());
	_invMatrix	= myMatrix(getTermUpper(), getTermUpper());
	_coeff		= myMatrix(getTermUpper(), 1);
	_result		= myMatrix(getTermUpper(), 1);
}

NeModel::~NeModel()
{
	Trace t("NeModel::~NeModel()", TRACE_ID);

	myFreeMatrix(getTermUpper(), _matrix);
	myFreeMatrix(getTermUpper(), _invMatrix);
	myFreeMatrix(getTermUpper(), _coeff);
	myFreeMatrix(getTermUpper(), _result);
}

void
NeModel::expandMatrix()
{
	Trace t("NeModel::expandMatrix()", TRACE_ID);

	// overflow, need to allocate more space for a bigger matrix
	int i;
	int newUpper = getTermUpper() + getTermDelta();

	t.out(T_DEBUG) << "newUpper " << newUpper << endl;

	ElemT **newMatrix = myMatrix(newUpper, newUpper);
	ElemT **newResult = myMatrix(newUpper, 1);

	// copy existing matrices to the newly allocated matrices
	for (i = 0; i < countTerms(); i++) {
		memcpy(newMatrix[i], _matrix[i], countTerms() * sizeof(ElemT));
		newResult[i][0]	= _result[i][0];
	}

	myFreeMatrix(getTermUpper(), _matrix);	// still old term upper
	myFreeMatrix(getTermUpper(), _result);	// still old term upper
	myFreeMatrix(getTermUpper(), _invMatrix);
	myFreeMatrix(getTermUpper(), _coeff);

	_matrix		= newMatrix;
	_result		= newResult;
	_invMatrix	= myMatrix(newUpper, newUpper);
	_coeff		= myMatrix(newUpper, 1);
}

//	Adding a candidate term from a base Term object
void
NeModel::addTerm(const Term& fittingTerm,
	const Term& fittingDepTerm,
	const Term& testTerm,
	const Term& testDepTerm)
{
	if (countTerms() == getTermUpper()) {
		expandMatrix();	// to expand the matrix size
	}

	CanTerm tmpFitting(fittingTerm);
	CanTerm tmpTest(testTerm);
	Model::addTerm(tmpFitting, fittingDepTerm, tmpTest, testDepTerm);

	fixMatrix(fittingDepTerm);
}

//	Adding a candidate term from another candidate term
void
NeModel::addTerm(const CanTerm& fittingTerm,
	const Term& fittingDepTerm,
	const CanTerm& testTerm,
	const Term& testDepTerm)
{
	if (countTerms() == getTermUpper()) {
		expandMatrix();	// to expand the matrix size
	}

	Model::addTerm(fittingTerm, fittingDepTerm, testTerm, testDepTerm);

	fixMatrix(fittingDepTerm);
}

//////////////////////////////////////////////////////////////
//	It needs to recalculate the last column of SVD matrix
//	when there is a new term added into the model
//////////////////////////////////////////////////////////////
void
NeModel::fixMatrix(const Term& fittingDepTerm)
{
	Trace t("NeModel::fixMatrix()", TRACE_ID);

	int i;
	int lastIdx = countTerms() - 1;

	// calculate the new row and column of the symatric matrix
	for (i = 0; i < countTerms(); i++) {
		_matrix[i][lastIdx]	= newElement(getFittingTerm(i));
		_matrix[lastIdx][i]	= _matrix[i][lastIdx];
	}

	// calculate the new element of result vector (b vector)
	_result[lastIdx][0] = newElement(fittingDepTerm);
}

//	NOTE:	This function generates 2-digit precision floating point
//		number.
ElemT
NeModel::newElement(const Term& term)
{
	int	i;
	int	lastIdx = countTerms() - 1;	// the last term in the array
	ElemT	sum = 0.0;

	for (i = 0; i < ndF(); i++) {
		sum += (getFittingTerm(lastIdx).getData(i) * term.getData(i));
	}

	return sum;
}

////////////////////////////////////////////////////////////////////
//	This operation needs to remove the corresponding column
//	of the matrix before removing the term out of model.
////////////////////////////////////////////////////////////////////
void
NeModel::delTerm(int idx)
{
	int i, j;

	// remove all the associated elements in matrices
	// first shift columns to left by one for all the column index > idx
	for (i = 0; i < countTerms(); i++) {
		// for each row
		for (j = idx; j < countTerms() - 1; j++)
			_matrix[i][j] = _matrix[i][j+1];	// to the left

		_matrix[i][j]	= 0;
	}

	// then move rows up by one for all the row index > idx
	for (i = idx; i < countTerms() - 1; i++) {
		for (j = 0; j < countTerms() - 1; j++)
			_matrix[i][j] = _matrix[i+1][j];	// up one row

		_result[i][0] = _result[i+1][0];
	}

	// last row
	for (j = 0; j < countTerms(); j++) {
		_matrix[countTerms() - 1][j] = 0;
	}
	_result[countTerms() -1][0]	= 0;

	// CANNOT delete the term from array before the matrices are taken care
	// because the countTerms() will be decremented by 1
	Model::delTerm(idx);
}

BooleanT
NeModel::fit(const Term& fittingDepTerm,
	DataT fittingTSS,
	const Term& testDepTerm,
	DataT testTSS)
{
	Trace t("NeModel::fit()", TRACE_ID);

	int i;

	// each time _invMatrix and _coeff needs to be updated, because
	// from last gaussj(), _invMatrix return inverse matrix and _coeff
	// is for different model
	for (i = 0; i < countTerms(); i++) {
		memcpy(_invMatrix[i], _matrix[i], countTerms() * sizeof(ElemT));
		_coeff[i][0] = _result[i][0];
	}

	if (countTerms() > 0) {
		if (gaussj(_invMatrix, countTerms(), _coeff, 1) == 0) {
			t.out(T_DEBUG) << "WARNING: Singular Matrix detected"
				<< endl;
			return NO;
		}
	}

	// NON SINGULAR MATRIX
#ifdef	UNIT_TEST
	int j, k, l;
	ElemT	**u, **v;

	t.out(T_DEBUG) << endl << "\t\t***** New Matrix *****" << endl;
	for (i = 0; i < countTerms(); i++) {
		t.out(T_DEBUG) << "\t";
		for (j = 0; j < countTerms(); j++)
			t.out(T_DEBUG) << "[" << _matrix[i][j] << "] ";

		t.out(T_DEBUG) << endl;
	}
	t.out(T_DEBUG) << endl << "\t\t***** Inverse Matrix *****" << endl;
	for (i = 0; i < countTerms(); i++) {
		t.out(T_DEBUG) << "\t";
		for (j = 0; j < countTerms(); j++)
			t.out(T_DEBUG) << "[" << _invMatrix[i][j] << "] ";

		t.out(T_DEBUG) << endl;
	}
	t.out(T_DEBUG) << "\t\t===== Coefficients =====" << endl << "\t";
	for (i = 0; i < countTerms(); i++)
		t.out(T_DEBUG) << "[" << _coeff[i][0] << "] ";

	t.out(T_DEBUG) << endl << endl;

	u = myMatrix(getTermUpper(), getTermUpper());

	t.out(T_DEBUG) << endl << "\tX * X-inv:" << endl;
	for (k = 0; k < countTerms(); k++) {
		for (l = 0; l < countTerms(); l++) {
			u[k][l] = 0.0;
			for (j = 0; j < countTerms(); j++)
				u[k][l] += (_matrix[k][j] * _invMatrix[j][l]);
		}
		t.out(T_DEBUG) << "\t";
		for (l = 0; l < countTerms(); l++)
			t.out(T_DEBUG) << " " << u[k][l];
		t.out(T_DEBUG) << endl;
	}
	t.out(T_DEBUG) << endl << "\tcheck the solutions" << endl;
	t.out(T_DEBUG) << "\toriginal\tmatrix*sol" << endl;
	v = myMatrix(getTermUpper(), 1);
	for (k = 0; k < countTerms(); k++) {
		v[k][0] = 0.0;
		for (j = 0; j < countTerms(); j++) {
			v[k][0] += (_matrix[k][j] * _coeff[j][0]);
		}
		t.out(T_DEBUG) << "\t" << _result[k][0] << "\t" << v[k][0]
			<< endl;
	}
	t.out(T_DEBUG) << endl;

	myFreeMatrix(getTermUpper(), u);
	myFreeMatrix(getTermUpper(), v);
#endif	UNIT_TEST

	// NOTE: the following order is important.
	// set the coefficient to every term in the current model
	for (i = 0; i < countTerms(); i++) {
		getFittingTerm(i).coeff(_coeff[i][0]);
		getTestTerm(i).coeff(_coeff[i][0]);
	}

	calStatistics(fittingDepTerm, fittingTSS, testDepTerm, testTSS);
	calSEC();	// standard error of coefficient
	// T statistic should be different on each term
	calTStatis();

	return YES;
}

//////////////////////////////////////////////////////////////////////
// calculate Standard Error of Coefficient by using Normal Equation
// Only fitting data can have SEC not test data.
//////////////////////////////////////////////////////////////////////
void
NeModel::calSEC()
{
	Trace t("NeModel::calSEC()", TRACE_ID);

	int i;
	DataT	stdModelErr;		// variance of model error

	// stdErr is the standard error of residual while SEC is the standard
	// error of coefficient
	stdModelErr = sqrt(fittingStat().MSE());
	t.out(T_INTEREST) << "standard error = " << stdModelErr << endl;

	for (i = 0; i < countTerms(); i++) {
		getFittingTerm(i).SEC(stdModelErr*sqrt(fabs(_invMatrix[i][i])));
	}
}

