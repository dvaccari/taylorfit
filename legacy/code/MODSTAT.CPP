#include "ModStat.h"

ModelStat::ModelStat()
{}

ModelStat::~ModelStat()
{}

BooleanT
ModelStat::operator == (const ModelStat& rhs) const
{
	if (_SSE == rhs._SSE && _SSR == rhs._SSR && _SEC == rhs._SEC
	&& _RSquare == rhs._RSquare && _MSE == rhs._MSE && _MSR == rhs._MSR
	&& _FStatis == rhs._FStatis && _AIC == rhs._AIC && _BIC == rhs._BIC)
		return YES;
	else
		return NO;
}

void
ModelStat::printOn(ostream& strm) const
{
	strm << "SSE[" << _SSE << "]" << endl;
}


