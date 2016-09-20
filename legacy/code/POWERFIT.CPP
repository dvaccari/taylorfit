#include <string.h>
#include <ctype.h>
#include <math.h>
#include <stdlib.h>
#ifdef	PC
#	include <strstrea.h>
// #	include <dos.h>
#else
#	include <strstream.h>
#endif	PC
#include "PowerFit.h"

const DataT	MIN_ADD_T_STATIS	= 1.96;
const DataT	MIN_DEL_T_STATIS	= 1.645;

PowerFit::PowerFit()
{
	Trace t("PowerFit::PowerFit()", TRACE_ID);

	_pModel		= (Model *) 0;
	_pFittingTerms	= new TermArrayT(EXT_UPPER, EXT_DELTA);
	_pTestTerms	= new TermArrayT(EXT_UPPER, EXT_DELTA);
	_pBufTerms	= new TermArrayT(EXT_UPPER, EXT_DELTA);
	_pExponents	= new ExpArrayT(EXT_UPPER, EXT_DELTA);
	_pMultipliers	= new MultiArrayT(EXT_UPPER, EXT_DELTA);
	_pLags		= new LagArrayT(EXT_UPPER, EXT_DELTA);
	_pInFittingCanTerms	= new CanTermArrayT(FIX_UPPER, 0);
	_pInTestCanTerms	= new CanTermArrayT(FIX_UPPER, 0);

	// default values
	reset();
}

PowerFit::~PowerFit()
{
	delete _pModel;
	delete _pFittingTerms;
	delete _pTestTerms;
	delete _pBufTerms;
	delete _pExponents;
	delete _pMultipliers;
	delete _pLags;
	delete _pInFittingCanTerms;
	delete _pInTestCanTerms;
}

////////////////////////////////////////////////////////////////////
//	Allocate a new model
////////////////////////////////////////////////////////////////////
void
PowerFit::newModel()
{
	deleteModel();

	if (_modelType == NORMAL_EQ) {
	    _pModel = new NeModel(_laggedFittingDepTerm, _laggedTestDepTerm);
	} else {	// default
	    _pModel = new SvdModel(_laggedFittingDepTerm, _laggedTestDepTerm);
	}
}

void
PowerFit::deleteModel()
{
	delete _pModel;
	_pModel = (Model *) 0;
}

void
PowerFit::dumpModelTerms()
{
	int i;

	flushBufTerms();

	for (i = 0; i < countModelTerms(); i++) {
		addBufTerm(getFittingModelTerm(i));
	}
}

//////////////////////////////////////////////////
//	Reset the object to pre-defined default values
//////////////////////////////////////////////////
void
PowerFit::reset()
{
	deleteModel();

	flushTerms();

	flushExps();
	addExp(1);

	flushMultis();
	addMulti(1);

	flushLags();
	addLag(0);

	_remodel		= NO;
	_laggedDepPartOfIndep	= NO;
	_depVarCol		= 1;		// 0 is constant term
	_mode			= MANUAL;
	_modelType		= SVD;
	_criteria		= BEST_T_STAT;
}

void
PowerFit::init()
{
	int i;

	for (i = 0; i < countFittingTerms(); i++) {
		getFittingTerm(i).fixStatistics();
	}

	for (i = 0; i < countTestTerms(); i++) {
		getTestTerm(i).fixStatistics();
	}

	setLaggedDepTerm();
	calTSS();
	newModel();
}

void
PowerFit::remodel()
{
	dumpModelTerms();	// dump to BufTerms
	setLaggedDepTerm();	// because lags array may be changed
	calTSS();
	newModel();

	quickFit();
}

/////////////////////////////////////////////////////////////////////////
//	Adding data into fittingTerms from data file one line at a time
/////////////////////////////////////////////////////////////////////////
BooleanT
PowerFit::readFittingData(const char *pData)
{
	char buf[BUF_SIZE];		// line buffer
	DataT data;
	int colNum = 0;

	strcpy(buf, pData);
	strcat(buf, "\n");		// append a newline char

	istrstream instr(buf, strlen(buf));
	Property prop;

	if (countFittingTerms() == 0) {
		// this is the first row data, need to set up some
		// initialization.

		// const term has 0, 0, 0 prop
		Term term;

		term.addProperty(prop);
		term.addData(1);
		addFittingTerm(term);

		// input data starts from colNum = 1
		prop.exp(1);
		while (instr >> data) {
			// one column at a time
			colNum++;
			term.flush();		// ready to re-use

			prop.col(colNum);
			term.addProperty(prop);
			term.addData(data);

			addFittingTerm(term);
		}
	} else {
		getFittingTerm(0).addData(1);	// constant term

		while (instr >> data) {
			colNum++;
			getFittingTerm(colNum).addData(data);
		}
	}

	if (_pModel != 0 && _pModel->countTerms() != 0) {
		// currently there are some terms in the model, need to dump
		// them to bufTerms
		dumpModelTerms();
	}

	return YES;
}

/////////////////////////////////////////////////////////////////////////
//	Adding data into testTerms from test file one line at a time
/////////////////////////////////////////////////////////////////////////
BooleanT
PowerFit::readTestData(const char *pData)
{
	char buf[BUF_SIZE];		// line buffer
	DataT data;
	int colNum = 0;

	strcpy(buf, pData);
	strcat(buf, "\n");		// append a newline char

	istrstream instr(buf, strlen(buf));
	Property prop;

	if (countTestTerms() == 0) {
		// this is the first row data, need to set up some
		// initialization.
		// DO NOT need to deal with constant terms

		// const term has 0, 0, 0 prop
		Term term;

		term.addProperty(prop);
		term.addData(1);
		addTestTerm(term);

		// input data starts from colNum = 1
		prop.exp(1);
		while (instr >> data) {
			// one column at a time
			colNum++;
			term.flush();		// ready to re-use

			prop.col(colNum);
			term.addProperty(prop);
			term.addData(data);

			addTestTerm(term);
		}
	} else {
		getTestTerm(0).addData(1);	// constant term

		while (instr >> data) {
			colNum++;
			getTestTerm(colNum).addData(data);
		}
	}

	if (_pModel != 0 && _pModel->countTerms() != 0) {
		// currently there are some terms in the model, need to dump
		// them to bufTerms
		dumpModelTerms();
	}

	return YES;
}

