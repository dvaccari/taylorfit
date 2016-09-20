#include "Property.h"

Property::Property(ColT col, LagT lag, ExpT exp) :
	_col(col), _lag(lag), _exp(exp)
{}

Property::Property(const Property& rhs)
{
	// copy constructor
	copy(rhs);
}

Property::~Property()
{};

void
Property::copy(const Property& rhs)
{
	col(rhs.col());
	lag(rhs.lag());
	exp(rhs.exp());
}

Property&
Property::operator = (const Property& rhs)
{
	if (this == &rhs)
		return *this;

	copy(rhs);

	return *this;
}

BooleanT
Property::operator == (const Property& rhs) const
{
	if (this == &rhs)
		return YES;

	if (col() == rhs.col() && lag() == rhs.lag() && exp() == rhs.exp())
		return YES;
	else
		return NO;
}

BooleanT
Property::operator != (const Property& rhs) const
{
	if (*this == rhs) {
		return NO;
	} else {
		return YES;
	}
}

void
Property::printOn(ostream& strm) const
{
	int width, precision;

	//	back up the original width and precision setup
	width		= strm.width();
	precision	= strm.precision();

	strm << col() << " " << lag() << " ";
	strm << setiosflags(ios::showpoint | ios::fixed)
		<< setw(4) << setprecision(1);
	strm << exp() << "  ";
	strm << resetiosflags(ios::showpoint | ios::fixed);

	//	restore the original width and precision
	strm.width(width);
	strm.precision(precision);
}

