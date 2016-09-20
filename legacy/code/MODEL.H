#ifndef	__MODEL_H
#define	__MODEL_H

#include "CanTerm.h"
#include "ModStat.h"

////////////////////////////////////////////////////////////////////////
//	_pFittingTerms points to an array of CanTerms currently in the
//	model with fitting data, while _pTestTerms with test data.
//	The modelStat part of each CanTerm holds the impacted model
//	statistics when that term removed from model; that is used as
//	a reference to determine which is the best term to remove to
//	improve the prediction result of the model.
////////////////////////////////////////////////////////////////////////
class Model {
public:
	// Constructors and destructor
	Model(const Term& fittingDepTerm, const Term& testDepTerm);
		// depTerm should be lagged term
	virtual ~Model();

	virtual void	addTerm(const CanTerm& fittingTerm,
				const Term& fittingDepTerm,
				const CanTerm& testTerm,
				const Term& testDepTerm) = 0;
	virtual void	addTerm(const Term& fittingTerm,
				const Term& fittingDepTerm,
				const Term& testTerm,
				const Term& testDepTerm) = 0;
	virtual void	delTerm(int idx) = 0;

	virtual BooleanT	fit(const Term& fittingDepTerm,
					DataT fittingTSS,
					const Term& testDepTerm,
					DataT testTSS) = 0;

	void	ndF(int);	// number of valid data in lagged fitting term
	int	ndF() const;
	void	ndT(int);	// number of valid data in lagged test term
	int	ndT() const;

	int			countTerms() const;
	CanTerm&		getFittingTerm(int idx);
	const CanTerm&		getFittingTerm(int idx) const;
	CanTerm&		getTestTerm(int idx);
	const CanTerm&		getTestTerm(int idx) const;

	const Term&		preFittingDepTerm() const;
	const Term&		preTestDepTerm() const;

	BooleanT		isInModel(const Term& fittingTerm) const;
	const ModelStat&	fittingStat() const;
	const ModelStat&	testStat() const;

	void			printOn(ostream& strm = cout);
protected:
	int	getTermUpper() const;
	int	getTermDelta() const;

	void	calStatistics(const Term& fittingDepTerm,
			DataT fittingTSS,
			const Term& testDepTerm,
			DataT testTSS);	// aggregation
	void	calPreDepTerm();	// calculate predict dependent term
	void	calSSE(const Term& fittingDepTerm, const Term& testDepTErm);
	void	calSSR(DataT fittingTSS, DataT testTSS);
	void	calRSquare(DataT fittingTSS, DataT testTSS);
	void	calMSR();
	void	calMSE();
	void	calFStatis();
	void	calAIC();
	void	calBIC();
	void	calTStatis();

	// pure virtual functions
	virtual void	expandMatrix() = 0;
	virtual void	fixMatrix(const Term& depTerm) = 0;
	virtual void	calSEC() = 0;

private:
	CanTermArrayT	*_pFittingTerms;	// terms with fitting data
	CanTermArrayT	*_pTestTerms;		// terms with test data
	int		_ndF;			// # of valid data in each
						// fitting term
	int		_ndT;			// # of valid data in each
						// test term
	Term		_preFittingDepTerm;	// predicted fitting dependent
						// term
	Term		_preTestDepTerm;	// predicted dependent test term
	ModelStat	_fittingStat;		// fitting model's statistics
	ModelStat	_testStat;		// test model's statistics
};

inline void
Model::ndF(int ndF)
{
	_ndF = ndF;
}

inline void
Model::ndT(int ndT)
{
	_ndT = ndT;
}

inline int
Model::ndF() const
{
	return _ndF;
}

inline int
Model::ndT() const
{
	return _ndT;
}

inline const CanTerm&
Model::getFittingTerm(int idx) const
{
	return (*_pFittingTerms)[idx];
}

inline CanTerm&
Model::getFittingTerm(int idx)
{
	return (*_pFittingTerms)[idx];
}

inline const CanTerm&
Model::getTestTerm(int idx) const
{
	return (*_pTestTerms)[idx];
}

inline CanTerm&
Model::getTestTerm(int idx)
{
	return (*_pTestTerms)[idx];
}

inline int
Model::countTerms() const
{
	return _pFittingTerms->count();
}

inline int
Model::getTermUpper() const
{
	return _pFittingTerms->getUpper();
}

inline int
Model::getTermDelta() const
{
	return _pFittingTerms->getDelta();
}

inline const ModelStat&
Model::fittingStat() const
{
	return _fittingStat;
}

inline const ModelStat&
Model::testStat() const
{
	return _testStat;
}

#endif	__MODEL_H
