#ifndef	__TRACE_H
#define	__TRACE_H

#include <iostream.h>
#include <fstream.h>

////////////////////////////////////////////////////////////
//	Use TRACE_ID macro in trace function arguments
//	wherever "const char *file, int lineNum" appears
//	to generate the calling file name and line number.
////////////////////////////////////////////////////////////
#define	TRACE_ID	__FILE__, __LINE__

#define	T_NONE			(unsigned) 0x0000
#define	T_IO			(unsigned) 0x0001
#define	T_DEBUG			(unsigned) 0x0002
#define	T_INTEREST		(unsigned) 0x0004
#define	T_ALL			(unsigned) 0xFFFF

class Trace {
public:
	enum SwitchT {OFF = 0, ON};
	enum {L_IO = 1, L_DEBUG, L_INTEREST};	// valid trace level

	Trace(const char *func, const char *file = 0, int lineNum = 0,
		unsigned type = T_IO);
	~Trace();

	static void	init();
	static void	switchOn(const char *file = 0, int lineNum = 0);
			// turn on the trace function
	static void	switchOff(const char *file = 0, int lineNum = 0);
			// temporarily turn off the trace function

	void		setFlags(unsigned flags);
	ofstream&	out(unsigned type = T_NONE);

private:
	enum Delta {DECR = -1, NO_CHANGE, INCR};

	static unsigned _Layer;		// number of layer deep
	static unsigned _Flags;		// current trace level
	static SwitchT	_Switch;	// override switch
	static ofstream _Ofile;		// output file
	static ofstream _Drain;		// output drain
	static ifstream _Ifile;		// input file

	const char	*_pFunc;	// pointer to function name
	const char	*_pFile;	// pointer to file name
	int		_lineNum;

	void	printOn(Delta delta, unsigned type) const;
};

#endif	__TRACE_H
