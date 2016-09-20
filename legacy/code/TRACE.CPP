#include <sys/types.h>
#include <stdlib.h>
#include "Trace.h"

unsigned 	Trace::_Layer	= 0;
unsigned 	Trace::_Flags	= T_NONE;
Trace::SwitchT	Trace::_Switch	= Trace::ON;
ofstream	Trace::_Ofile;
ofstream	Trace::_Drain;
ifstream	Trace::_Ifile;

Trace::Trace(const char *func, const char *file, int lineNum, unsigned flags) :
	_pFunc(func), _pFile(file), _lineNum(lineNum)
{
	printOn(INCR, flags);
}

Trace::~Trace()
{
	printOn(DECR, T_IO);
}

///////////////////////////////////////////////////////////////////////
//	Read in the configuration data from the file pointed by
//	environment variable "TRACE_IN"
///////////////////////////////////////////////////////////////////////
void
Trace::init()
{
	// get trace level configuration file name
	char *infile = getenv("TRACE_IN");

	if (infile != NULL) {
		_Ifile.open(infile);

		if (!_Ifile) {
			cerr << "Cannot open " << infile << " to read" << endl;
#ifdef	UNIX
			free (infile);
#endif	UNIX
			return;
		}

		// sucessfully opened trace level configuration file
#ifdef	UNIX
		free(infile);
#endif	UNIX
		_Flags = T_NONE;	// turn off all the trace level

		int level;
		while (_Ifile >> level) {
			switch (level) {
			case L_IO:
				_Flags |= T_IO;
				break;
			case L_DEBUG:
				_Flags |= T_DEBUG;
				break;
			case L_INTEREST:
				_Flags |= T_INTEREST;
				break;
			default:
				break;
			}
		}

		_Ifile.close();
	}
#ifdef	NOTDEF
		cout << "Trace flag " << _Flags << endl;
#endif	NOTDEF

	// get trace output file name, may add pid extension
	char *outfile = getenv("TRACE_OUT");
	if (outfile != NULL) {
		if ((_Ofile.rdbuf())->is_open()) {
			// output file has been opened already. Close it then
			// open the new output file in APPEND mode, because
			// the new output file may have different name.
			_Ofile.close();
			_Ofile.open(outfile, ios::out | ios::app);
		} else {
			// open a file for write
			_Ofile.open(outfile);
		}

		if (!_Ofile) {
			cerr << "Cannot open " << outfile << " to write"
				<< endl;
#ifdef	UNIX
			free(outfile);
#endif	UNIX

			// Cannot write to output file, so turn off all the
			// flags
			_Flags = T_NONE;

			return;
		}

#ifdef	UNIX
		free(outfile);
#endif	UNIX
		_Ofile << "***** Trace flag is " << _Flags << endl;

		// also open a drain device "/dev/null" in UNIX
		// in PC, the open will fail but who cares since we don't
		// really need the output (The alternative in DOS is use
		// "NUL" as a device but it won't work with Windows).
		_Drain.open("/dev/null");
	} else {
		// no any outfile specified, turn off trace flags
		_Flags = T_NONE;
	}
}

//////////////////////////////////////////////////////////////////
//	Temporarily disable all the trace output until the
//	switchOn() called.
//	NOTE: It does not change the original trace flags
//////////////////////////////////////////////////////////////////
void
Trace::switchOff(const char *pFile, int lineNum)
{
	_Switch = OFF;

	if (pFile) {
		// log in trace output file
		_Ofile << "*** Trace was turned OFF at " << pFile << "("
			<< lineNum << ") ***" << endl;
	}
}

//////////////////////////////////////////////////////////////////
//	Resume the previous trace level setting
//////////////////////////////////////////////////////////////////
void
Trace::switchOn(const char *pFile, int lineNum)
{
	_Switch = ON;

	if (pFile) {
		// log in trace output file
		_Ofile << "*** Trace was turned ON at " << pFile << "("
			<< lineNum << ") ***" << endl;
	}
}

/////////////////////////////////////////////////////////////////////
//	Allow to reset the trace flags to certain levels from
//	program. The newType is an ORed flags.
/////////////////////////////////////////////////////////////////////
void
Trace::setFlags(unsigned newFlags)
{
	_Flags = newFlags;
}

ofstream&
Trace::out(unsigned flags)
{
	if (_Switch == ON && (flags & _Flags) != T_NONE) {
		// This type of trace is printable
		printOn(NO_CHANGE, flags);
		return _Ofile;		// to be streamable
	} else {
		return _Drain;		// to be streamable
	}
}

void
Trace::printOn(Delta delta, unsigned flags) const
{
	if (_Switch == OFF || (flags & _Flags) == T_NONE) {
		// this type of trace info is not configured as printable
		return;
	}

	if (delta < 0 && _Layer > 0) {
		_Layer--;	// decrement the layer depth
	}

	unsigned i;
	for (i = 0; i < _Layer; i++) {
		_Ofile << ". ";
	}

	switch (delta) {
	case INCR:
		_Ofile << "> " << _pFunc;
		if (_pFile) {
			_Ofile << " " << _pFile << "(" << _lineNum << ")";
		}

		_Ofile << endl << flush;
		_Layer++;
		break;
	case DECR:
		_Ofile << "< " << _pFunc << endl << flush;
		break;
	case NO_CHANGE:
		break;
	}
}