void
PowerFit::calTSS()
{
	Trace t("PowerFit::calTSS()", TRACE_ID);

	int i;
	DataT	yBar;

	// fitting data
	yBar		= _laggedFittingDepTerm.mean();
	_fittingTSS	= 0.0;

	for (i = 0; i < _laggedFittingDepTerm.countData(); i++) {
		_fittingTSS += pow(_laggedFittingDepTerm.getData(i) - yBar, 2);
	}

	t.out(T_INTEREST) << "PowerFit's fitting TSS [" << _fittingTSS << "]"
		<< endl;

	// test data
	yBar		= _laggedTestDepTerm.mean();
	_testTSS	= 0.0;

	for (i = 0; i < _laggedTestDepTerm.countData(); i++) {
		_testTSS += pow(_laggedTestDepTerm.getData(i) - yBar, 2);
	}

	t.out(T_INTEREST) << "PowerFit's test TSS [" << _testTSS << "]"
		<< endl;
}

////////////////////////////////////////////////////////////////////////
//	Read exponents from char string.
//	This will destroy previous exponents array.
////////////////////////////////////////////////////////////////////////
void
PowerFit::readExps(const char *exps)
{
	Trace t("PowerFit::readExps()", TRACE_ID);
	t.out(T_DEBUG) << exps << endl;

	char buf[BUF_SIZE];
	ExpT exp;

	strcpy(buf, exps);
	strcat(buf, "\n");	// append a newline char
	istrstream instr(buf, strlen(buf));

	flushExps();
	while (instr >> exp) {
		addExp(exp);
	}

	if (countExps() == 0) {
		// add default exponent value
		addExp(1);
	}

#ifdef	UNIT_TEST
	int i;
	for (i = 0; i < countExps(); i++) {
		t.out(T_DEBUG) << getExp(i) << "\t";
	}
	t.out(T_DEBUG) << endl;
#endif	UNIT_TEST
}

//////////////////////////////////////////////////////////////////
//	Adding and sorting in one fell swoop
//////////////////////////////////////////////////////////////////
void
PowerFit::addExp(ExpT exp)
{
	if (exp == 0)
		return;			// not accept 0 power

	// avoid the duplicate
	int i;

	for (i = 0; i < countExps(); i++) {
		if (exp == getExp(i)) {
			return;		// duplicated exponent
		} else if (exp < getExp(i)) {
			break;
		}
	}

	if (i == countExps()) {
		_pExponents->add(exp);	// appending
	} else {
		_pExponents->insertBefore(i, exp);
	}
}

void
PowerFit::delExp(ExpT exp)
{
	int i;

	for (i = 0; i < countExps(); i++) {
		if (exp == getExp(i)) {
			break;
		}
	}

	if (i == countExps()) {
		return;		// not found
	}

	_pExponents->del(i);	// remove it from array
}

//////////////////////////////////////////////////////////
//	Read all the multipliers from one char string
//////////////////////////////////////////////////////////
void
PowerFit::readMultis(const char *multis)
{
	Trace t("PowerFit::readMultis()", TRACE_ID);
	t.out(T_DEBUG) << multis << endl;

	char buf[BUF_SIZE];
	MultiT multi;

	strcpy(buf, multis);
	strcat(buf, "\n");
	istrstream instr(buf, strlen(buf));

	flushMultis();
	while (instr >> multi) {
		addMulti(multi);
	}

	if (countMultis() == 0) {
		// add default multiplier value
		addMulti(1);
	}

#ifdef	UNIT_TEST
	int i;
	for (i = 0; i < countMultis(); i++) {
		t.out(T_DEBUG) << getMulti(i) << "\t";
	}
	t.out(T_DEBUG) << endl;
#endif	UNIT_TEST
}

////////////////////////////////////////////////////////////
//	Adding and sorting in one fell swoop
////////////////////////////////////////////////////////////
void
PowerFit::addMulti(MultiT multi)
{
	if (multi < 0) {	// does not allow negative value
		return;		// 0 is for constant term
	}

	// avoid the duplicate
	int i;

	for (i = 0; i < countMultis(); i++) {
		if (multi == getMulti(i)) {
			return;		// duplicated multiplier
		} else if (multi < getMulti(i)) {
			break;
		}
	}

	if (i == countMultis()) {
		_pMultipliers->add(multi);	// appending
	} else {
		_pMultipliers->insertBefore(i, multi);
	}

}

void
PowerFit::delMulti(MultiT multi)
{
	int i;

	for (i = 0; i < countMultis(); i++) {
		if (multi == getMulti(i)) {
			break;
		}
	}

	if (i == countMultis()) {
		return;		// not found
	}

	_pMultipliers->del(i);	// remove it from array
}

//////////////////////////////////////////////////////////
//	Read all the lags from one char string
//////////////////////////////////////////////////////////
void
PowerFit::readLags(const char *lags)
{
	Trace t("PowerFit::readLags()", TRACE_ID);
	t.out(T_DEBUG) << lags << endl;

	char buf[BUF_SIZE];
	LagT lag;

	strcpy(buf, lags);
	strcat(buf, "\n");
	istrstream instr(buf, strlen(buf));

	flushLags();
	while (instr >> lag) {
		addLag(lag);
	}

	if (countLags() == 0) {
		// add default lag value
		addLag(0);
	}

	_remodel = YES;

#ifdef	UNIT_TEST
	int i;
	for (i = 0; i < countLags(); i++) {
		t.out(T_DEBUG) << getLag(i) << "\t";
	}
	t.out(T_DEBUG) << endl;
#endif	UNIT_TEST
}

////////////////////////////////////////////////////////////
//	Adding and sorting in one fell swoop
////////////////////////////////////////////////////////////
void
PowerFit::addLag(LagT lag)
{
	if (lag < 0) {	// does not allow negative value
		return;		// 0 is for constant term
	}

	// avoid the duplicate
	int i;

	for (i = 0; i < countLags(); i++) {
		if (lag == getLag(i)) {
			return;		// duplicated lag
		} else if (lag < getLag(i)) {
			break;
		}
	}

	if (i == countLags()) {
		_pLags->add(lag);	// appending
	} else {
		_pLags->insertBefore(i, lag);
	}

}

