#ifndef	__PROPERTY_H
#define	__PROPERTY_H

///////////////////////////////////////////////////////////////////
//	This class records all the property information about Term
//	object, including column number, lag number, and exponent.
///////////////////////////////////////////////////////////////////
#include <iomanip.h>
#include "MyDefs.h"
#include "MyArray.h"

class Property {
public:
	Property(ColT col = 0, LagT lag = 0, ExpT exp = 0);
	Property(const Property& rhs);
	~Property();

	// set
	void	col(ColT col);
	void	lag(LagT lag);
	void	exp(ExpT exp);

	// get
	ColT	col() const;
	LagT	lag() const;
	ExpT	exp() const;

	Property&	operator = (const Property& rhs);
	BooleanT	operator == (const Property& rhs) const;
	BooleanT	operator != (const Property& rhs) const;

	void	printOn(ostream& strm = cout) const;	// for debugging only

private:
	void	copy(const Property& rhs);

	ColT	_col;		// column number
	LagT	_lag;		// lag number
	ExpT	_exp;		// exponent
};

inline void
Property::col(ColT col)
{
	_col = col;
}

inline ColT
Property::col() const
{
	return _col;
}

inline void
Property::lag(LagT lag)
{
	_lag = lag;
}

inline LagT
Property::lag() const
{
	return _lag;
}

inline void
Property::exp(ExpT exp)
{
	_exp = exp;
}

inline ExpT
Property::exp() const
{
	return _exp;
}

typedef	MyArray<Property>		PropArrayT;

#endif	__PROPERTY_H

