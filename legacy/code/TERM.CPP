#include "Term.h"

Term::Term()
{
	_status		= VALID;
	_position	= NUMERATOR;
	_pData		= new DataArrayT(EXT_UPPER, EXT_DELTA);
	_pProperty	= new PropArrayT(EXT_UPPER, EXT_DELTA);
	_mean		= 0;
	_stdDev		= 0;
	_maxData	= 0;
	_minData	= 0;
}

// copy constructor
Term::Term(const Term& rhs)
{
	_pData		= 0;
	_pProperty 	= 0;
	copy(rhs);
}


Term::~Term()
{
	delete	_pData;
	delete	_pProperty;
}

void
Term::flush()
{
	if (_pData != 0) {
		_pData->flush();	// array is trashed but not the object
	}

	if (_pProperty != 0) {
		_pProperty->flush();	// array is trashed but not the object
	}

	_mean = _stdDev = _maxData = _minData = 0;
}

void
Term::copy(const Term& rhs)
{
	int idx, max;

	flush();

	max = rhs.countData();		// figure out the array size needed
	if (_pData != 0) {
		delete _pData;		// delete the old one
	}
	_pData = new DataArrayT(max, EXT_DELTA);

	for (idx = 0; idx < max; idx++)
		addData(rhs.getData(idx));

	max = rhs.countProperty();
	if (_pProperty != 0) {
		delete _pProperty;		// delete the old one
	}
	_pProperty = new PropArrayT(max, EXT_DELTA);

	for (idx = 0; idx < max; idx++)
		addProperty(rhs.getProperty(idx));

	_status		= rhs.status();
	_position	= rhs.position();

	_mean		= rhs.mean();
	_stdDev		= rhs.stdDev();

	_maxData	= rhs.maxData();
	_minData	= rhs.minData();
}

/////////////////////////////////////////////////////////////////////
//	Fix all the statistics of this object including maxData, minData,
//	mean, and stdDev.
/////////////////////////////////////////////////////////////////////
void
Term::fixStatistics()
{
	if (_status == INVALID)
		return;		// don't even bothered

	int idx, count;

	count = countData();

	// set the Max. and Min. of data elements
	if (count == 0) {
		_maxData = _minData = 0;
	} else {
		// temporarily set them to the 1st element
		_maxData = _minData = getData(0);
	}
	for (idx = 1; idx < count; idx++) {
		if (getData(idx) > _maxData)
			_maxData = getData(idx);

		if (getData(idx) < _minData)
			_minData = getData(idx);
	}

	// calculating mean
	DataT	sum = 0.0;
	for (idx = 0; idx < count; idx++)
		sum += getData(idx);

	_mean = (sum / count);

	// calculating standard deviation
	sum = 0.0;
	for (idx = 0; idx < count; idx++) {
		sum += pow(getData(idx) - _mean, 2);
	}

	_stdDev = sqrt(sum/(count - 1));
}

///////////////////////////////////////////////////////////////////
//	To shift the data elements in the array based on "lag" and
//	"modelMaxLag" arguments.  The "modelMaxLag" is the maximum
//	allowed lag number in the model.
//	The way to move data is droping the last "lag" number of
//	elements in the array, then move rest of array forward by
//	the number which is difference between "lag" and "modelMaxLag".
//
//	The following example shows how data elements got moved:
//	data array [1 2 3 4 5 6 7 8 9 10], lag = 2, maxLag = 3
//	First drop last "lag" (2) elements then move rest forward by the
//	difference between "lag" and "modelMaxLag" (3 - 2).
//	after "lagged", the data array becomes [2 3 4 5 6 7 8]
///////////////////////////////////////////////////////////////////
void
Term::lagging(LagT lag, LagT modelMaxLag)
{
	Trace t("Term::lagging()", TRACE_ID);

	if (_status == INVALID)
		// At least one data element is invalid, don't bother
		return;

	if (lag > modelMaxLag) {
		_status = INVALID;
		return;
	}

	int idx, max, oldLag;
	Property tmpProperty;

	// update the property info
	max = countProperty();
	for (idx = 0; idx < max; idx++) {
		tmpProperty	= getProperty(idx);
		oldLag		= tmpProperty.lag();
		tmpProperty.lag(oldLag + lag);
		updateProperty(idx, tmpProperty);
	}

	// taking care of data array
	max = countData();
	if (lag >= max) {
		_pData->flush();		// will make countData() = 0
		return;
	}

	// drop off last "lag" number of data member
	delLastNData(lag);

	// shifting data upwards depending upon the number of difference between
	// "lag" and "modelMaxLag"
	delFirstNData(modelMaxLag - lag);

	t.out(T_DEBUG) << "new count = " << countData() << endl;

	fixStatistics();
}

////////////////////////////////////////////////////////////////////
//	The entire of object (data array) takes the power of passed
//	argument.
////////////////////////////////////////////////////////////////////
void
Term::power(ExpT power)
{
	if (_status == INVALID)
		// At least one data element is invalid
		return;

	int idx, max;
	ExpT oldExp;
	Property tmpProperty;

	// update the power values
	max = countProperty();
	for (idx = 0; idx < max; idx++) {
		tmpProperty	= getProperty(idx);
		oldExp		= tmpProperty.exp();
		tmpProperty.exp(oldExp * power);
		updateProperty(idx, tmpProperty);
	}

	max = countData();
	for (idx = 0; idx < max; idx++) {
		// need to check if this is a valid operation before calculating
		if (powerValidate(getData(idx), power) == NO) {
			_status = INVALID;	// do nothing further
			return;
		}

		updateData(idx, pow(getData(idx), power));
	}

	fixStatistics();
}

