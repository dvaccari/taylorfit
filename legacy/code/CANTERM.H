#ifndef	__CAN_TERM_H
#define	__CAN_TERM_H

#include "Term.h"
#include "ModStat.h"

///////////////////////////////////////////////////////////////////
//	CanTerm is a candidate term which either will be introduced
//	into the prediction model becoming a part of the model or
//	removed out of the model.  It carries the data and property
//	information as well as those parameters (e.g. SSE FStat)
//	affecting the result model with/without the term in the
//	predition model.
///////////////////////////////////////////////////////////////////

class CanTerm : public Term {
public:
	CanTerm();
	CanTerm(const CanTerm& rhs);
	CanTerm(const Term& rhs);
	virtual	~CanTerm();

	void flush();
	
	// set
	void	modelStat(const ModelStat&);
	void	TStatis(DataT value);
	void	coeff(DataT value);
	void	SEC(DataT value);

	// get
	const ModelStat&	modelStat() const;
	DataT	TStatis() const;
	DataT	coeff() const;
	DataT	SEC() const;

	CanTerm& operator = (const CanTerm&);
	CanTerm& operator = (const Term&);
	int	operator == (const CanTerm&) const;

	virtual void	printOn(ostream& strm = cout) const;
protected:
	void	copy(const CanTerm& rhs);
	void	initialize();
private:
	DataT		_TStatis;	// T Statistics
	DataT		_coeff;		// un-normalized coefficient
	DataT		_sec;		// standard error of coefficient
	ModelStat	_modelStat;

};

//////////////////////// inline codes ///////////////////////////

inline void
CanTerm::flush()
{
	Term::flush();
	initialize();
}

inline void
CanTerm::TStatis(DataT value)
{
	_TStatis = value;
}

inline DataT
CanTerm::TStatis() const
{
	return _TStatis;
}

inline void
CanTerm::coeff(DataT value)
{
	_coeff = value;
}
	
inline DataT
CanTerm::coeff() const
{
	return _coeff;
}

inline void
CanTerm::SEC(DataT value)
{
	_sec = value;
}
	
inline DataT
CanTerm::SEC() const
{
	return _sec;
}

inline void
CanTerm::modelStat(const ModelStat& modelStat)
{
	_modelStat = modelStat;
}

inline const ModelStat&
CanTerm::modelStat() const
{
	return _modelStat;
}

typedef	MyArray<CanTerm> CanTermArrayT;

#endif	__CAN_TERM_H
