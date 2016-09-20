#include <iostream.h>
#include "MyArray.h"
#include "CanTerm.h"

class A {
public:
	A();
	~A();
	void	addProperty(const Property& prop) {_pProperty->add(prop);}
	const Property& getProperty(int idx) {return (*_pProperty)[idx];}
	int		countProperty() {return _pProperty->count();}
	void	delFirstNProp(int number) {_pProperty->delFirstN(number);}
	void	delLastNProp(int number) {_pProperty->delLastN(number);}
	void	printPropConfig() const;
private:
	PropArrayT *_pProperty;
};

A::A()
{
	_pProperty = new PropArrayT(1, 2);
};

A::~A()
{
	delete _pProperty;
}

void
A::printPropConfig() const
{
	cerr << "upper=" << _pProperty->getUpper() << " delta = "
		<< _pProperty->getDelta() << " count = " << _pProperty->count()
		<< endl;
}

main()
{
#ifdef	NOTDEF
	A a;
	int i;
	Property property;

	a.printPropConfig();

	for (i = 0; i < 8; i++) {
		property.col(i);
		a.addProperty(property);
	}
	a.printPropConfig();

	for (i = 0; i < a.countProperty(); i++) {
		a.getProperty(i).printOn();
	}
	cerr << endl;

	a.delFirstNProp(2);
	for (i = 0; i < a.countProperty(); i++) {
		a.getProperty(i).printOn();
	}
	cerr << endl;

	a.delLastNProp(3);
	for (i = 0; i < a.countProperty(); i++) {
		a.getProperty(i).printOn();
	}
	cerr << endl;

	a.printPropConfig();
#endif	NOTDEF
///////////////////////////////////////////////
	Term aTerm;
	Property prop;

	aTerm.addData(1);
	aTerm.addData(2);
	aTerm.addData(3);

	prop.col(1);
	prop.lag(1);
	aTerm.addProperty(prop);

	prop.col(2);
	prop.lag(2);
	aTerm.addProperty(prop);

	ModelTerm aModelTerm(aTerm);
	aModelTerm.coeff(2.1);
	aModelTerm.TStatis(8);

	ModelStat aModelStat;
	aModelStat.SSE(4);
	aModelStat.MSE(5);

	CanTerm aCanTerm(aModelTerm);
	aCanTerm.modelStat(aModelStat);

	CanTerm bCanTerm(aCanTerm);

	aCanTerm.delData(1);
	aCanTerm.delProperty(1);

	aCanTerm.printOn();
	bCanTerm.printOn();

	return 0;
}
