#ifndef	__MYDEFS_H
#define	__MYDEFS_H

enum BooleanT {NO = 0, YES};
enum StatusT {INVALID = 0x0000, VALID = 0x0001};

const int	BUF_SIZE = 512;

const int	EXT_UPPER = 3;		// initial array upper bound
const int	EXT_DELTA = 20;		// array delta (increment) number
const int	FIX_UPPER = 10;		// initial array upper bound for candidates

typedef	short	ColT;		// column position
typedef	short	LagT;		// lag
typedef	float	ExpT;		// exponent
typedef	float	DataT;		// data type
typedef	float	ElemT;		// element type

#endif	__MYDEFS_H
