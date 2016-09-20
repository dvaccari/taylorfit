#include "SvdModel.h"

const float SvdModel::_TOLERANCE = 1.0e-5;

//	depTerm is the lagged dependent term from fitting data file
SvdModel::SvdModel(const Term& fittingDepTerm, const Term& testDepTerm)
	: Model(fittingDepTerm, testDepTerm)
{
	Trace t("SvdModel::SvdModel()", TRACE_ID);

	int i;

	// the matrix is only needed for fitting data not test data

	_UMatrix	= myMatrix(ndF(), getTermUpper());
	_uMatrix	= myMatrix(ndF(), getTermUpper());
	_vMatrix	= myMatrix(ndF(), getTermUpper());
	_wVector	= (ElemT *) vector(getTermUpper(), sizeof(ElemT));
	_aVector	= (ElemT *) vector(getTermUpper(), sizeof(ElemT));
	_bVector	= (ElemT *) vector(ndF(), sizeof(ElemT));

	for (i = 0; i < ndF(); i++)
		_bVector[i] = fittingDepTerm.getData(i);

	// default value
	_tolerance	= _TOLERANCE;
	_normalized	= YES;
}

SvdModel::~SvdModel()
{
	Trace t("SvdModel::~SvdModel()", TRACE_ID);

	myFreeMatrix(ndF(), _UMatrix);
	myFreeMatrix(ndF(), _uMatrix);
	myFreeMatrix(ndF(), _vMatrix);
	free_vector((char *) _wVector);
	free_vector((char *) _aVector);
	free_vector((char *) _bVector);
}

void
SvdModel::expandMatrix()
{
	Trace t("SvdModel::expandMatrix()", TRACE_ID);

	// overflow, need to allocate more space for a bigger matrix
	int i;
	int newUpper = getTermUpper() + getTermDelta();

	t.out(T_DEBUG) << "newUpper " << newUpper << endl;

	myFreeMatrix(ndF(), _uMatrix);
	myFreeMatrix(ndF(), _vMatrix);
	free_vector((char *) _wVector);
	free_vector((char *) _aVector);

	ElemT	**newMatrix = myMatrix(ndF(), newUpper);

	// copy existing matrices to the newly allocated matrices
	for (i = 0; i < ndF(); i++) {
		// copy one row at a time
		memcpy(newMatrix[i], _UMatrix[i], countTerms() * sizeof(ElemT));
	}

	// delete the old matrix, then activate the new one
	myFreeMatrix(ndF(), _UMatrix);

	_UMatrix = newMatrix;
	_uMatrix = myMatrix(ndF(), newUpper);
	_vMatrix = myMatrix(ndF(), newUpper);

	_wVector = (ElemT *) vector(newUpper, sizeof(ElemT));
	_aVector = (ElemT *) vector(newUpper, sizeof(ElemT));

	// no need to reallocate _bVector, 'cause size not changed, still ndF
}