void
PowerFit::delLag(LagT lag)
{
	int i;

	for (i = 0; i < countLags(); i++) {
		if (lag == getLag(i)) {
			break;
		}
	}

	if (i == countLags()) {
		return;		// not found
	}

	_pLags->del(i);	// remove it from array
}

///////////////////////////////////////////////////////////////////////////
//	To calculate the total number of possible arrangements excluding
//	the original dependant term.  The formula is:
//		S[n]
//		--	  
//		\		 m		 s
//		/		C	*	E
//		--		 s
//		s = S[1]
//	where m: max. allowed number of multipliers in a term
//	      E: number of count of exponents
//	      S(i): array of multiplier numbers (S[n] has to be <= m)
///////////////////////////////////////////////////////////////////////////
void
PowerFit::calTotalMultiTerms()
{
	Trace t("PowerFit::calTotalMultiTerms()", TRACE_ID);

	long	power, newTotal;
	int	i, indepTermNum;

	if (_laggedDepPartOfIndep == YES) {
	    if (getLag(0) == 0) {
		// lag value 0 is included
		// The possible multiplier term for Y, X, and
		// Z with lags 0 and 2 is Y(2)XX(2)ZZ(2),
		// which has 3*2-1 constituents. Because Y(0)
		// is not allowed to appear as part of a
		// multiplier term
		// NOTE: exclude constant term
		indepTermNum = (countFittingTerms() - 1) * countLags() - 1;
	    } else {
		indepTermNum = (countFittingTerms() - 1) * countLags();
	    }
	} else {
		// excluding depTerm and constant term
		indepTermNum = (countFittingTerms() - 2) * countLags();
	}

	// find the real max allowed multiplier number
	_maxAllowedMulti =
		MIN(indepTermNum, (int)getMulti(countMultis() - 1));

	_totalMultiTerms = 1;		// constant term
	for (i = 0; i < countMultis(); i++) {
		if (getMulti(i) > _maxAllowedMulti) {
			break;
		}

		power = pow(countExps(), getMulti(i));
		newTotal = power * combination(indepTermNum, getMulti(i));

		_totalMultiTerms += newTotal;

		t.out(T_DEBUG) << "totalMultiTerm = " << _totalMultiTerms
			<< " power = " << power << " newTotal = " << newTotal
			<< endl;
	}
}

int
PowerFit::combination(int upper, int lower)
{
	Trace t("PowerFit::combination()", TRACE_ID);

	if (upper < lower) {
		cerr << "Illegal multiplier number " << lower << endl;
		abort();
	}

	long numerator = 1;
	long denominator = 1;
	long i;
	for (i = (long)upper; i > (long)(upper - lower); i--)
		numerator *= i;

	for (i = (long)lower; i > 1; i--)
		denominator *= i;

	t.out(T_DEBUG) << "upper = " << upper << " lower = " << lower
		<< " reslut = " << numerator/denominator << endl;

	return (int)(numerator/denominator);
}

////////////////////////////////////////////////////////////////////////
//	This is based on fitting data
////////////////////////////////////////////////////////////////////////
DataT
PowerFit::addCriteria()
{
	DataT result;
	int degFreedom;

	degFreedom = _laggedFittingDepTerm.countData() - _pModel->countTerms()
		+ 1;

	result = MIN_ADD_T_STATIS
		+ 2.3716/degFreedom
		+ 2.83577/pow(degFreedom, 2)
		+ 2.55808/pow(degFreedom, 3)
		+ 1.1314/pow(degFreedom, 4)
		+ 1.84915/pow(degFreedom, 5);

	return result;
}

BooleanT
PowerFit::autoAddInCanTermToModel()
{
	BooleanT retCode = NO;

	if (countInCanTerms() == 0) {
		// could not find any candidate terms
		return retCode;
	}

	DataT absTStatis = fabs(getInFittingCanTerm(0).TStatis());

	switch (_criteria) {
	case BEST_T_STAT:
		// This criteria has nothing do to with current terms in
		// the model
		if (absTStatis >= addCriteria()) {
			_pModel->addTerm(getInFittingCanTerm(0),
				_laggedFittingDepTerm, getInTestCanTerm(0),
				_laggedTestDepTerm);
			retCode = YES;
		}
		break;
	case MAX_F_STAT:
		// only add the new term if that will improve the criteria
		if (_pModel->countTerms() == 0
		|| fabs(getInTestCanTerm(0).modelStat().FStatis())
		> fabs(_pModel->testStat().FStatis())) {
			_pModel->addTerm(getInFittingCanTerm(0),
				_laggedFittingDepTerm, getInTestCanTerm(0),
				_laggedTestDepTerm);
			retCode = YES;
		}
		break;
	case MIN_MSE:
		// only add the new term if that will improve the criteria
		if (_pModel->countTerms() == 0
		|| fabs(getInTestCanTerm(0).modelStat().MSE())
		< fabs(_pModel->testStat().MSE())) {
			_pModel->addTerm(getInFittingCanTerm(0),
				_laggedFittingDepTerm, getInTestCanTerm(0),
				_laggedTestDepTerm);
			retCode = YES;
		}
		break;
	case T_AND_MSE:
		if (absTStatis >= addCriteria()) {
			// only add the new term if that will improve the
			// criteria
			if (_pModel->countTerms() == 0
			|| fabs(getInTestCanTerm(0).modelStat().MSE())
			< fabs(_pModel->testStat().MSE())) {
			    _pModel->addTerm(getInFittingCanTerm(0),
				_laggedFittingDepTerm, getInTestCanTerm(0),
				_laggedTestDepTerm);
			    retCode = YES;
			}
		}
		break;
	case T_AND_F:
		if (absTStatis >= addCriteria()) {
			// only add the new term if that will improve the
			// criteria
			if (_pModel->countTerms() == 0
			|| fabs(getInTestCanTerm(0).modelStat().FStatis())
			> fabs(_pModel->testStat().FStatis())) {
			    _pModel->addTerm(getInFittingCanTerm(0),
				_laggedFittingDepTerm, getInTestCanTerm(0),
				_laggedTestDepTerm);
			    retCode = YES;
			}
		}
		break;
	case MIN_AIC:
		// only add the new term if that will improve the criteria
		if (_pModel->countTerms() == 0
		|| fabs(getInTestCanTerm(0).modelStat().AIC())
		< fabs(_pModel->testStat().AIC())) {
			_pModel->addTerm(getInFittingCanTerm(0),
				_laggedFittingDepTerm, getInTestCanTerm(0),
				_laggedTestDepTerm);
			retCode = YES;
		}
		break;
	case MIN_BIC:
		// only add the new term if that will improve the criteria
		if (_pModel->countTerms() == 0
		|| fabs(getInTestCanTerm(0).modelStat().BIC())
		< fabs(_pModel->testStat().BIC())) {
			_pModel->addTerm(getInFittingCanTerm(0),
				_laggedFittingDepTerm, getInTestCanTerm(0),
				_laggedTestDepTerm);
			retCode = YES;
		}
		break;
	}	// switch

	return retCode;
}

