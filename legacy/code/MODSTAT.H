#ifndef	__MODEL_STAT_H
#define	__MODEL_STAT_H

#include <iostream.h>
#include "MyDefs.h"

///////////////////////////////////////////////////////////////////
//	ModelStat holds all the statistics information regrading
//	to the predicted model.
///////////////////////////////////////////////////////////////////

class ModelStat {
public:
	ModelStat();
	virtual	~ModelStat();

	// set
	void	SSE(DataT);
	void	SSR(DataT);
	void	SEC(DataT);
	void	RSquare(DataT);
	void	MSE(DataT);
	void	MSR(DataT);
	void	FStatis(DataT);
	void	AIC(DataT);
	void	BIC(DataT);

	// get
	DataT	SSE() const;
	DataT	SSR() const;
	DataT	SEC() const;
	DataT	RSquare() const;
	DataT	MSE() const;
	DataT	MSR() const;
	DataT	FStatis() const;
	DataT	AIC() const;
	DataT	BIC() const;

	void	reset();

	BooleanT	operator == (const ModelStat& rhs) const;

	void	printOn(ostream& strm = cout) const;
private:
	DataT	_SSE;			// Standard Error of result (Y)
	DataT	_SSR;
	DataT	_SEC;			// Standard Error of coefficient
	DataT	_RSquare;
	DataT	_MSE;
	DataT	_MSR;
	DataT	_FStatis;
	DataT	_AIC;
	DataT	_BIC;
};

inline void
ModelStat::reset()
{
	_SSE = _SSR = _SEC = _RSquare = _MSE = _FStatis = _AIC = _BIC = 0;
}

inline void
ModelStat::SSE(DataT sse)
{
	_SSE = sse;
}

inline void
ModelStat::SSR(DataT ssr)
{
	_SSR = ssr;
}

inline void
ModelStat::SEC(DataT sec)
{
	_SEC = sec;
}

inline void
ModelStat::RSquare(DataT r2)
{
	_RSquare = r2;
}

inline void
ModelStat::MSR(DataT msr)
{
	_MSR = msr;
}

inline void
ModelStat::MSE(DataT mse)
{
	_MSE = mse;
}

inline void
ModelStat::FStatis(DataT fstat)
{
	_FStatis = fstat;
}

inline void
ModelStat::AIC(DataT aic)
{
	_AIC = aic;
}

inline void
ModelStat::BIC(DataT bic)
{
	_BIC = bic;
}

inline DataT
ModelStat::SSE() const
{
	return _SSE;
}

inline DataT
ModelStat::SSR() const
{
	return _SSR;
}

inline DataT
ModelStat::SEC() const
{
	return _SEC;
}

inline DataT
ModelStat::RSquare() const
{
	return _RSquare;
}

inline DataT
ModelStat::MSR() const
{
	return _MSR;
}

inline DataT
ModelStat::MSE() const
{
	return _MSE;
}

inline DataT
ModelStat::FStatis() const
{
	return _FStatis;
}

inline DataT
ModelStat::AIC() const
{
	return _AIC;
}

inline DataT
ModelStat::BIC() const
{
	return _BIC;
}

#endif	__MODEL_STAT_H
