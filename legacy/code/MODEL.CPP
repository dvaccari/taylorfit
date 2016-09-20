#include <assert.h>
#include "Model.h"

Model::Model(const Term& fittingDepTerm, const Term& testDepTerm)
{
#ifdef	UNIT_TEST
	Trace t("Model::Model()", TRACE_ID);
#endif	UNIT_TEST
	_pFittingTerms	= new CanTermArrayT(EXT_UPPER, EXT_DELTA);
	_pTestTerms	= new CanTermArrayT(EXT_UPPER, EXT_DELTA);
	_ndF		= fittingDepTerm.countData();
	_ndT		= testDepTerm.countData();
}

Model::~Model()
{
#ifdef	UNIT_TEST
	Trace t("Model::~Model()", TRACE_ID);
#endif	UNIT_TEST
	delete _pFittingTerms;
	delete _pTestTerms;
}

void
Model::addTerm(const CanTerm& fittingTerm,
	const Term& /* fittingDepTerm */,
	const CanTerm& testTerm,
	const Term& /* testDepTerm */)
{
	_pFittingTerms->add(fittingTerm);
	_pTestTerms->add(testTerm);
}

void
Model::delTerm(int idx)
{
	_pFittingTerms->del(idx);
	_pTestTerms->del(idx);
}

BooleanT
Model::isInModel(const Term& fittingTerm) const
{
	int i;

	for (i = 0; i < countTerms(); i++) {
		// only test data & property
		if (fittingTerm == getFittingTerm(i)) {
			return YES;
		}
	}

	return NO;
}

void
Model::calStatistics(const Term& fittingDepTerm,
	DataT fittingTSS,
	const Term& testDepTerm,
	DataT testTSS)
{
	calPreDepTerm();
	calSSE(fittingDepTerm, testDepTerm);
	calSSR(fittingTSS, testTSS);
	calRSquare(fittingTSS, testTSS);
	calMSR();
	calMSE();
	calFStatis();
	calAIC();
	calBIC();
}

const Term&
Model::preFittingDepTerm() const
{
	return _preFittingDepTerm;
}

const Term&
Model::preTestDepTerm() const
{
	return _preTestDepTerm;
}

// calculate the predicted dependent term
void
Model::calPreDepTerm()
{
	Trace t("Model::calPreDepTerm()", TRACE_ID);
	int i, j;
	DataT y_hat, coeff, var;

	_preFittingDepTerm.flush();	// clean up all data
	for (i = 0; i < ndF(); i++) {
		// for each row of data
		y_hat = 0;
		for (j = 0; j < countTerms(); j++) {
			coeff	= getFittingTerm(j).coeff();
			var	= getFittingTerm(j).getData(i);
			y_hat	+= (coeff * var);
		}
		_preFittingDepTerm.addData(y_hat);
	}

	_preTestDepTerm.flush();	// clean up all data
	for (i = 0; i < ndT(); i++) {
		// for each row of data
		y_hat = 0;
		for (j = 0; j < countTerms(); j++) {
			coeff	= getTestTerm(j).coeff();
			var	= getTestTerm(j).getData(i);
			y_hat	+= (coeff * var);
		}
		_preTestDepTerm.addData(y_hat);
	}
}

void
Model::calSSE(const Term& fittingDepTerm, const Term& testDepTerm)
{
	Trace t("Model::calSSE()", TRACE_ID);

	int i;
	DataT sse, var, predict;

	// fitting data
	sse = 0;
	for (i = 0; i < ndF(); i++) {
		var	= fittingDepTerm.getData(i);
		predict	= _preFittingDepTerm.getData(i);
		sse += pow((var - predict), 2);
	}

	t.out(T_INTEREST) << "fitting SSE [" << sse << "]" << endl;
	_fittingStat.SSE(sse);

	// test data
	sse = 0;
	for (i = 0; i < ndT(); i++) {
		var	= testDepTerm.getData(i);
		predict	= _preTestDepTerm.getData(i);
		sse += pow((var - predict), 2);
	}

	t.out(T_INTEREST) << "test SSE [" << sse << "]" << endl;
	_testStat.SSE(sse);
}

void
Model::calSSR(DataT fittingTSS, DataT testTSS)
{
	Trace t("Model::calSSR()", TRACE_ID);

	_fittingStat.SSR(fittingTSS - _fittingStat.SSE());
	_testStat.SSR(testTSS - _testStat.SSE());

	t.out(T_INTEREST) << "\tfitting SSR [" << _fittingStat.SSR() << "]"
		<< endl;
	t.out(T_INTEREST) << "\ttest SSR [" << _testStat.SSR() << "]" << endl;
}

void
Model::calRSquare(DataT fittingTSS, DataT testTSS)
{
	Trace t("Model::calRSquare()", TRACE_ID);

	_fittingStat.RSquare(_fittingStat.SSR() / fittingTSS);
	_testStat.RSquare(_testStat.SSR() / testTSS);

	t.out(T_INTEREST) << "\tfitting R Square [" << _fittingStat.RSquare()
		<< "]" << endl;
	t.out(T_INTEREST) << "\ttest R Square [" << _testStat.RSquare()
		<< "]" << endl;
}

void
Model::calMSR()
{
	Trace t("Model::calMSR()", TRACE_ID);

	if (countTerms() == 0) {
		_fittingStat.MSR(_fittingStat.SSR());
		_testStat.MSR(_testStat.SSR());
	} else {
		// MSR = SSR / np
		_fittingStat.MSR(_fittingStat.SSR() / countTerms());
		_testStat.MSR(_testStat.SSR() / countTerms());
	}

	t.out(T_INTEREST) << "\tfitting MSR [" << _fittingStat.MSR() << "]"
		<< endl;
	t.out(T_INTEREST) << "\ttest MSR [" << _testStat.MSR() << "]" << endl;
}