///////////////////////////////////////////////////////////////////////
//	Automatically delete one term from model provided deleting that
//	term will improve the model's performance based on the selected
//	criteria.
//	Return YES if there was one term deleted otherwise return NO.
///////////////////////////////////////////////////////////////////////
BooleanT
PowerFit::autoDelModelTerm()
{
    Trace t("PowerFit::autoDelModelTerm()", TRACE_ID);

    int totalTerm	= _pModel->countTerms();
    int worstIdx	= -1;
    BooleanT retCode	= NO;
    int i;
    DataT	absTStatis;
    DataT	worstTStatis;
    DataT	newMSE;
    DataT	newFStat;
    DataT	bestFStat;
    DataT	worstMSE;
    DataT	worstAIC;
    DataT	worstBIC;

    switch (_criteria) {
    case BEST_T_STAT:
    case T_AND_MSE:
    case T_AND_F:
        // looking for the worst T statistic and the value has to be
        // less than MIN_DEL_T_STATIS
        worstTStatis = 0;
        for (i = 0; i < totalTerm; i++) {
            absTStatis = fabs((_pModel->getFittingTerm(i)).TStatis());
            if (absTStatis < MIN_DEL_T_STATIS) {
                if (worstIdx == -1 || absTStatis < worstTStatis) {
                    worstTStatis    = absTStatis;
                    worstIdx        = i;
                }
            }
        }

        switch (_criteria) {
        case BEST_T_STAT:
            if (worstIdx != -1) {
                _pModel->delTerm(worstIdx);
                retCode = YES;
            }
            break;
        case T_AND_MSE:
            if (worstIdx != -1) {
                // do not delete it if that is the only term in model
                if (totalTerm > 1) {
                    // remove the worstIdx term only if it helps to lower the
                    // MSE of the new model (without that term in model)
                    newMSE = _pModel->getTestTerm(worstIdx).modelStat().MSE();
                    if (fabs(newMSE) < fabs(_pModel->testStat().MSE())) {
                        _pModel->delTerm(worstIdx);
                        retCode = YES;
                    }
                }
            }
            break;
        case T_AND_F:
            if (worstIdx != -1) {
                // do not delete it if that is the only term in model
                if (totalTerm > 1) {
                    // remove the worstIdx term only if it helps to increase the
                    // F statistic of the new model (without that term in model)
                    newFStat = _pModel->getTestTerm(worstIdx).modelStat().FStatis();
                    if (fabs(newFStat) > fabs(_pModel->testStat().FStatis())) {
                        _pModel->delTerm(worstIdx);
                        retCode = YES;
                    }
                }
            }
            break;
        }	// second switch

        break;
    case MAX_F_STAT:
        // Delete the term that will help to increase the F Statistc most.
        // Ignore this if there is only one term in the model.
        if (totalTerm > 1) {
            bestFStat = fabs(_pModel->testStat().FStatis());
            for (i = 0; i < totalTerm; i++) {
                if (fabs(_pModel->getTestTerm(i).modelStat().FStatis())
                > bestFStat) {
                    worstIdx = i;
                }
            }

            if (worstIdx != -1) {
                _pModel->delTerm(worstIdx);
                retCode = YES;
            }
        }

        break;
    case MIN_MSE:
        // Delete the term that will help to decrease the MSE most.
        // Ignore this if there is only one term in the model.
        if (totalTerm > 1) {
            worstMSE = fabs(_pModel->testStat().MSE());
            for (i = 0; i < totalTerm; i++) {
                if (fabs(_pModel->getTestTerm(i).modelStat().MSE()) <worstMSE) {
                    worstIdx = i;
                }
            }

            if (worstIdx != -1) {
                _pModel->delTerm(worstIdx);
                retCode = YES;
            }
        }

        break;
    case MIN_AIC:
        // Delete the term that will help to decrease the AIC most.
        // Ignore this if there is only one term in the model.
        if (totalTerm > 1) {
            worstAIC = _pModel->testStat().AIC();
            for (i = 0; i < totalTerm; i++) {
                if (_pModel->getTestTerm(i).modelStat().AIC() < worstAIC) {
                    worstIdx = i;
                }
            }

            if (worstIdx != -1) {
                _pModel->delTerm(worstIdx);
                retCode = YES;
            }
        }

        break;
    case MIN_BIC:
        // Delete the term that will help to decrease the BIC most.
        // Ignore this if there is only one term in the model.
        if (totalTerm > 1) {
            worstBIC = _pModel->testStat().BIC();
            for (i = 0; i < totalTerm; i++) {
                if (_pModel->getTestTerm(i).modelStat().BIC() < worstBIC) {
                    worstIdx = i;
                }
            }

            if (worstIdx != -1) {
                _pModel->delTerm(worstIdx);
                retCode = YES;
            }
        }

        break;
    }	// outer switch

        return retCode;
}

