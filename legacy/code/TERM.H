#ifndef	__TERM_H
#define	__TERM_H

///////////////////////////////////////////////////////////////////
//	Term object is a placeholder of data associated with its
//	configuration (column number, lag number, and exponent) and
//	position (NUMERATOR or DENUMINATOR) information.
//	Each Term object can be a result of multiplied term objects,
//	the _pPropArray keeps the configuration information of
//	constituents Term objects.
//	For any reason, if there is any invalid data element within
//	the data array, the whole Term object is marked as an INVALID
//	object and should not be further processed.
///////////////////////////////////////////////////////////////////

#include <math.h>
#include "Property.h"
#include "Trace.h"

typedef	float	DataT;
typedef	MyArray<DataT>		DataArrayT;

extern	"C" {
	double	pow(double, double);
};

class Term {
public:
	enum PositionT {DENOMINATOR = 0, NUMERATOR};

	Term();
	Term(const Term& rhs);	// copy constructor
	virtual ~Term();

	void		status(StatusT status);	// VALID or INVALID
	StatusT		status() const;

	void		position(PositionT position);
	PositionT	position() const;

	void		addData(DataT value);
	void		delData(int idx);
	void		delFirstNData(int number);
	void		delLastNData(int number);
	void		updateData(int idx, const DataT& value);
	const DataT&	getData(int idx) const;
	int 		countData() const;

	void		addProperty(const Property& property);
	void		delProperty(int idx);
	void		updateProperty(int idx, const Property& newProperty);
	const Property& getProperty(int idx) const;
	int		countProperty() const;

	void		fixStatistics();
	DataT		maxData() const;
	DataT		minData() const;
	DataT		mean() const;
	DataT		stdDev() const;
	
	void	mean(DataT mean);

	void		lagging(LagT lag, LagT modelMaxLag);	// fix Stat too
	void		power(ExpT);

	virtual void	flush();

	Term&		operator = (const Term& rhs);
	Term		operator * (const Term& rhs) const;
	BooleanT	operator == (const Term& rhs) const;
	BooleanT	operator != (const Term& rhs) const;

	void		printData(ostream& strm = cout) const;
	void		printProperty(ostream& strm = cout) const;
	void		printStatus(ostream& strm = cout) const;
	void		printPosition(ostream& strm = cout) const;
	virtual void	printOn(ostream& strm = cout) const;

protected:
	void	copy(const Term&);

private:
	BooleanT	powerValidate(DataT, ExpT);

	StatusT		_status;	// VALID or INVALID
	PositionT	_position;	// numerator or denominator
	DataArrayT	*_pData;	// data array
	PropArrayT	*_pProperty;	// column, lag, and exponent information
	DataT		_mean;		// mean value of this object
	DataT		_stdDev;	// standard deviation
	DataT		_maxData;
	DataT		_minData;
};

typedef	MyArray<Term>	TermArrayT;

inline void
Term::status(StatusT status)
{
	_status = status;
}

inline StatusT
Term::status() const
{
	return _status;
}

inline void
Term::position(PositionT position)
{
	_position = position;
}

inline Term::PositionT
Term::position() const
{
	return _position;
}

inline void
Term::addData(DataT data)
{
	_pData->add(data);
}

inline void
Term::delData(int idx)
{
	_pData->del(idx);
}

inline void
Term::delFirstNData(int number)
{
	_pData->delFirstN(number);
}

inline void
Term::delLastNData(int number)
{
	_pData->delLastN(number);
}

inline void
Term::updateData(int idx, const DataT& data)
{
	(*_pData)[idx] = data;
}

inline const DataT&
Term::getData(int idx) const
{
	return (*_pData)[idx];
}

inline int
Term::countData() const
{
	return _pData->count();
}

inline void
Term::addProperty(const Property& property)
{
	_pProperty->add(property);
}

inline void
Term::delProperty(int idx)
{
	_pProperty->del(idx);
}

inline void
Term::updateProperty(int idx, const Property& property)
{
	(*_pProperty)[idx] = property;
}

inline const Property&
Term::getProperty(int idx) const
{
	return (*_pProperty)[idx];
}

inline int
Term::countProperty() const
{
	return _pProperty->count();
}

inline DataT
Term::maxData() const
{
	return _maxData;
}

inline DataT
Term::minData() const
{
	return _minData;
}

inline void
Term::mean(DataT mean)
{
	_mean = mean;
}

inline DataT
Term::mean() const
{
	return _mean;
}

inline DataT
Term::stdDev() const
{
	return _stdDev;
}

#endif	__TERM_H