void
Model::calMSE()
{
	Trace t("Model::calMSE()", TRACE_ID);

	int np;
	np = countTerms();

	if (_ndF <= np) {
		cerr << "Error: Variance of Error has wrong denominator"
			<< " ndF = " << _ndF << " np = " << np << endl;
	}
	assert(_ndF > np);

	// MSE = SSE / n-p
	_fittingStat.MSE(_fittingStat.SSE() / (_ndF - np));
	_testStat.MSE(_testStat.SSE() / (_ndT - np));

	t.out(T_INTEREST) << "\tfitting MSE [" << _fittingStat.MSE() << "]"
		<< endl;
	t.out(T_INTEREST) << "\ttest MSE [" << _testStat.MSE() << "]" << endl;
}

void
Model::calFStatis()
{
	Trace t("Model::calFStatis()", TRACE_ID);

	_fittingStat.FStatis(_fittingStat.MSR() / _fittingStat.MSE());
	_testStat.FStatis(_testStat.MSR() / _testStat.MSE());

	t.out(T_INTEREST) << "\tfitting FStatis [" << _fittingStat.FStatis()
		<< "]" << endl;
	t.out(T_INTEREST) << "\ttest FStatis [" << _testStat.FStatis()
		<< "]" << endl;
}

//////////////////////////////////////////////////////////////////////////
//	Can only have fitting data not test data
//////////////////////////////////////////////////////////////////////////
void
Model::calTStatis()
{
	Trace t("Model::calTStatis()", TRACE_ID);

	int i;
	DataT coeff, sec;

	for (i = 0; i < countTerms(); i++) {
		// fitting data
		if (getFittingTerm(i).SEC() != 0) {
			coeff	= getFittingTerm(i).coeff();
			sec	= getFittingTerm(i).SEC();
			getFittingTerm(i).TStatis(coeff/sec);
		} else {
			getFittingTerm(i).TStatis(0);
		}

		t.out(T_DEBUG) << i << "fitting: coeff["
			<< getFittingTerm(i).coeff()
			<< "] standard error of coeff["
			<< getFittingTerm(i).SEC() << "] tStatis["
			<< getFittingTerm(i).TStatis() << "]" << endl;
	}
}

void
Model::calAIC()
{
	Trace t("Model::calAIC()", TRACE_ID);

	DataT aic;

	aic = log10(_fittingStat.MSE()) + (2.0 * (DataT)countTerms() / _ndF);
	_fittingStat.AIC(aic);

	aic = log10(_testStat.MSE()) + (2.0 * (DataT)countTerms() / _ndT);
	_testStat.AIC(aic);

	t.out(T_DEBUG) << "fitting: MSE " << _fittingStat.MSE()
		<< " log of MSE " << log10(_fittingStat.MSE()) << " p "
		<< countTerms() << " n " << _ndF << " AIC "
		<< _fittingStat.AIC() << endl;
	t.out(T_DEBUG) << "test: MSE " << _testStat.MSE()
		<< " log of MSE " << log10(_testStat.MSE()) << " p "
		<< countTerms() << " n " << _ndT << " AIC "
		<< _testStat.AIC() << endl;
}

void
Model::calBIC()
{
	DataT bic;

	bic = log10(_fittingStat.MSE()) + log10(_ndF)*(DataT)countTerms()/_ndF;
	_fittingStat.BIC(bic);

	bic = log10(_testStat.MSE()) + log10(_ndT)*(DataT)countTerms()/_ndT;
	_testStat.BIC(bic);
}

#ifdef	NOTDEF
///////////////////////////////////////////////////////////////////////////
//	Only T-Statistic and coefficient should come from fitting data,
//	rest will come from test data.
///////////////////////////////////////////////////////////////////////////
void
Model::printOn(ostream& strm)
{
	int idx;
	int width	= strm.width();
	int precision	= strm.precision();

	strm << "\t******************* IN MODEL **********************" << endl;
	strm << setw(7) << "T Stat" << setw(12) << "Coeff" << setw(10)
		<< "SSE" << setw(10) << "MSE" << setw(8) << "F Stat"
		<< setw(10) << "AIC" << setw(10) << "BIC" << setw(10)
		<< "sR^2" << endl;
	strm << "_____________________________________________________" << endl;

	for (idx = 0; idx < countTerms(); idx++) {
		strm << "(" << (idx + 1) << ")";
		getFittingTerm(idx).printProperty(strm);
		strm << setw(7)  << setprecision(2)
			<< getFittingTerm(idx).TStatis();
		strm.setf(ios::scientific, ios::floatfield);
		strm << setw(12) << setprecision(4)
			<< getFittingTerm(idx).coeff() << endl;
	}
	strm << "\t===================================================" << endl;
	strm << "  " << setw(5) << "DF" << setw(10) << "SSE" << setw(10)
		<< "MSE" << setw(10) << "R^2" << setw(8) << "F Stat"
		<< setw(10) << "AIC" << setw(10) << "BIC" << endl;
	strm << "  "
		<< setw(5)  << (_nd - countTerms())
		<< setw(10) << setprecision(3) << _statis.SSE()
		<< setw(10) << setprecision(3) << _statis.MSE()
		<< setw(10) << setprecision(3) << _statis.RSquare()
		<< setw(8)  << setprecision(1) << _statis.FStatis()
		<< setw(10) << setprecision(3) << _statis.AIC()
		<< setw(10) << setprecision(3) << _statis.BIC()
		<< endl;

	// restore width and precision
	strm.width(width);
	strm.precision(precision);
}
#endif
