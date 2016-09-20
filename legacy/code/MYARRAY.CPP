#include "MyArray.h"

//////////  This file is required for C++ version prior to 4.0 ///////////////

#ifndef	CPP40

template <class T>
MyArray<T>::MyArray(int upper, int delta)
{
	if (upper < 0 || delta < 0) {
		cerr << "MyArray::MyArray() with negative argument" << endl;
		abort();
	}

	if (upper == 0) {
		_pData = 0;
	} else {
		_pData = new T[upper];
	}

	_upper	= upper;
	_count	= 0;
	_delta	= delta;
}

template <class T>
MyArray<T>::~MyArray()
{
	if (_pData != 0)
		delete [] _pData;
}

template <class T> void
MyArray<T>::add(const T& t)
{
	if (_count == _upper) {
		// the array is filled
		if (_delta == 0) {
			// not allowed to extend
			cerr << "Error: MyArray::Add() with delta = 0" << endl;
			abort();
		}

		// need to extend the array size
		_upper += _delta;
		T *tmp = new T[_upper];

		if (_pData != 0) {	// copy the old array to new array
			for (int i = 0; i < _count; i++) {
				tmp[i] = _pData[i];
			}

			delete [] _pData;	// remove the old array
		}

		_pData = tmp;	// assign the new array to _pData

	}

	_pData[_count] = t;	// append the new element
	_count++;		// increment the count of active elements
}

// ************************************************************************
//	idx should be < _count.  However, if idx >= _count, the new element
//	will only be appended to the array regardless the requested idx.
//	i.e. no holes will be created in between.
// ************************************************************************
template <class T> void
MyArray<T>::insertBefore(int idx, const T& t)
{
	if (idx < 0) {
		cerr << "MyArray::insertBefore() out of range > idx = "
			<< idx << endl;
		abort();
	}

	if (idx >= _count) {
		add(t);
	} else {
		// duplicating the last element by adding it to the end of array
		add(_pData[_count - 1]);

		// after add() _count was incremented by 1. shifting some
		// elements back to have a space to the new element.
		for (int i = _count - 2; i > idx; i--) {
			_pData[i] = _pData[i - 1];
		}

		_pData[idx] = t;
	}
}

template <class T> void
MyArray<T>::del(int idx)
{
	delFromTo(idx, idx);
}

template <class T> void
MyArray<T>::delFirstN(int number)
{
	delFromTo(0, number - 1);
}

template <class T> void
MyArray<T>::delLastN(int number)
{
	delFromTo(_count - number, _count - 1);
}

//////////////////////////////////////////////////////////
//	Delete the elements of indices between "from" and
//	"to" inclusiveily.
//////////////////////////////////////////////////////////
template <class T> void
MyArray<T>::delFromTo(int from, int to)
{
	if (from < 0 || to >= _count) {
		cerr << "MyArray::delFromTo() out of range [" << from << ", "
			<< to << "] count = " << _count << endl;
		abort();
	}

	int total, targetIdx, sourceIdx;

	total = to - from + 1;	// inclusive
	if (total <= 0) {
		// don't bother
		return;
	}

	for (targetIdx = from, sourceIdx = to + 1; sourceIdx < _count;
	targetIdx++, sourceIdx++) {
		_pData[targetIdx] = _pData[sourceIdx];
	}

	_count -= total;
}

template <class T> void
MyArray<T>::flush()
{
	// remove all the data
	if (_pData != 0) {
		delete [] _pData;
		_pData = 0;

		_upper = _count = 0;
	}
}

template <class T> T&
MyArray<T>::operator [] (int idx)
{
	if (idx < 0 || idx >= _count) {
		cerr << "MyArray::operator [] out of range > idx = " << idx
			<< " vector count = " << _count << endl;
		abort();
	}

	return _pData[idx];
}

template <class T> const T&
MyArray<T>::operator [] (int idx) const
{
	if (idx < 0 || idx >= _count) {
		cerr << "MyArray::operator [] out of range > idx = " << idx
			<< " vector count = " << _count << endl;
		abort();
	}

	return _pData[idx];
}

template <class T>
int
MyArray<T>::getUpper() const
{
	return _upper;
}

template <class T>
int
MyArray<T>::getDelta() const
{
	return _delta;
}

template <class T>
int
MyArray<T>::count() const
{
	return _count;
}
#endif	CPP40