///////////////////////////////////////////////////////////
//	To validate whether this is a legitimate operation.
///////////////////////////////////////////////////////////
BooleanT
Term::powerValidate(DataT base, ExpT power)
{
	if (base == 0 && power < 0) {
	// cerr << "power(" << base << ", " << power << ") invalid" << endl;
		return NO;
	}

	if (base < 0) {
		double integer;

		// checking if "power" is an integer number
		if (modf(power, &integer) != 0) {
	// cerr << "power(" << base << ", " << power << ") invalid" << endl;
			return NO;		// non-integer power
		}
	}

	return YES;
}

Term &
Term::operator = (const Term& rhs)
{
	if (this == &rhs)
		return *this;

	copy(rhs);

	return *this;
}

Term
Term::operator * (const Term& rhs) const
{
	Term newTerm;
	int idx, max;

	// invalid operation due to at least one term has invalid data
	if (status() == INVALID || rhs.status() == INVALID) {
		newTerm.status(INVALID);
		return newTerm;
	}

	// set up new Property information.
	// The rule is if the two "Properties" have same column and
	// lag number then those two "Properties" are originated from
	// the same Term, then the new exponent should be the sum of
	// those two's.
	// Otherwise those "Properties"s should appear in the new Term
	// object's Property array.

	// First collect all the Property array from both operands
	max = countProperty();
	for (idx = 0; idx < max; idx++) {
		newTerm.addProperty(getProperty(idx));
	}

	max = rhs.countProperty();
	for (idx = 0; idx < max; idx++) {
		newTerm.addProperty(rhs.getProperty(idx));
	}

	// then consolidate the Property array.
	int targetIdx;
	Property baseProp, targetProp;

	// **** NOTE: tmp.countProperty() may dynamically change ****
	for (idx = 0; idx < newTerm.countProperty(); idx++) {
		baseProp = newTerm.getProperty(idx);

		if (baseProp.exp() == 0 && newTerm.countProperty() > 1) {
			// remove exp == 0 property for non-constant term
			newTerm.delProperty(idx);
			break;
		}

		for (targetIdx = idx + 1; targetIdx < newTerm.countProperty();
		targetIdx++) {
			targetProp = newTerm.getProperty(targetIdx);

			if (baseProp.col() == targetProp.col()
			&& baseProp.lag() == targetProp.lag()) {
				break;
			}
		}

		if (targetIdx < newTerm.countProperty()) {
			// found the same col and lag, update exp on baseProp
			baseProp.exp(baseProp.exp() + targetProp.exp());

			// remove the target property, will decrement count
			newTerm.delProperty(targetIdx);

			newTerm.updateProperty(idx, baseProp);
		}
	}

	// calculate the data part
	// the two operands suppose to have same data count
	max = MIN(countData(), rhs.countData());
	for (idx = 0; idx < max; idx++) {
		newTerm.addData(getData(idx) * rhs.getData(idx));
	}

	newTerm.fixStatistics();

	return newTerm;
}

BooleanT
Term::operator == (const Term& rhs) const
{
	Trace t("Term::==()", TRACE_ID);

	if (this == &rhs)
		return YES;

	if (countData() != rhs.countData()
	|| countProperty() != rhs.countProperty()
	|| status() != rhs.status()) {
		return NO;
	}

	int i, j, max;
	max = countData();
	for (i = 0; i < max; i++) {
		if (getData(i) != rhs.getData(i)) {
			return NO;
		}
	}

	// property array could be mismatched
	max = countProperty();
	for (i = 0; i < max; i++) {
		for (j = 0; j < max; j++) {
			if (getProperty(i) == rhs.getProperty(j)) {
				break;
			}
		}

		if (j == max) {
			// this property is not found on rhs
			return NO;
		}
	}

	// Ignore comparing mean and standard deviation and etc.
	return YES;
}

void
Term::printData(ostream& strm) const
{
	int idx, max;

	max = countData();
	strm << "\tdata:\t" << resetiosflags(ios::showpoint | ios::fixed);
	for (idx = 0; idx < max; idx++)
		strm << "[" << getData(idx) << "] ";

	strm << endl;
}

void
Term::printProperty(ostream& strm) const
{
	int idx, max;

	max = countProperty();
	for (idx = 0; idx < max; idx++) {
		getProperty(idx).printOn(strm);
	}
}

void
Term::printStatus(ostream& strm) const
{
	strm << "\tstatus:\t" << (status() == VALID ? "VALID" : "INVALID")
		<< endl;
}

void
Term::printPosition(ostream& strm) const
{
	strm << "\tPosition:\t" << (position() == NUMERATOR ? "N" : "D")
		<< endl;
}

void
Term::printOn(ostream& strm) const
{
	strm << "\t--- term ---" << endl;
	printProperty(strm);
	printPosition(strm);

	printData(strm);

#ifdef	NOTDEF
	printStatus(strm);
#endif	NOTDEF
}

int
matherr (struct exception *a)
{
	cerr << "Math Error Handler" << endl;
	cerr << a->name << "(" << a->arg1 << ", " << a->arg2 << ")" << endl;

	return 1;
}
