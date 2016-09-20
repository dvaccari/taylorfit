#include "CanTerm.h"

CanTerm::CanTerm()
{};

CanTerm::CanTerm(const CanTerm& rhs) : Term(rhs)
{
	copy(rhs);
}

CanTerm::CanTerm(const Term& rhs) : Term(rhs)
{
	Trace t("CanTerm::CanTerm(const Term&)", TRACE_ID);

	initialize();

	printOn(t.out(T_DEBUG));
}

CanTerm::~CanTerm()
{}

void
CanTerm::initialize()
{
	_TStatis	= 0;
	_coeff		= 0;
	_sec		= 0;
	_modelStat.reset();
}

//////////////////////////////////////////////////////////////
//	Only copy data members of this class
//////////////////////////////////////////////////////////////
void
CanTerm::copy(const CanTerm& src)
{
	_TStatis	= src._TStatis;
	_coeff		= src._coeff;
	_sec		= src._sec;
	// ModelStat information
	_modelStat = src._modelStat;
}

CanTerm&
CanTerm::operator = (const CanTerm& rhs)
{
	if (this == &rhs)
		return *this;

	flush();
	Term::operator=(rhs);
	copy(rhs);

	return *this;
}

CanTerm&
CanTerm::operator = (const Term& rhs)
{
	flush();
	Term::operator=(rhs);
	initialize();	// reset the data members part

	return *this;
}

int
CanTerm::operator == (const CanTerm& rhs) const
{
	if (this == &rhs)
		return YES;

	if (Term::operator==(rhs)
	&& _TStatis == rhs._TStatis
	&& _coeff == rhs._coeff
	&& _sec == rhs._sec
	&& _modelStat == rhs.modelStat()) {
		return YES;
	} else {
		return NO;
	}
}

void
CanTerm::printOn(ostream& strm) const
{
	Term::printOn(strm);

}