////////////////////////////////////////////////////////////////////////////
//	Fitting model by calling appropriate class operation
////////////////////////////////////////////////////////////////////////////
int
PowerFit::fit()
{
    Trace t("PowerFit::fit()", TRACE_ID);

    if (_remodel == YES) {
	remodel();
    }

    // It's possible exponents, lags, and multipliers changed every time
    calTotalMultiTerms();
#ifndef	WINDOWS		// for ASCII type of display
    cout << "Total Number of Candidate Terms: " << _totalMultiTerms << endl;
#endif	WINDOWS

    flushInCanTerms();

    // the total number of terms in the model has to be smaller than
    // the number of data set in each term. (i.e. Np < Nd - 1).
    // Because if Np = Nd - 1, after adding one more term to the model,
    // it will make Np = Nd and causes calMSE having divided by 0 problem.
    int num = 0;

    if (_pModel->countTerms() < (_pModel->ndF() - 1)
    || _pModel->countTerms() < (_pModel->ndT() - 1)) {
	int termIdx, lagIdx, expIdx, multiIdx;

	// start form constant term
	multiGen(getFittingTerm(0), getTestTerm(0), 0, 0, 1, 1, &num);

	// start from 1
	for (termIdx = 1; termIdx < countFittingTerms(); termIdx++) {
	    if (termIdx == _depVarCol && _laggedDepPartOfIndep == NO) {
		// dependent term is not allowed to be part of
		// multipliered independent term
		continue;
	    }

	    for (lagIdx = 0; lagIdx < countLags(); lagIdx++) {
		if (termIdx == _depVarCol
		&& _laggedDepPartOfIndep == YES
		&& getLag(lagIdx) == 0) {
		    // excluding the original fitting
		    // dependant (Y) term because that
		    // term is not allowed to be part of
		    // multipliered independant term
		    continue;
		}

		for (expIdx=0; expIdx < countExps(); expIdx++) {
		    // fitting data
		    Term initFittingTerm = getFittingTerm(termIdx);

		    initFittingTerm.lagging(getLag(lagIdx), maxLag());
		    initFittingTerm.power(getExp(expIdx));

		    if (initFittingTerm.status() == INVALID) {
			continue;	// invalid term
		    }

		    // test data
		    Term initTestTerm = getTestTerm(termIdx);

		    initTestTerm.lagging(getLag(lagIdx), maxLag());
		    initTestTerm.power(getExp(expIdx));

		    if (initTestTerm.status() == INVALID) {
			continue;	// invalid term
		    }

		    for (multiIdx = 0; multiIdx < countMultis(); multiIdx++) {
			if (getMulti(multiIdx) > _maxAllowedMulti) {
			    // invalid multiplier #
			    break;
			}

			multiGen(initFittingTerm, initTestTerm, termIdx, lagIdx,
			    getMulti(multiIdx), 1, &num);
		    }	// multiIdx
		}   // expIdx
	    }	// lagIdx
	}   // termIdx

	if (_pModel->countTerms() > 0) {
	    // need to restore the original model info
	    _pModel->fit(_laggedFittingDepTerm, _fittingTSS,
		_laggedTestDepTerm, _testTSS);
	}

	return 0;
    } else {
#ifdef	UNIT_TEST
	cout << endl << "\t######  W A R N I N G  #####" << endl
	    << "\tCannot add any more term into model" << endl << endl;
#endif	UNIT_TEST
	return -1;
    }
}

void
PowerFit::multiGen(const Term& currFittingTerm,
	const Term& currTestTerm,
	int currTermIdx,
	int currLagIdx,
	int targetMultiNum,
	int currMultiNum,
	int *pNum)
{
    Trace t("PowerFit::multiGen()", TRACE_ID);
    BooleanT ret;

    if (currMultiNum == targetMultiNum) {
#ifndef	WINDOWS
	cout << ++(*pNum) << "      \r";
#else
	// should update the progress indicator (gague) dialog box
	;
#endif	WINDOWS
	// normalize the currTerm and plug into function to find
	// T statistics
	currFittingTerm.printProperty(t.out(T_DEBUG));
	t.out(T_DEBUG) << endl;

	if (_pModel->isInModel(currFittingTerm) == YES) {
	    t.out(T_DEBUG) << "already in model" << endl;
	    return;
	}

	// temporarily add the current term into the model and
	// find out how that term affects to the model.
	_pModel->addTerm(currFittingTerm, _laggedFittingDepTerm, currTestTerm,
		_laggedTestDepTerm);
	ret = _pModel->fit(_laggedFittingDepTerm, _fittingTSS,
		_laggedTestDepTerm, _testTSS);

	if (ret == YES) {
	    // Non-singular matrix
	    int lastIdx = _pModel->countTerms() - 1;

	    _pModel->getFittingTerm(lastIdx).modelStat(_pModel->fittingStat());

	    _pModel->getTestTerm(lastIdx).modelStat(_pModel->testStat());

	    addInCanTerms(_pModel->getFittingTerm(lastIdx),
		_pModel->getTestTerm(lastIdx));

	    _pModel->delTerm(lastIdx);	// remove from pModel
	}
	return;
    }

    int termIdx, lagIdx, expIdx;
    int nextLagIdx;
    for (termIdx = currTermIdx; termIdx < countFittingTerms(); termIdx++) {
	if (termIdx == _depVarCol && _laggedDepPartOfIndep == NO) {
	    // dependent term is not allowed to be part of
	    // multipliered independent term
	    continue;
	}

	if (termIdx == currTermIdx) {
	    // with same independant term but next lag
	    nextLagIdx = currLagIdx + 1;
	} else {
	    // start with a new independant term
	    nextLagIdx = 0;
	}

	for (lagIdx = nextLagIdx; lagIdx < countLags(); lagIdx++) {
	    if (termIdx == _depVarCol && _laggedDepPartOfIndep == YES
	    && getLag(lagIdx) == 0) {
		// lag 0 dependent term is not allowed to be
		// part of multipliered independent term
		continue;
	    }

	    for (expIdx = 0; expIdx < countExps(); expIdx++) {
		// fitting data
		Term newFittingTerm(getFittingTerm(termIdx));

		newFittingTerm.lagging(getLag(lagIdx),maxLag());
		newFittingTerm.power(getExp(expIdx));
		if (newFittingTerm.status() == INVALID) {
		    // invalid term; look for next
		    continue;
		} else {
		    newFittingTerm = currFittingTerm * newFittingTerm;
		}

		// test data
		Term newTestTerm(getTestTerm(termIdx));

		newTestTerm.lagging(getLag(lagIdx),maxLag());
		newTestTerm.power(getExp(expIdx));
		if (newTestTerm.status() == INVALID) {
		    // invalid term; look for next
		    continue;
		} else {
		    newTestTerm = currTestTerm * newTestTerm;
		}

		multiGen(newFittingTerm, newTestTerm, termIdx, lagIdx,
			targetMultiNum, currMultiNum + 1, pNum);

	    }	// expIdx
	}   // lagIdx
    }	// termIdx
}