//	Adding a candidate term from a base Term object
void
SvdModel::addTerm(const Term& fittingTerm,
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
SvdModel::addTerm(const CanTerm& fittingTerm,
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
SvdModel::fixMatrix(const Term& /* fittingDepTerm */)
{
	Trace t("SvdModel::fixMatrix()", TRACE_ID);

	int i;
	int lastIdx = countTerms() - 1;

	DataT	sum, absMean;

	if (_normalized == YES) {
		// normalize data elements of last column
		// CANNOT use Term's fixStatistics() because the number
		// of valid lagged data (nd) might be less than original
		// data count.
		sum = 0.0;
		for (i = 0; i < ndF(); i++) {
			sum += fabs(getFittingTerm(lastIdx).getData(i));
		}

		getFittingTerm(lastIdx).mean(sum / ndF());

	} else {
		getFittingTerm(lastIdx).mean(1);
	}

	absMean = getFittingTerm(lastIdx).mean();
	t.out(T_DEBUG) << "absMean " << absMean << endl;

	for (i = 0; i < ndF(); i++) {
		_UMatrix[i][lastIdx] =
			getFittingTerm(lastIdx).getData(i) / absMean;
	}
}

////////////////////////////////////////////////////////////////////
//	This operation needs to remove the corresponding column
//	of the matrix before removing the term out of model.
////////////////////////////////////////////////////////////////////
void
SvdModel::delTerm(int idx)
{
	int i, j;

	// remove a column
	for (i = 0; i < ndF(); i++) {
		// one row at a time
		for (j = idx; j < countTerms() - 1; j++)
			_UMatrix[i][j] = _UMatrix[i][j+1];

		_UMatrix[i][j] = 0;	// padding
	}

	// CANNOT delete the term from array before the matrices are taken care
	// because the countTerms() will be decremented by 1
	Model::delTerm(idx);
}

/////////////////////////////////////////////////////////////////////////////
//	return NO if the added term cause singular matrix otherwise return YES
//	depTerm and tss are all from fitting data file
/////////////////////////////////////////////////////////////////////////////
BooleanT
SvdModel::fit(const Term& fittingDepTerm,
	DataT fittingTSS,
	const Term& testDepTerm,
	DataT testTSS)
{
	Trace t("SvdModel::fit()", TRACE_ID);

	if (countTerms() > 0) {
		// generate coefficients based on fitting data
		int i, j;

		for (i = 0; i < ndF(); i++)	
			// copy _UMatrix to _uMatrix
			memcpy(_uMatrix[i], _UMatrix[i],
				countTerms() * sizeof(ElemT));

#ifdef	UNIT_TEST
		t.out(T_DEBUG) << "before svdcmp ND " << ndF() << " term "
			<< countTerms() << endl;
		t.out(T_DEBUG) << "uMatrix :" << endl;
		for (i = 0; i < ndF(); i++) {
			for (j = 0; j < countTerms(); j++)
				t.out(T_DEBUG) << _uMatrix[i][j] << " ";

			t.out(T_DEBUG) << endl;
		}
#endif UNIT_TEST
		// initialize
		for (i = 0; i < ndF(); i++)
			for (j = 0; j < countTerms(); j++)
				_vMatrix[i][j] = 0;

		for (j = 0; j < countTerms(); j++)
			_wVector[j] = 0;

		svdcmp(_uMatrix, ndF(), countTerms(), _wVector, _vMatrix);

#ifdef	UNIT_TEST
		t.out(T_DEBUG) << "after svdcmp" << endl;
		t.out(T_DEBUG) << "uMatrix : vMatrix" << endl;
		for (i = 0; i < ndF(); i++) {
			for (j = 0; j < countTerms(); j++)
				t.out(T_DEBUG) << _uMatrix[i][j] << " ";

			t.out(T_DEBUG) << " :  ";
			for (int j = 0; j < countTerms(); j++)
				t.out(T_DEBUG) << _vMatrix[i][j] << " ";

			t.out(T_DEBUG) << endl;
		}

		t.out(T_DEBUG) << "wVector : ";
		for (j = 0; j < countTerms(); j++)
			t.out(T_DEBUG) << _wVector[j] << " ";

		t.out(T_DEBUG) << endl;
#endif UNIT_TEST

		ElemT absW, minW, maxW;
		int zeroWs = 0;
		if (_tolerance < 1) {

			// find max. element of _wVector
			for (maxW = 0, i = 0; i < countTerms(); i++) {
				absW = _wVector[i];
				if (absW > maxW)
					maxW = absW;

				if (i == 0)
					minW = absW;
				else if (absW < minW)
					minW = absW;
			}

			ElemT threshold = _tolerance * maxW;
			t.out(T_DEBUG) << "Threshold = " << threshold << endl;
			for (i = 0; i < countTerms(); i++) {
				absW = _wVector[i];
				if (absW < threshold) {
					_wVector[i] = 0;
					zeroWs++;
				}
			}
#ifdef	UNIT_TEST
			t.out(T_DEBUG) << "before svbksb maxW  = " << maxW
				<< " minW = " << minW << endl;
#endif	UNIT_TEST
		}

		for (i = 0; i < countTerms(); i++)
			_aVector[i] = 0;

		svbksb(_uMatrix, _wVector, _vMatrix, ndF(), countTerms(),
			_bVector, _aVector);

#ifdef	UNIT_TEST
		t.out(T_DEBUG) << "after svbksb " << endl;
		t.out(T_DEBUG) << "uMatrix : vMatrix : bVector" << endl;
		for (i = 0; i < ndF(); i++) {
			for (j = 0; j < countTerms(); j++) {
				t.out(T_DEBUG) << _uMatrix[i][j] << " ";
			}

			t.out(T_DEBUG) << " :  ";
			for (j = 0; j < countTerms(); j++)
				t.out(T_DEBUG) << _vMatrix[i][j] << " ";

			t.out(T_DEBUG) << " :  " << _bVector[i] << endl;
		}

		t.out(T_DEBUG) << "aVector : wVector" << endl;
		for (i = 0; i < countTerms(); i++) {
			t.out(T_DEBUG) << _aVector[i] << " : " << _wVector[i]
				<< endl;
		}
#endif UNIT_TEST

		if (_tolerance < 1) {
			t.out(T_DEBUG) << zeroWs << "\t";

			if (zeroWs == 0 && minW != 0)
				// no w element was set to zero
				t.out(T_DEBUG) << maxW/minW << "\t";
			else
				t.out(T_DEBUG) << 0 << "\t";
		}

		DataT coeff;
		// un-normalize coefficients
		for (i = 0; i < countTerms(); i++) {
			coeff = _aVector[i] / getFittingTerm(i).mean();
			getFittingTerm(i).coeff(coeff);
			getTestTerm(i).coeff(coeff);
		}
	}

	calStatistics(fittingDepTerm, fittingTSS, testDepTerm, testTSS);
	calSEC();	// standard error of coefficient
	// T statistic should be different on each term
	calTStatis();

	return YES;
}

//////////////////////////////////////////////////////////////
//	Calculate SVD covariance. It uses vMatrix and wVector to
//	hold input data and uMatrix for output result.  vMatrix
//	and wVector should have data left from previous SVD
//	calculation. uMatrix will be refilled everytime in SVD().
//////////////////////////////////////////////////////////////
void
SvdModel::covariance(ostream& strm)
{
	if (countTerms() > 0) {
		int i, j;

		svdvar(_vMatrix, countTerms(), _wVector, _uMatrix);

		int precision	= strm.precision();

		strm.setf(ios::scientific, ios::floatfield);
		strm << setprecision(4);

		for (i = 0; i < countTerms(); i++) {
			for (j = 0; j < countTerms(); j++) {
				strm << _uMatrix[i][j] << "  ";
			}
			strm << endl;
		}

		strm.setf(ios::fixed, ios::floatfield);

		// restore precision
		strm.precision(precision);
	}
}

//////////////////////////////////////////////////////////////////////////
// calculate Standard Error of Coefficient by using SVD
// Only fitting can have SEC not test data
//////////////////////////////////////////////////////////////////////////
void
SvdModel::calSEC()
{
	Trace t("SvdModel::calSEC()", TRACE_ID);

	int i, j;
	DataT	sum, sec, stdModelErr;		// standard error of model

	for (i = 0; i < countTerms(); i++) {
		sum = 0;
		for (j = 0; j < countTerms(); j++) {
			if (_wVector[j] != 0)
				sum += pow((_vMatrix[i][j] / _wVector[j]), 2);
		}
		stdModelErr = sqrt(sum * fittingStat().MSE());
		sec = stdModelErr / getFittingTerm(i).mean(); // un-normalize
		getFittingTerm(i).SEC(sec);
	}
}

