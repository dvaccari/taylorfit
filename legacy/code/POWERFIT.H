#ifndef	__POWER_FIT_H
#define	__POWER_FIT_H

#include <string.h>
#include "SvdModel.h"
#include "NeModel.h"
#include "CanTerm.h"

typedef	MyArray<ExpT>	ExpArrayT;
typedef	MyArray<LagT>	LagArrayT;
typedef	short	MultiT;
typedef	MyArray<MultiT>	MultiArrayT;	// multipliers

class PowerFit {
public:
	enum ModelT {SVD = 0, NORMAL_EQ};
	enum ModeT {MANUAL = 0, AUTO};

	enum CritT {BEST_T_STAT = 1, MAX_F_STAT, MIN_MSE, MIN_AIC, MIN_BIC,
		T_AND_F, T_AND_MSE};

	// constructs and destruct
	PowerFit();
	~PowerFit();

	BooleanT	readFittingData(const char *pData);	// one row
	void		flushFittingData();		// also constTerm
	void		addFittingTerm(const Term& term);
	int		countFittingTerms() const;
	Term&		getFittingTerm(int idx) const;


	BooleanT	readTestData(const char *pData);	// one row
	void		flushTestData();
	void		addTestTerm(const Term& term);
	int		countTestTerms() const;
	Term&		getTestTerm(int idx) const;

	void	readExps(const char * exps);
	int	countExps() const;
	ExpT	getExp(int idx) const;

	void	readMultis(const char * multis);
	int	countMultis() const;
	MultiT	getMulti(int idx) const;

	void	readLags(const char * lags);
	int	countLags() const;
	LagT	getLag(int idx) const;

	void	laggedDepPartOfIndep(BooleanT flag);
	void	depVarCol(int colNum);

	BooleanT	laggedDepPartOfIndep() const;
	int		depVarCol() const;

	void	init();
	void	calTSS();
	DataT	fittingTSS() const;
	DataT	testTSS() const;

	void	modelType(ModelT type);
	void	mode(ModeT mode);
	void	criteria(CritT crit);
	PowerFit::CritT	criteria() const;
	int	maxAllowedMulti() const;

	int	fit();
	void	quickFit();

	void	addModelTerm(const Term&);

	int		countInCanTerms() const;
	const CanTerm&	getInFittingCanTerm(int) const;
	const CanTerm&	getInTestCanTerm(int) const;

	void		addInCanTermToModel(int idx);
	BooleanT	autoAddInCanTermToModel();
	DataT		addCriteria();
	void		genModelForDeletion();
	BooleanT	autoDelModelTerm();

	int		countModelTerms() const;
	const CanTerm&	getFittingModelTerm(int idx) const;
	const CanTerm&	getTestModelTerm(int idx) const;
	void		delModelTerm(int idx);
	const int	modelNdF() const;
	const int	modelNdT() const;
	const int	degreeOfFreedomF() const;
	const int	degreeOfFreedomT() const;
	const Term&	preFittingDepTerm() const;
	const Term&	preTestDepTerm() const;

	DataT		modelFittingSSE() const;
	DataT		modelTestSSE() const;
	DataT		modelFittingRSquare() const;
	DataT		modelTestRSquare() const;
	DataT		modelFittingCRSQ() const;
	DataT		modelTestCRSQ() const;
	DataT		modelFittingMSE() const;
	DataT		modelTestMSE() const;
	DataT		modelFittingFStatis() const;
	DataT		modelTestFStatis() const;
	DataT		modelFittingAIC() const;
	DataT		modelTestAIC() const;
	DataT		modelFittingBIC() const;
	DataT		modelTestBIC() const;

	void		svdNormalized(BooleanT);
	void		svdTolerance(float);

	BooleanT	svdNormalized() const;
	float		svdTolerance() const;
	float		svdDefaultTolerance() const;
	void		svdCovariance(ostream& strm = cout) const;

protected:
private:
	TermArrayT	*_pFittingTerms;	// original fitting terms
	TermArrayT	*_pTestTerms;		// test terms
	TermArrayT	*_pBufTerms;		// temp model term (property)
	ExpArrayT	*_pExponents;
	MultiArrayT	*_pMultipliers;
	LagArrayT	*_pLags;

	ModelT		_modelType;		// SVD or NORMAL_EQ
	Model		*_pModel;
	CanTermArrayT	*_pInFittingCanTerms;	// fixed size array
	CanTermArrayT	*_pInTestCanTerms;	// fixed size array

	Term		_laggedFittingDepTerm;	// lagged dependant term
	Term		_laggedTestDepTerm;	// lagged dependant term
	BooleanT	_laggedDepPartOfIndep;	// flag for lagged-dep term
	int		_depVarCol;		// the # of the col w/ dep var.
	long		_totalMultiTerms;
	DataT		_fittingTSS;
	DataT		_testTSS;

	ModeT		_mode;			// MANUAL or AUTO
	CritT		_criteria;
	int		_maxAllowedMulti;
	BooleanT	_remodel;

	void	reset();
	void	newModel();
	void	deleteModel();
	void	remodel();
	
	void	flushTerms();

	void	flushExps();
	void	addExp(ExpT exp);
	void	delExp(ExpT exp);

	void	flushMultis();
	void	addMulti(MultiT multi);
	void	delMulti(MultiT multi);

	void	flushLags();
	void	addLag(LagT lag);
	void	delLag(LagT lag);
	LagT	maxLag() const;

	void	calTotalMultiTerms();
	long	totalMultiTerms() const;
	int	combination(int upper, int lower);
	void	setLaggedDepTerm();

	void	flushInCanTerms();

	void	addInCanTerms(const CanTerm& newFittingCanTerm,
			const CanTerm& newTestCanTerm);
	void	multiGen(const Term& fittingTerm, const Term& testTerm,
			int termIdx, int lagIdx, int targetMultiNum,
			int currMultiNum, int *pNum);
	void	dumpModelTerms();

	void		addBufTerm(const Term& term);
	void		flushBufTerms();
	const Term&	getBufTerm(int idx) const;
	int 		countBufTerms() const;

#ifdef	UNIT_TEST
public:
#else
private:
#endif	UNIT_TEST
	const Term&	fittingConstTerm() const;
	const Term&	testConstTerm() const;
};

#endif	__POWER_FIT_H