/////////////////////////////////////////////////////////////////////////
//	Then the quickFit will fit the model based on current data set
//	(terms stored as originalTerm array) to obtain the optimal
//	solution.
//	The only valuable information in bufTerms is property (not data).
/////////////////////////////////////////////////////////////////////////
void
PowerFit::quickFit()
{
	Trace t("PowerFit::quickFit()", TRACE_ID);

	int termIdx, propIdx, countProp;

	calTotalMultiTerms();

	// for each term in modelTerm array, get column, lag, and exponent info
	// and fill with data from fitting and test array to build a new model
	for (termIdx = 0; termIdx < countBufTerms(); termIdx++) {
		const Term& srcTerm	= getBufTerm(termIdx);	// for property
		Term	fittingTarTerm	= getFittingTerm(0);	// constant
		Term	testTarTerm	= getTestTerm(0);	// constant

		countProp = srcTerm.countProperty();
		for (propIdx = 0; propIdx < countProp; propIdx++) {
			// it should not have padding terms at all
			const Property& srcProp = srcTerm.getProperty(propIdx);
			t.out(T_DEBUG) << "termIdx " << termIdx << " propIdx "
				<< propIdx << endl;
			t.out(T_DEBUG) << "colNum " << srcProp.col()
				<< " lag " << srcProp.lag() << " exp "
				<< srcProp.exp() << endl;

			Term newFittingTerm(getFittingTerm(srcProp.col()));
			newFittingTerm.lagging(srcProp.lag(), maxLag());
			newFittingTerm.power(srcProp.exp());
			// need to check whether it is a valid term
			if (newFittingTerm.status() == VALID) {
				fittingTarTerm = fittingTarTerm * newFittingTerm;
			}

			Term newTestTerm(getTestTerm(srcProp.col()));
			newTestTerm.lagging(srcProp.lag(), maxLag());
			newTestTerm.power(srcProp.exp());
			// need to check whether it is a valid term
			if (newTestTerm.status() == VALID) {
				testTarTerm = testTarTerm * newTestTerm;
			}
		}

		_pModel->addTerm(fittingTarTerm, _laggedFittingDepTerm,
			testTarTerm, _laggedTestDepTerm);
		_pModel->fit(_laggedFittingDepTerm, _fittingTSS,
			_laggedTestDepTerm, _testTSS);
	}

	flushBufTerms();
	genModelForDeletion();
	_remodel = NO;
}

/////////////////////////////////////////////////////////////////////
//	Add the selected term from InCanTerms to model
/////////////////////////////////////////////////////////////////////
void
PowerFit::addInCanTermToModel(int idx)
{
	_pModel->addTerm(getInFittingCanTerm(idx), _laggedFittingDepTerm,
		getInTestCanTerm(idx), _laggedTestDepTerm);
}

/////////////////////////////////////////////////////////////////////
//	Remove all the current In_Candidate terms
/////////////////////////////////////////////////////////////////////
void
PowerFit::flushInCanTerms()
{
	// not really flush, since inCanTerms is non-expandable array
	_pInFittingCanTerms->delFirstN(_pInFittingCanTerms->count());
	_pInTestCanTerms->delFirstN(_pInTestCanTerms->count());
}

/////////////////////////////////////////////////////////////////////
//	NOTE: based on TEST term to determine the candidacy.
/////////////////////////////////////////////////////////////////////
void
PowerFit::addInCanTerms(const CanTerm& newFittingTerm,
	const CanTerm& newTestTerm)
{
	Trace t("PowerFit::addInCanTerms()", TRACE_ID);

	int i, lastIdx;
	DataT absTStatis, absFStatis, absMSE, newAIC, newBIC;

	lastIdx = countInCanTerms() - 1;
	switch (_criteria) {
	case BEST_T_STAT:
	case T_AND_F:
	case T_AND_MSE:
		// candidate array is in descending order of T statistic.
		absTStatis = fabs(newFittingTerm.TStatis());

		if ((countInCanTerms() == FIX_UPPER)
		&& (absTStatis <= fabs(getInFittingCanTerm(lastIdx).TStatis()))) {
			t.out(T_DEBUG) << " too small" << endl;
			return;
		}

		// if entire array is filled, get rid off the last one for
		// the space; countInFittingCanTerms() will be decremented by 1
		if (countInCanTerms() == FIX_UPPER) {
			_pInFittingCanTerms->delLastN(1);
			_pInTestCanTerms->delLastN(1);
		}

		for (i = 0; i < countInCanTerms(); i++) {
			if (absTStatis > fabs(getInFittingCanTerm(i).TStatis())) {
				break;
			}
		}

		break;
	case MAX_F_STAT:
	// candidate array is in descending order of F statistic.
		absFStatis = fabs(newTestTerm.modelStat().FStatis());

		if (countInCanTerms() == FIX_UPPER
		&& absFStatis
		<= fabs(getInTestCanTerm(lastIdx).modelStat().FStatis())) {
			t.out(T_DEBUG) << " too small" << endl;
			return;
		}

		// if entire array is filled, get rid off the last one for
		// the space; countInCanTerms() will be decremented by 1
		if (countInCanTerms() == FIX_UPPER) {
			_pInFittingCanTerms->delLastN(1);
			_pInTestCanTerms->delLastN(1);
		}

		for (i = 0; i < countInCanTerms(); i++) {
			if (absFStatis
			> fabs(getInTestCanTerm(i).modelStat().FStatis())) {
				break;
			}
		}

		break;
	case MIN_MSE:
	// candidate array is in ascending order of MSE
		absMSE = fabs(newTestTerm.modelStat().MSE());

		if (countInCanTerms() == FIX_UPPER
		&& absMSE>= fabs(getInTestCanTerm(lastIdx).modelStat().MSE())) {
			t.out(T_DEBUG) << " too big" << endl;
			return;
		}

		// if entire array is filled, get rid off the last one for
		// the space; countInCanTerms() will be decremented by 1
		if (countInCanTerms() == FIX_UPPER) {
			_pInFittingCanTerms->delLastN(1);
			_pInTestCanTerms->delLastN(1);
		}

		for (i = 0; i < countInCanTerms(); i++) {
			if (absMSE
			< fabs(getInTestCanTerm(i).modelStat().MSE())) {
				break;
			}
		}

		break;
	case MIN_AIC:
	// candidate array is in ascending order of AIC
		newAIC = newTestTerm.modelStat().AIC();

		if (countInCanTerms() == FIX_UPPER
		&& newAIC >= getInTestCanTerm(lastIdx).modelStat().AIC()) {
			t.out(T_DEBUG) << " too big" << endl;
			return;
		}

		// if entire array is filled, get rid off the last one for
		// the space; countInCanTerms() will be decremented by 1
		if (countInCanTerms() == FIX_UPPER) {
			_pInFittingCanTerms->delLastN(1);
			_pInTestCanTerms->delLastN(1);
		}

		for (i = 0; i < countInCanTerms(); i++) {
			if (newAIC < getInTestCanTerm(i).modelStat().AIC()) {
				break;
			}
		}

		break;
	case MIN_BIC:
	// candidate array is in ascending order of BIC
		newBIC = newTestTerm.modelStat().BIC();

		if (countInCanTerms() == FIX_UPPER
		&& newBIC >= getInTestCanTerm(lastIdx).modelStat().BIC()) {
			t.out(T_DEBUG) << " too big" << endl;
			return;
		}

		// if entire array is filled, get rid off the last one for
		// the space; countInCanTerms() will be decremented by 1
		if (countInCanTerms() == FIX_UPPER) {
			_pInFittingCanTerms->delLastN(1);
			_pInTestCanTerms->delLastN(1);
		}

		for (i = 0; i < countInCanTerms(); i++) {
			if (newBIC < getInTestCanTerm(i).modelStat().BIC()) {
				break;
			}
		}

		break;
	}

	_pInFittingCanTerms->insertBefore(i, newFittingTerm);
	_pInTestCanTerms->insertBefore(i, newTestTerm);
}

//////////////////////////////////////////////////////////////////////
//	Figure out the impact to the model in terms of SSE, MSE, etc.
//	when a term is removed from the model.
//////////////////////////////////////////////////////////////////////
void
PowerFit::genModelForDeletion()
{
	int count = _pModel->countTerms();

	if (count == 0) {
		return;
	}

	int i;
	CanTerm tmpFittingTerm, tmpTestTerm;

	// calculate the model with each term absent from the model
	for (i = 0; i < count; i++) {
		// always remove from the first term, and then add it back
		// to the end of array to circulate the array.

		tmpFittingTerm	= _pModel->getFittingTerm(0);
		tmpTestTerm	= _pModel->getTestTerm(0);
		_pModel->delTerm(0);
		_pModel->fit(_laggedFittingDepTerm, _fittingTSS,
			_laggedTestDepTerm, _testTSS);

		// the removed term will carry the model's statistics
		// with this term not in the model
		tmpFittingTerm.modelStat(_pModel->fittingStat());
		tmpTestTerm.modelStat(_pModel->testStat());

		// add it back to the end of term array
		_pModel->addTerm(tmpFittingTerm, _laggedFittingDepTerm,
			tmpTestTerm, _laggedTestDepTerm);
	}

	// restore the original model info.  Only the TStatis and coeff
	// of each model term will be updated but not modelStat.
	_pModel->fit(_laggedFittingDepTerm, _fittingTSS,
		_laggedTestDepTerm, _testTSS);
}

void
PowerFit::setLaggedDepTerm()
{
	Trace t("PowerFit::setLaggedDepTerm()", TRACE_ID);

	t.out(T_DEBUG) << "max lag = " << maxLag() << endl;

	_laggedFittingDepTerm = getFittingTerm(_depVarCol);
	_laggedFittingDepTerm.lagging(0, maxLag());

	_laggedTestDepTerm = getTestTerm(_depVarCol);
	_laggedTestDepTerm.lagging(0, maxLag());

#ifdef	DEBUG
	_laggedFittingDepTerm.printOn(t.out(T_DEBUG));
	_laggedTestDepTerm.printOn(t.out(T_DEBUG));
#endif	DEBUG
}

void
PowerFit::flushFittingData()
{
	_pFittingTerms->flush();
}

void
PowerFit::flushTestData()
{
	_pTestTerms->flush();
}

void
PowerFit::addFittingTerm(const Term& term)
{
	_pFittingTerms->add(term);
}

void
PowerFit::addTestTerm(const Term& term)
{
	_pTestTerms->add(term);
}

int
PowerFit::countFittingTerms() const
{
	return _pFittingTerms->count();
}

int
PowerFit::countTestTerms() const
{
	return _pTestTerms->count();
}

Term&
PowerFit::getFittingTerm(int idx) const
{
	return (*_pFittingTerms)[idx];
}

Term&
PowerFit::getTestTerm(int idx) const
{
	return (*_pTestTerms)[idx];
}

void
PowerFit::flushTerms()
{
	_pFittingTerms->flush();
	_pTestTerms->flush();
	_pBufTerms->flush();
}

void
PowerFit::flushExps()
{
	_pExponents->flush();
}

int
PowerFit::countExps() const
{
	return _pExponents->count();
}

ExpT
PowerFit::getExp(int idx) const
{
	return (*_pExponents)[idx];
}

void
PowerFit::flushMultis()
{
	_pMultipliers->flush();
}

int
PowerFit::countMultis() const
{
	return _pMultipliers->count();
}

MultiT
PowerFit::getMulti(int idx) const
{
	return (*_pMultipliers)[idx];
}

void
PowerFit::flushLags()
{
	_pLags->flush();
}

int
PowerFit::countLags() const
{
	return _pLags->count();
}

LagT
PowerFit::getLag(int idx) const
{
	return (*_pLags)[idx];
}

LagT
PowerFit::maxLag() const
{
	return (*_pLags)[countLags() - 1];
}

void
PowerFit::laggedDepPartOfIndep(BooleanT flag)
{
	_laggedDepPartOfIndep = flag;
}

BooleanT
PowerFit::laggedDepPartOfIndep() const
{
	return _laggedDepPartOfIndep;
}

void
PowerFit::depVarCol(int colNum)
{
	_depVarCol = colNum;
}

int
PowerFit::depVarCol() const
{
	return _depVarCol;
}

long
PowerFit::totalMultiTerms() const
{
	return _totalMultiTerms;
}

DataT
PowerFit::fittingTSS() const
{
	return _fittingTSS;
}

DataT
PowerFit::testTSS() const
{
	return _testTSS;
}

void
PowerFit::modelType(ModelT type)
{
	_modelType = type;
}

void
PowerFit::mode(ModeT mode)
{
	_mode = mode;
}

void
PowerFit::criteria(CritT crit)
{
	_criteria = crit;
}

PowerFit::CritT
PowerFit::criteria() const
{
	return _criteria;
}

int
PowerFit::countInCanTerms() const
{
	// the size of both fitting and test CanTerms should be the same
	return _pInFittingCanTerms->count();
}

const CanTerm&
PowerFit::getInFittingCanTerm(int idx) const
{
	return (*_pInFittingCanTerms)[idx];
}

const CanTerm&
PowerFit::getInTestCanTerm(int idx) const
{
	return (*_pInTestCanTerms)[idx];
}

int
PowerFit::maxAllowedMulti() const
{
	return _maxAllowedMulti;
}

void
PowerFit::svdNormalized(BooleanT flag)
{
	((SvdModel *) _pModel)->normalized(flag);
}

BooleanT
PowerFit::svdNormalized() const
{
	return ((SvdModel *) _pModel)->normalized();
}

void
PowerFit::svdTolerance(float tolerance)
{
	((SvdModel *) _pModel)->tolerance(tolerance);
}

float
PowerFit::svdTolerance() const
{
	return ((SvdModel *) _pModel)->tolerance();
}

float
PowerFit::svdDefaultTolerance() const
{
	return ((SvdModel *) _pModel)->defaultTolerance();
}

void
PowerFit::svdCovariance(ostream& strm) const
{
	((SvdModel *)_pModel)->covariance(strm);
}

int
PowerFit::countModelTerms() const
{
	return _pModel->countTerms();
}

const CanTerm&
PowerFit::getFittingModelTerm(int idx) const
{
	return _pModel->getFittingTerm(idx);
}

const CanTerm&
PowerFit::getTestModelTerm(int idx) const
{
	return _pModel->getTestTerm(idx);
}

void
PowerFit::delModelTerm(int idx)
{
	_pModel->delTerm(idx);
}

const Term&
PowerFit::preFittingDepTerm() const
{
	return _pModel->preFittingDepTerm();
}

const Term&
PowerFit::preTestDepTerm() const
{
	return _pModel->preTestDepTerm();
}

const int
PowerFit::modelNdF() const
{
	return _pModel->ndF();
}

const int
PowerFit::modelNdT() const
{
	return _pModel->ndT();
}

const int
PowerFit::degreeOfFreedomF() const
{
	return (_pModel->ndF() - _pModel->countTerms());
}

const int
PowerFit::degreeOfFreedomT() const
{
	return (_pModel->ndT() - _pModel->countTerms());
}

DataT
PowerFit::modelFittingSSE() const
{
	return _pModel->fittingStat().SSE();
}

DataT
PowerFit::modelTestSSE() const
{
	return _pModel->testStat().SSE();
}

DataT
PowerFit::modelFittingRSquare() const
{
	return _pModel->fittingStat().RSquare();
}

DataT
PowerFit::modelTestRSquare() const
{
	return _pModel->testStat().RSquare();
}

DataT
PowerFit::modelFittingCRSQ() const
{
	return (_pModel->fittingStat().SSE() / _fittingTSS);
}

DataT
PowerFit::modelTestCRSQ() const
{
	return (_pModel->testStat().SSE() / _testTSS);
}

DataT
PowerFit::modelFittingMSE() const
{
	return _pModel->fittingStat().MSE();
}

DataT
PowerFit::modelTestMSE() const
{
	return _pModel->testStat().MSE();
}

DataT
PowerFit::modelFittingFStatis() const
{
	return _pModel->fittingStat().FStatis();
}

DataT
PowerFit::modelTestFStatis() const
{
	return _pModel->testStat().FStatis();
}

DataT
PowerFit::modelFittingAIC() const
{
	return _pModel->fittingStat().AIC();
}

DataT
PowerFit::modelTestAIC() const
{
	return _pModel->testStat().AIC();
}

DataT
PowerFit::modelFittingBIC() const
{
	return _pModel->fittingStat().BIC();
}

DataT
PowerFit::modelTestBIC() const
{
	return _pModel->testStat().BIC();
}

void
PowerFit::addBufTerm(const Term& term)
{
	_pBufTerms->add(term);
}

void
PowerFit::flushBufTerms()
{
	_pBufTerms->flush();
}

const Term&
PowerFit::getBufTerm(int idx) const
{
	return (*_pBufTerms)[idx];
}

int
PowerFit::countBufTerms() const
{
	return _pBufTerms->count();
}

////////////////////////////////////////////////////////////////////////////
//	This is the interface to UI module of reading model file getting
//	property information and ready to construct fitting and test terms
//	for the model.  It actually temporarily put terms in the buffer terms
////////////////////////////////////////////////////////////////////////////
void
PowerFit::addModelTerm(const Term& term)
{
	_pBufTerms->add(term);
}

