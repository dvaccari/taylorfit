#include <iostream.h>
#include <iomanip.h>
#include <stdio.h>
#include "Ui.h"
#ifdef	PC
#	include <conio.h>
#	include <dos.h>
#	include <strstrea.h>
#else	// UNIX
#	include <strstream.h>
#	include <time.h>
#endif	PC

#ifdef	__BORLANDC__
#	include <cstring.h>
#endif

#ifdef	ATT_STL
#	include <String.h>
#endif

extern "C" {
#ifdef	PC
	void clrscr();
#endif	PC
};

char Buffer[BUF_SIZE];	// i/o line buffer

///////////////////// print format ///////////////////////////
ostream& coeffFmt(ostream& strm)
{
	return strm << setiosflags(ios::showpoint)
		<< setiosflags(ios::scientific)
		<< setw(12)
		<< setprecision(4);
}

ostream& tStatFmt(ostream& strm)
{
	return strm << setiosflags(ios::showpoint)
		<< setiosflags(ios::fixed)
		<< setw(8)
		<< setprecision(2);
}

ostream& sseFmt(ostream& strm)
{
	return strm << setiosflags(ios::showpoint)
		<< setiosflags(ios::fixed)
		<< setw(11)
		<< setprecision(3);
}

ostream& rSquareFmt(ostream& strm)
{
	return strm << setiosflags(ios::showpoint)
		<< setiosflags(ios::fixed)
		<< setw(10)
		<< setprecision(3);
}

ostream& fStatFmt(ostream& strm)
{
	return strm << setiosflags(ios::showpoint)
		<< setiosflags(ios::fixed)
		<< setw(8)
		<< setprecision(1);
}

ostream& mseFmt(ostream& strm)
{
	return strm << setiosflags(ios::showpoint)
		<< setiosflags(ios::fixed)
		<< setw(10)
		<< setprecision(3);
}

ostream& aicFmt(ostream& strm)
{
	return strm << setiosflags(ios::showpoint)
		<< setiosflags(ios::fixed)
		<< setw(10)
		<< setprecision(3);
}

ostream& bicFmt(ostream& strm)
{
	return strm << setiosflags(ios::showpoint)
		<< setiosflags(ios::fixed)
		<< setw(10)
		<< setprecision(3);
}

ostream& dataFmt(ostream& strm)
{
	return strm << setiosflags(ios::showpoint)
		<< setiosflags(ios::scientific)
		<< setw(10)
		<< setprecision(2);
}

///////////////////// print format ///////////////////////////


Ui::Ui()
{
	_versionNum[0]		= '\0';
	_dataFile[0]		= '\0';
	_dataBeginRow		= 0;
	_dataEndRow		= 0;
	_testFile[0]		= '\0';
	_testBeginRow		= 0;
	_testEndRow		= 0;
	_modelInFile[0]		= '\0';
	_modelOutFile[0]	= '\0';
	_mode			= MANUAL;
	_modelModified		= NO;
	_rational		= NO;
}

Ui::~Ui()
{}

///////////////////////////////////////////////////////////////////////////////
//	The init (project) file should contain initialization information
//	in following format:
//	NAME		VALUES			COMMENTS
//	======================================================================
//	VERSION		1.0
//	EXPONENTS	1 2 3			optional (default 1)
//	MULTIPLICANDS	1 2 3			optional (default 1)
//	LAGS		0 1 2			optional (default 0)
//	USE_LAGGED_DV	Y/N			optional (default N)
//	DATAFILE	fileName bRow eRow	mandatory (bRow & eRow are
//						optional, 0 0 are default value
//						    for all rows)
//	TESTFILE	fileName bRow eRow	optional (default same as
//						    DATAFILE)
//	DVCOL		1			optional (default 1)
//	MODEL_IN	fileName		optional (no default)
//	MODEL_OUT	fileName		optional (default DATAFILE
//						    with .pdf extension)
//	MODE		MANUAL			optional (AUTO/BATCH/MANUAL
//						    default MANUAL)
//	CRITERIA	1			optional (default 1)
//	RATIONAL	Y/N			optional (default N)
///////////////////////////////////////////////////////////////////////////////
BooleanT
Ui::readInitFile(const char *pInitFile)
{
	Trace t("Ui::readInitFile()", TRACE_ID);

	ifstream ifile;

	ifile.open(pInitFile);
	if (!ifile) {
		cerr << "Cannot open " << pInitFile << endl;
		return NO;
	}

	int	i;
#ifdef	__BORLANDC__
	string str;
#endif
#ifdef	ATT_STL	// UNIX AT&T standard component library
	String str;
#endif

	// get all the arguments from initialization file
	while (ifile.getline(Buffer, BUF_SIZE)) {
		strcat(Buffer, "\n");	// append a new line char
		istrstream instr(Buffer, strlen(Buffer));

		instr >> str;	// get the argument field name

		if (str == "VERSION") {
			instr >> _versionNum;
		} else if (str == "EXPONENTS") {
			// default is 1
			instr.get(Buffer, BUF_SIZE);	// copy reset to buf
			_powerFit.readExps(Buffer);
		} else if (str == "MULTIPLICANDS") {
			// default is 1
			instr.get(Buffer, BUF_SIZE);	// copy reset to buf
			_powerFit.readMultis(Buffer);
		} else if (str == "LAGS") {
			// default is 0
			instr.get(Buffer, BUF_SIZE);	// copy reset to buf
			_powerFit.readLags(Buffer);
		} else if (str == "USE_LAGGED_DV") {
			// default is NO
			instr >> Buffer;
			if (Buffer[0] == 'Y' || Buffer[0] == 'y') {
				_powerFit.laggedDepPartOfIndep(YES);
			} else {
				_powerFit.laggedDepPartOfIndep(NO);
			}
		} else if (str == "DATAFILE") {
			instr >> _dataFile >> _dataBeginRow >> _dataEndRow;
		} else if (str == "TESTFILE") {
			instr >> _testFile >> _testBeginRow >> _testEndRow;
		} else if (str == "DVCOL") {
			// the number of the column with dependant variable
			// user uses column # from 1 to n.
			// only read next one field

			instr >> i;
			_powerFit.depVarCol(i);
		} else if (str == "MODEL_IN") {
			// starting model (pfm) file
			instr >> _modelInFile;
		} else if (str == "MODEL_OUT") {
			// output model file (pfm).  If missing, the default
			// will be the DATAFILE name with .pfm extension
			instr >> _modelOutFile;
		} else if (str == "MODE") {
			// either Auto, manual, or batch
			instr >> str;
			if (str == "AUTO" || str == "auto") {
				_mode = AUTO;
				_powerFit.mode(PowerFit::AUTO);
			} else if (str == "BATCH" || str == "batch") {
				_mode = BATCH;
				_powerFit.mode(PowerFit::AUTO);
			} else { // default
				_mode = MANUAL;
				_powerFit.mode(PowerFit::MANUAL);
			}
		} else if (str == "MODEL") {
			instr >> str;
			if (str == "NE" || str == "ne") {
				_powerFit.modelType(PowerFit::NORMAL_EQ);
			} else {	// default
				_powerFit.modelType(PowerFit::SVD);
			}
		} else if (str == "CRITERIA") {
			instr >> i;
			if (i < PowerFit::BEST_T_STAT
			|| i > PowerFit::T_AND_MSE) {
				cerr << "Invalid criteria value: " << i << endl;
				return NO;
			} else {
				_powerFit.criteria((PowerFit::CritT)i);
			}
		} else if (str == "RATIONAL") {
			// NOT IMPLEMENTED YET
			// only read next field
			while (instr >> Buffer) {
				if (Buffer[0] == 'Y' || Buffer[0] == 'y') {
					_rational = YES;
				}
				break;
			}
		}
	}	// while getline

	printOn(t.out(T_DEBUG));

	// validating all the required fields
	if (strlen(_dataFile) == 0) {
		cerr << "Missing DATAFILE in " << pInitFile << endl;
		return NO;
	}

	if (_dataBeginRow < 0 || _dataEndRow < _dataBeginRow
	|| (_dataBeginRow == 0 && _dataEndRow != 0)) {
		cerr << _dataFile << ": invalid start and end row number: "
			<< _dataBeginRow << " " << _dataEndRow << endl;
		return NO;
	}

	if (strlen(_testFile) == 0) {
		// test data wasn't specified; using data file as test file
		strcpy(_testFile, _dataFile);

		_testBeginRow	= _dataBeginRow;
		_testEndRow	= _dataEndRow;
	}

	if (_testBeginRow < 0 || _testEndRow < _testBeginRow
	|| (_testBeginRow == 0 && _testEndRow != 0)) {
		cerr << _testFile << ": invalid start and end row number: "
			<< _testBeginRow << " " << _testEndRow << endl;
		return NO;
	}

	//	powerFit uses index starting from 0
	if (_powerFit.depVarCol() < 1) {
		cerr << "invalid dependent variable column number: "
			<< _powerFit.depVarCol() << endl;
		return NO;
	}

	if (strlen(_modelOutFile) == 0) {
		// the file name does not exist in init file
		// need to set to default file name
		setDefaultModelOutFile();
	}

	return YES;
}

void
Ui::setDefaultModelOutFile()
{
	strcpy(_modelOutFile, _dataFile);
	strtok(_modelOutFile, ".");
	strcat(_modelOutFile, ".pfm");
}

////////////////////////////////////////////////////////////////////////////
//	This function reads data from file one row at a time and
//	figures out the number of column.
////////////////////////////////////////////////////////////////////////////
BooleanT
Ui::readFittingData()
{
	Trace t("Ui::readFittingData()", TRACE_ID);

	ifstream ifile(_dataFile);

	if (!ifile) {
		cerr << "Cannot open [" << _dataFile << "]" << endl;
		return NO;
	}

	int rowNum = 0;
	_powerFit.flushFittingData();
	while (ifile.getline(Buffer, BUF_SIZE)) {
		rowNum++;	// current row number
		if ((_dataBeginRow == 0 && _dataEndRow == 0)	// read all
		|| (_dataBeginRow <= rowNum && rowNum <= _dataEndRow)) {
			// within the range
			_powerFit.readFittingData(Buffer);
		} else if (rowNum > _dataEndRow) {	// out of range
			break;
		}

		cout << rowNum << '\r' << flush;
	}

	ifile.close();

	if (_powerFit.depVarCol() > _powerFit.countFittingTerms()) {
		cerr << "invalid dependent variable column number: "
			<< _powerFit.depVarCol() << endl;
		return NO;
	}

#ifdef	UNIT_TEST
	int i;
	for (i = 0; i < _powerFit.countFittingTerms(); i++) {
		_powerFit.getFittingTerm(i).printOn(t.out(T_DEBUG));
	}
#endif	UNIT_TEST

	return YES;
}

////////////////////////////////////////////////////////////////////////////
//	This function reads data from file one row at a time and
//	figures out the number of column.
////////////////////////////////////////////////////////////////////////////
BooleanT
Ui::readTestData()
{
	Trace t("Ui::readTestData()", TRACE_ID);

	ifstream ifile(_testFile);

	if (!ifile) {
		cerr << "Cannot open [" << _testFile << "]" << endl;
		return NO;
	}

	int rowNum = 0;
	_powerFit.flushTestData();
	while (ifile.getline(Buffer, BUF_SIZE)) {
		rowNum++;	// current row number
		if ((_testBeginRow == 0 && _testEndRow == 0)	// read all
		|| (_testBeginRow <= rowNum && rowNum <= _testEndRow)) {
			// within the range
			_powerFit.readTestData(Buffer);
		} else if (rowNum > _testEndRow) {	// out of range
			break;
		}

		cout << rowNum << '\r' << flush;
	}

	ifile.close();

	if (_powerFit.countFittingTerms() != _powerFit.countTestTerms()) {
		cerr << "number of columns between " << _dataFile << " and "
			<< _testFile << " are different" << endl;
		return NO;
	}

	return YES;
}

void
Ui::run()
{
	// whether need to init again ? ? ?
	_powerFit.init();

	switch (_mode) {
	case MANUAL:
	case AUTO:
		if (_modelInFile[0] != '\0') {
			// need to open modelInFile and do the quickFit
			if (readModelFile() == YES) {
				_powerFit.quickFit();
				listModel(cout, YES);
				backUp();
			}
		}

		mainMenu();
		break;
	case BATCH:
		fit();
		saveModel();
		break;
	}
}

void
Ui::mainMenu()
{
	int ans;

	while (1) {
		do {
			cout << "PowerFit Main Menu: 0-Quit 1-Method 2-Fit "
				<< "3-File 4-View: ";
			cin >> ans;
			cin.getline(Buffer, BUF_SIZE); // flush cin's buffer
			clearScreen();
		} while (ans < MAIN_QUIT || ans > MAIN_VIEW);

		switch (ans) {
		case MAIN_QUIT:
			if (_modelModified == YES) {
				clearScreen();
				cout << "Save model into " << _modelOutFile
					<< " before exit (Yes/No/Cancel "
					<< "default YES)? ";
				cin.getline(Buffer, BUF_SIZE);
				switch (Buffer[0]) {
				case 'C':
				case 'c':
					clearScreen();
					break;
				case 'Y':
				case 'y':
				case '\0':
					saveModel();
				case 'N':
				case 'n':
				default:
					return;
				}
			} else {
				return;
			}

			break;
		case MAIN_METHOD:
			methodMenu();
			break;
		case MAIN_FIT:
			fitMenu();
			break;
		case MAIN_FILE:
			fileMenu();
			break;
		case MAIN_VIEW:
			listModel(cout, YES);
			break;
		}
	}
}

void
Ui::clearScreen()
{
#ifdef	PC
	clrscr();
#else	// UNIX command
	system("clear");
#endif
}

void
Ui::coverPage()
{
	clearScreen();
	cout << endl << endl<< endl << endl << endl;
	cout << "\t\t\t\tP O W E R F I T (TM)" << endl;
	cout << "\t\t\t   Multiple Polynomial Regression" << endl << endl;
	cout << "\t\t\t\tVersion 1.0" << endl << endl << endl;
	cout << "\t\t\t\tDavid Vaccari" << endl << "\t\t\t\tSteve Wang" << endl;
	cout << endl;
	cout << "\t\t\t\tStevens Institute of Technology" << endl;
	cout << "\t\t\t\tHoboken, New Jersey" << endl;

	cout << endl << endl << endl << "Hit <Enter> to start";

	getc(stdin);
	fflush(stdin);
	clearScreen();
}
	
void
Ui::methodMenu()
{
	int i, ans;

	while (1) {
		do {
			clearScreen();
			cout << "METHOD:" << endl;
			cout << "\t" << METHOD_PRE	<< "-Previous Menu"
				<< endl;
			cout << "\t" << METHOD_EXP	<< "-Exponents"
				<< endl;
			cout << "\t" << METHOD_LAG	<< "-Lag" << endl;
			cout << "\t" << METHOD_MULTIPLIERS
				<< "-Multipliers" << endl;
			cout << "\t" << METHOD_NORMALIZE
				<< "-Normalization" << endl;
			cout << "\t" << METHOD_TOLERANCE << "-Tolerance"
				<< endl;
			cout << "\t" << METHOD_MULTI_INCLD_DEP
				<< "-Multiplier Including Dependent Term"
				<< endl;
			cout << "Choice: ";

			cin >> ans;
		} while (ans < METHOD_PRE || ans > METHOD_MULTI_INCLD_DEP);

		clearScreen();
		cin.getline(Buffer, BUF_SIZE);	// flush cin's buffer

		switch (ans) {
		case METHOD_PRE:
			return;
		case METHOD_EXP:
			cout << "Current exponents: ";
			for (i = 0; i < _powerFit.countExps(); i++) {
				cout << _powerFit.getExp(i) << " ";
			}
			cout << endl << "Enter new exponents (or \"Enter\" key "
				<< "remain unchange):" << endl;

			cin.getline(Buffer, BUF_SIZE);
			// null terminated no '\n'

			if (Buffer[0] != '\0') {
				_powerFit.readExps(Buffer);
			}
			break;
		case METHOD_LAG:
			cout << "Current lags: ";
			for (i = 0; i < _powerFit.countLags(); i++) {
				cout << _powerFit.getLag(i) << " ";
			}
			cout << endl << "Enter new lags (or \"Enter\" key "
				<< "remain unchange):" << endl;

			cin.getline(Buffer, BUF_SIZE);
			// null terminated no '\n'

			if (Buffer[0] != '\0') {
				_powerFit.readLags(Buffer);
			}
			break;
		case METHOD_MULTIPLIERS:
			cout << "Current multipliers: ";
			for (i = 0; i < _powerFit.countMultis(); i++) {
				cout << _powerFit.getMulti(i) << " ";
			}
			cout << endl << "Enter new multipliers (or \"Enter\" "
				<< "key remain unchange):" << endl;

			cin.getline(Buffer, BUF_SIZE);
			// null terminated no '\n'

			if (Buffer[0] != '\0') {
				_powerFit.readMultis(Buffer);
			}
			break;
		case METHOD_NORMALIZE:
			cout << "Current SVD normalization is "
				<< (_powerFit.svdNormalized()==YES ?
				"Yes" : "No") << endl
				<< "(Y/N, or \"Enter\" key remain unchange)? "
				<< endl;
			cin.getline(Buffer, BUF_SIZE);

			if (Buffer[0] == 'Y' || Buffer[0] == 'y') {
				_powerFit.svdNormalized(YES);
			} else if (Buffer[0] == 'N' || Buffer[0] == 'n') {
				_powerFit.svdNormalized(NO);
			}
			// unchange for any other answer
	
			break;
		case METHOD_TOLERANCE:
			cout << "Current SVD tolerance "
				<< _powerFit.svdTolerance() << endl
				<< "Recommanded value is "
				<< _powerFit.svdDefaultTolerance()
				<< ", or \"Enter\" key remain unchange: "
				<< endl;
			cin.getline(Buffer, BUF_SIZE);
			// null terminated string (new line removed)

			if (Buffer[0] != '\0') {
				_powerFit.svdTolerance(atof(Buffer));
			}
			// unchange for any other answer
	
			break;
		case METHOD_MULTI_INCLD_DEP:
			cout << "Current multiplier including dependent term: "
				<< (_powerFit.laggedDepPartOfIndep() == YES ?
				"YES" : "NO") << endl
				<< "(Y/N) or \"Enter\" key remain unchange: "
				<< endl;
			cin.getline(Buffer, BUF_SIZE);

			if (Buffer[0] == 'Y' || Buffer[0] == 'y') {
				_powerFit.laggedDepPartOfIndep(YES);
			} else if (Buffer[0] == 'N' || Buffer[0] == 'n') {
				_powerFit.laggedDepPartOfIndep(NO);
			}
			// unchange for any other answer
	
			break;
		}
		clearScreen();
	}
}

void
Ui::fitMenu()
{
	int ans;

	while (1) {
		do {
			clearScreen();
			cout << "FIT:    Current selection is ";
			if (_mode == MANUAL) {
				cout << "Manual";
			} else if (_mode == AUTO) {
				cout << "Auto";
			} else {
				cout << "Batch";
			}

			cout << " mode, ";
			if (_powerFit.criteria() == PowerFit::BEST_T_STAT) {
				cout << "Best T Statistics";
			} else if (_powerFit.criteria()==PowerFit::MAX_F_STAT) {
				cout << "Max. F Statistics";
			} else if (_powerFit.criteria() == PowerFit::MIN_MSE) {
				cout << "Min. MSE";
			} else if (_powerFit.criteria() == PowerFit::MIN_AIC) {
				cout << "Min. AIC";
			} else if (_powerFit.criteria() == PowerFit::MIN_BIC) {
				cout << "Min. BIC";
			} else if (_powerFit.criteria() == PowerFit::T_AND_F) {
				cout << "Best T Statistics and F Statistics";
			} else if (_powerFit.criteria()==PowerFit::T_AND_MSE) {
				cout << "Best T Statistics and Min. MSE";
			}
			cout << " criteria" << endl;

			cout << "\t" << FIT_PRE		<< "-Previous Menu"
				<< endl;
			cout << "\t" << FIT_FIT		<< "-Fit" << endl;
			cout << "\t" << FIT_MANUAL	<< "-Manual Mode"
				<< endl;
			cout << "\t" << FIT_AUTO	<< "-Auto Mode" << endl;
			cout << "Choice: ";

			cin >> ans;
			cin.getline(Buffer, BUF_SIZE);	// flush cin's buffer
		} while (ans < FIT_PRE || ans > FIT_AUTO);
		clearScreen();

		switch (ans) {
		case FIT_PRE:
			return;
		case FIT_FIT:
			fit();
			return;
		case FIT_MANUAL:
			fitManualSubMenu();
			break;
		case FIT_AUTO:
			fitAutoSubMenu();
			break;
		}
	}
}

void
Ui::fitManualSubMenu()
{
	int ans;

	do {
		clearScreen();
		cout << "FIT - MANUAL:" << endl;
		cout << "\t" << FIT_PRE			<< "-Previous Menu"
			<< endl;
		cout << "\t" << PowerFit::BEST_T_STAT	<< "-Best T Statistics"
			<< endl;
		cout << "\t" << PowerFit::MAX_F_STAT	<< "-Max. F Statistics"
			<< endl;
		cout << "\t" << PowerFit::MIN_MSE	<< "-Min. MSE" << endl;
		cout << "\t" << PowerFit::MIN_AIC	<< "-Min. AIC" << endl;
		cout << "\t" << PowerFit::MIN_BIC	<< "-Min. BIC" << endl;
		cout << "Choice: ";
		
		cin >> ans;
		cin.getline(Buffer, BUF_SIZE);		// flush cin's buffer
	} while (ans < FIT_PRE || ans > PowerFit::MIN_BIC);

	clearScreen();

	switch (ans) {
	case FIT_PRE:
		break;
	default:
		_mode = MANUAL;
		_powerFit.mode(PowerFit::MANUAL);
		_powerFit.criteria((PowerFit::CritT) ans);
		break;
	}
}

void
Ui::fitAutoSubMenu()
{
	int ans;

	do {
		clearScreen();
		cout << "FIT - AUTO:" << endl;
		cout << "\t" << FIT_PRE			<< "-Previous Menu"
			<< endl;
		cout << "\t" << PowerFit::BEST_T_STAT	<< "-Best T Statistics"
			<< endl;
		cout << "\t" << PowerFit::MAX_F_STAT	<< "-Max. F Statistics"
			<< endl;
		cout << "\t" << PowerFit::MIN_MSE	<< "-Min. MSE" << endl;
		cout << "\t" << PowerFit::MIN_AIC	<< "-Min. AIC" << endl;
		cout << "\t" << PowerFit::MIN_BIC	<< "-Min. BIC" << endl;
		cout << "\t" << PowerFit::T_AND_F
			<< "-Best T Statistics and F Statistics" << endl;
		cout << "\t" << PowerFit::T_AND_MSE
			<< "-Best T Statistics and Min. MSE" << endl;
		cout << "Choice: ";
		
		cin >> ans;
	} while (ans < FIT_PRE || ans > PowerFit::T_AND_MSE);

	clearScreen();

	switch (ans) {
	case FIT_PRE:
		break;
	default:
		_mode = AUTO;
		_powerFit.mode(PowerFit::AUTO);
		_powerFit.criteria((PowerFit::CritT) ans);
		break;
	}
}

///////////////////////////////////////////////////////////////////////
//	Doing the real fitting
///////////////////////////////////////////////////////////////////////
void
Ui::fit()
{
	int i;

	switch (_mode) {
	case MANUAL:
		while (1) {
			_powerFit.fit();

			if (_powerFit.countInCanTerms() > 0) {
				listInCanTerms();

				// prompt to add a new term into model
				cout << "Select one term into the model"
					<< " (0 for not adding): ";

				cin >> i;
				cin.getline(Buffer, BUF_SIZE);	// flush buffer
				if (i > 0 && i <= _powerFit.countInCanTerms()) {
					_powerFit.addInCanTermToModel(i - 1);
					_modelModified = YES;
				}
			}

			while (_powerFit.countModelTerms()) {
				_powerFit.genModelForDeletion();
				listModel(cout, YES);

				// prompt to delete one term from model
				cout << "Select one term removed from model"
					<< " (0 for not removing): ";
				cin >> i;
				cin.getline(Buffer, BUF_SIZE);	// flush buffer

				if (i > 0
				&& i <= _powerFit.countModelTerms()) {
					_powerFit.delModelTerm(i - 1);
					_modelModified = YES;
				} else {
					break;
				}
			}

			backUp();

			// prompt to continue
			cout << "Do you want to continue (Y/N)? ";
			cin.getline(Buffer, BUF_SIZE);

			if (Buffer[0] != 'Y' && Buffer[0] != 'y') {
				break;
			}
		}

		break;
	case AUTO:
	case BATCH:
		while (1) {
			_powerFit.fit();
			listInCanTerms();

			if (_powerFit.autoAddInCanTermToModel() == NO) {
				// cannot add any term from InCanTerms
				// to model ==> stop Auto Fit
				break;
			} else {
				_modelModified = YES;
			}

			while (_powerFit.countModelTerms()) {
				_powerFit.genModelForDeletion();
				listModel();

				if (_powerFit.autoDelModelTerm() == NO) {
					// cannot auto delete a term from model
					// continue finding a term to add
					break;
				} else {
					_modelModified = YES;
				}
			}

			backUp();
		}

		break;
	}
}

void
Ui::fileMenu()
{
	int ans;

	do {
		cout << "FILE:" << endl;
		cout << "\t" << FILE_PRE	<< "-Previous Menu" << endl;
		cout << "\t" << FILE_READ_MODEL	<< "-Read Model (*.pfm) File"
			<< endl;
		cout << "\t" << FILE_READ_FIT_DATA
			<< "-Read Fitting Data File" << endl;
		cout << "\t" << FILE_READ_TEST_DATA
			<< "-Read Test Data File" << endl;
		cout << "\t" << FILE_SAVE_MODEL	<< "-Save Model File" << endl;
		cout << "\t" << FILE_SAVE_PREDICT
			<< "-Save Predictions" << endl;
		cout << "Choice: ";

		cin >> ans;
		cin.getline(Buffer, BUF_SIZE);		// flush cin's buffer
		clearScreen();
	} while (ans < FILE_PRE || ans > FILE_SAVE_PREDICT);

	switch (ans) {
	case FILE_PRE:
		break;
	case FILE_READ_MODEL:
		if (_modelModified == YES && qryModelOutFile() == YES) {
			saveModel();
		}

		if (_modelInFile[0] != '\0') {
			cout << "Input model file name (hit \"Enter\" for "
				<< _modelInFile << "): ";

			cin.getline(Buffer, BUF_SIZE);
			if (Buffer[0] != '\0') {
				// just entered a new modelInFile name
				strcpy(_modelInFile, Buffer);
			}
		} else {
			qryFileName(_modelInFile);
		}

		if (readModelFile() == YES) {
			// need to ask for method then do quickFit
			methodMenu();
			_powerFit.init();
			_powerFit.quickFit();
			listModel(cout, YES);
			backUp();
		}
		
		break;
	case FILE_READ_FIT_DATA:
		qryFileName(_dataFile);
		qryDataFileBeginEndRows();
		if (readFittingData() == YES) {
			// need to ask for method then do quickFit
			methodMenu();
			_powerFit.init();
			_powerFit.quickFit();
			listModel(cout, YES);
			backUp();
		}

		break;
	case FILE_READ_TEST_DATA:
		qryFileName(_testFile);
		qryTestFileBeginEndRows();
		if (readTestData() == YES) {
			// need to ask for method then do quickFit
			methodMenu();
			_powerFit.init();
			_powerFit.quickFit();
			listModel(cout, YES);
			backUp();
		}

		break;
	case FILE_SAVE_MODEL:
		if (qryModelOutFile() == YES) {
			saveModel();
		}

		break;
	case FILE_SAVE_PREDICT:
		savePredictionFile();

		break;
	}	// switch
}

void
Ui::qryFileName(char *fileName)
{
	while (1) {
		cout << "Enter file name: ";
		cin.getline(fileName, 128);

		if (fileName[0] != '\0') {
			break;
		}
	}
}

BooleanT
Ui::qryModelOutFile()
{
	clearScreen();
	cout << "Save model into " << _modelOutFile
		<< " (Y/N default YES or C to cancel)? ";
	cin.getline(Buffer, BUF_SIZE);

	if (Buffer[0] == 'N' || Buffer[0] == 'n') {
		qryFileName(_modelOutFile);
	} else if (Buffer[0] == 'C' || Buffer[0] == 'c') {
		return NO;
	}

	return YES;
}

void
Ui::savePredictionFile()
{
	char predFileName[50];

	strcpy(predFileName, _dataFile);
	strtok(predFileName, ".");
	strcat(predFileName, ".pfp");

	clearScreen();
	cout << "Save prediction into " << predFileName
		<< " (Y/N default YES or C to cancel)? ";
	cin.getline(Buffer, BUF_SIZE);

	if (Buffer[0] == 'N' || Buffer[0] == 'n') {
		qryFileName(predFileName);
	} else if (Buffer[0] == 'C' || Buffer[0] == 'c') {
		return;
	}

	ofstream predFile(predFileName);

	if (!predFile) {
		cout << "Unable to save prediction to " << predFileName
			<< endl;

		return;
	} 

	predFile << "fitting file: " << _dataFile << " " << _dataBeginRow
		<< " " << _dataEndRow << endl;
	predFile << "test file: " << _testFile << " " << _testBeginRow
		<< " " << _testEndRow << endl;
	predFile << "fitting		test" << endl;

	const Term& predFitting = _powerFit.preFittingDepTerm();
	const Term& predTest	= _powerFit.preTestDepTerm();
	int i;
	for (i = 0; i < _powerFit.modelNdF() && i < _powerFit.modelNdT(); i++) {
		if (i < _powerFit.modelNdF()) {
			predFile << predFitting.getData(i) << "\t";
		} else {
			predFile << "\t\t";
		}

		if (i < _powerFit.modelNdT()) {
			predFile << predTest.getData(i);
		}

		predFile << endl;
	}
}

void
Ui::qryDataFileBeginEndRows()
{
	while (1) {
		cout << "beginning and ending row number (e.g. 1 3, or 0 0"
			<< " for all): ";
		cin >> _dataBeginRow >> _dataEndRow;
		cin.getline(Buffer, BUF_SIZE);		// flush cin's buffer

		if (_dataBeginRow < 0 || _dataEndRow < _dataBeginRow
		|| (_dataBeginRow == 0 && _dataEndRow != 0)) {
			cerr << "invalid data begin and end row number: "
				<< _dataBeginRow << " " << _dataEndRow << endl;
		} else {
			break;
		}
	}
}

void
Ui::qryTestFileBeginEndRows()
{
	while (1) {
		cout << "beginning and ending row number (e.g. 1 3, or 0 0"
			<< " for all): ";
		cin >> _testBeginRow >> _testEndRow;
		cin.getline(Buffer, BUF_SIZE);		// flush cin's buffer

		if (_testBeginRow < 0 || _testEndRow < _testBeginRow
		|| (_testBeginRow == 0 && _testEndRow != 0)) {
			cerr << "invalid data begin and end row number: "
				<< _testBeginRow << " " << _testEndRow << endl;
		} else {
			break;
		}
	}
}

BooleanT
Ui::saveModel()
{
	ofstream modelOut(_modelOutFile);

	if (!modelOut) {
		cout << "Unable to save model to " << _modelOutFile << endl;

		return NO;
	} 

	listModel(modelOut);
	_modelModified = NO;		// reset the flag

	return YES;
}

///////////////////////////////////////////////////////////////////////
//	Only T-Statistics and coefficient come from fitting data;
//	rest come from test data.
///////////////////////////////////////////////////////////////////////
void
Ui::listInCanTerms(ostream& strm) const
{
	int width	= strm.width();
	int precision	= strm.precision();

	strm << "\t\txxxxx In Candidates xxxxx" << endl;
	strm << "ivColNo lag exp . . . Coeff  TStat  SSE  RSQ  ";
	switch (_powerFit.criteria()) {
	case PowerFit::MAX_F_STAT:
		strm << "FStat";
		break;
	case PowerFit::MIN_MSE:
		strm << "MSE";
		break;
	case PowerFit::MIN_AIC:
		strm << "AIC";
		break;
	case PowerFit::MIN_BIC:
		strm << "BIC";
		break;
	}
	strm << endl;

	int i, j, countMulti;
	int count = _powerFit.countInCanTerms();

	for (i = 0; i < count; i++) {
		const CanTerm& fittingCanTerm =
			_powerFit.getInFittingCanTerm(i);
		const CanTerm& testCanTerm = _powerFit.getInTestCanTerm(i);

		cout.setf(ios::right, ios::adjustfield);
		cout << setw(2) << (i + 1) << ")";
		fittingCanTerm.printProperty(strm);

		// may need to pad the empty to line up
		Property dummyProp;
		countMulti = fittingCanTerm.countProperty();
		for (j = countMulti; j < _powerFit.maxAllowedMulti(); j++) {
			dummyProp.printOn(strm);
		}

		strm << coeffFmt << fittingCanTerm.coeff();
		strm << tStatFmt << fittingCanTerm.TStatis();
		strm << sseFmt << testCanTerm.modelStat().SSE();
		strm << rSquareFmt << testCanTerm.modelStat().RSquare();

		switch (_powerFit.criteria()) {
		case PowerFit::MAX_F_STAT:
			strm << fStatFmt
				<< testCanTerm.modelStat().FStatis();
			break;
		case PowerFit::MIN_MSE:
			strm << mseFmt << testCanTerm.modelStat().MSE();
			break;
		case PowerFit::MIN_AIC:
			strm << aicFmt << testCanTerm.modelStat().AIC();
			break;
		case PowerFit::MIN_BIC:
			strm << bicFmt << testCanTerm.modelStat().BIC();
			break;
		}

		strm << resetiosflags(ios::showpoint|ios::scientific|ios::fixed)
			<< endl;
	}

	// restore width and precision
	strm.width(width);
	strm.precision(precision);
}

///////////////////////////////////////////////////////////////////////
//	This function can be called for listing current model info
//	on screen as well as saving to the file. If the argument is
//	'cout', it will show the info to screen.  The pageBreak argument
//	is used to determine whether need to pause the display in
//	interactive mode provided the output info is more than one page.
//	Default pageBreak is NO.
///////////////////////////////////////////////////////////////////////
void
Ui::listModel(ostream& strm, BooleanT pageBreak) const
{
	int idx;
	int width	= strm.width();
	int precision	= strm.precision();

	if (strm == cout) {	// on screen display
		if (_powerFit.countModelTerms() == 0) {
			strm << "\t******** NO TERMS IN MODEL ********" << endl;
			return;
		} else {
			strm << "\t************* IN MODEL ************" << endl;
		}
	} else {	// to file
		char date[40];
#ifdef	PC
		struct dosdate_t today;

		_dos_getdate(&today);
		sprintf(date, "%d/%d/%d ", today.month, today.day, today.year);
#else	// UNIX
		time_t now;
		struct tm *pTm;

		now = time(0);
		pTm = localtime(&now);
		strftime(date, 40, "%D", pTm);
#endif
		strm << "POWERFIT VERSION " << _versionNum << " " << date
			<< endl;
		strm << _dataFile << " " << _dataBeginRow << " "
			<< _dataEndRow << endl;
		strm << _testFile << " " << _testBeginRow << " "
			<< _testEndRow << endl << endl;

		strm << "MaxNumMultipliers NumIndVar NumTerms DepVarCol"
			<< endl;
		strm << _powerFit.maxAllowedMulti() << "\t"
			<< (_powerFit.countFittingTerms() - 2) << "\t"
			<< _powerFit.countModelTerms() << "\t"
			<< _powerFit.depVarCol() << endl;

		strm << "TransformErr? Normalization Marked" << endl;
		strm << "N N 0" << endl << endl;	// hard code here

		strm << "ColNo Max Min Trans" << endl;
		// idx = 0 is constant term
		for (idx = 1; idx < _powerFit.countFittingTerms(); idx++) {
			strm << idx << " "
				<< _powerFit.getFittingTerm(idx).maxData()
				<< " "
				<< _powerFit.getFittingTerm(idx).minData()
				<< " Trans" << endl;
		}

		strm << endl;
	}

	if (strm == cout) {	// on screen display
		strm << "N/D ivColNo lag exp . . .  Coeff  tStat  SSErem  ";
		switch (_powerFit.criteria()) {
		case PowerFit::MAX_F_STAT:
			strm << "FStat";
			break;
		case PowerFit::MIN_MSE:
			strm << "MSE";
			break;
		case PowerFit::MIN_AIC:
			strm << "AIC";
			break;
		case PowerFit::MIN_BIC:
			strm << "BIC";
			break;
		}
	} else {	// to file
		strm << "N/D ivColNo lag exp . . .  Coeff  tStat  Max  Min  "
			<< "SSErem  ";
	}
	strm << endl;

	// printing terms
	// This part should always come from fitting data
	int totalTerms = _powerFit.countModelTerms();
	for (idx = 0; idx < totalTerms; idx++) {
		strm << resetiosflags(ios::showpoint);

		if (strm == cout && pageBreak == YES) {
			// on screen display only
			if (idx != 0 && (idx % 20) == 0) {
				strm << endl << "Hit <Enter> to continue";
				getc(stdin);
				fflush(stdin);
			}
		}

		if (strm == cout) {	// on screen display
			strm.setf(ios::right, ios::adjustfield);
			strm << setw(2) << (idx + 1) << ")";
		}

		const CanTerm& fittingModelTerm =
			_powerFit.getFittingModelTerm(idx);

		const CanTerm& testModelTerm =
			_powerFit.getTestModelTerm(idx);

		strm << fittingModelTerm.position() << "  ";
		fittingModelTerm.printProperty(strm);

		// pad property info to line up
		Property prop;	// dummy
		int i;
		for (i = fittingModelTerm.countProperty();
		i < _powerFit.maxAllowedMulti(); i++) {
			prop.printOn(strm);
		}

		strm << " " << coeffFmt << fittingModelTerm.coeff();
		strm << " " << tStatFmt << fittingModelTerm.TStatis();

		if (strm != cout) {
			// to file only
			strm << " " << dataFmt << fittingModelTerm.maxData();
			strm << " " << dataFmt << fittingModelTerm.minData();
		}

		// overwrite the default SSE format to scientific notation
		strm << " " << sseFmt << setiosflags(ios::scientific)
			<< fittingModelTerm.modelStat().SSE();

		if (strm == cout) {	// on screen display
			switch (_powerFit.criteria()) {
			case (PowerFit::MAX_F_STAT):
				strm << fStatFmt
					<< testModelTerm.modelStat().FStatis();
				break;
			case (PowerFit::MIN_MSE):
				strm << mseFmt
					<< testModelTerm.modelStat().MSE();
				break;
			case (PowerFit::MIN_AIC):
				strm << aicFmt
					<< testModelTerm.modelStat().AIC();
				break;
			case (PowerFit::MIN_BIC):
				strm << bicFmt
					<< testModelTerm.modelStat().BIC();
				break;
			}
		}
		strm << endl;
	}

	strm << endl;
	if (strm == cout) {
		// to screen
		strm << "  ND  NF  TSS  SSE  RSQ  MSE  FSTAT  AIC  BIC" << endl;
		strm << "F "
			<< _powerFit.modelNdF() << "  "
			<< _powerFit.degreeOfFreedomF() << "  "
			<< setiosflags(ios::fixed) << setprecision(3)
			<< _powerFit.fittingTSS() << " "
			<< sseFmt << setiosflags(ios::scientific)
			<< _powerFit.modelFittingSSE() << " "
			<< setiosflags(ios::scientific) << setw(10)
			<< setprecision(3)
			<< _powerFit.modelFittingRSquare() << " "
			<< setprecision(3)
			<< _powerFit.modelFittingMSE() << " "
			<< setprecision(2)
			<< _powerFit.modelFittingFStatis() << " "
			<< setprecision(3)
			<< _powerFit.modelFittingAIC() << " "
			<< setprecision(3)
			<< _powerFit.modelFittingBIC() << endl;
		strm << "T "
			<< _powerFit.modelNdT() << "  "
			<< _powerFit.degreeOfFreedomT() << "  "
			<< setiosflags(ios::fixed) << setprecision(3)
			<< _powerFit.testTSS() << " "
			<< sseFmt << setiosflags(ios::scientific)
			<< _powerFit.modelTestSSE() << " "
			<< setiosflags(ios::scientific) << setw(10)
			<< setprecision(3)
			<< _powerFit.modelTestRSquare() << " "
			<< setprecision(3)
			<< _powerFit.modelTestMSE() << " "
			<< setprecision(2)
			<< _powerFit.modelTestFStatis() << " "
			<< setprecision(3)
			<< _powerFit.modelTestAIC() << " "
			<< setprecision(3)
			<< _powerFit.modelTestBIC() << endl;
	} else {
		double fittingLogCRSQ, testLogCRSQ;

		if (_powerFit.modelFittingSSE() == 0) {
			fittingLogCRSQ = -1000.0;
		} else {
			fittingLogCRSQ = log10(_powerFit.modelFittingCRSQ());
		}

		if (_powerFit.modelTestSSE() == 0) {
			testLogCRSQ = -1000.0;
		} else {
			testLogCRSQ = log10(_powerFit.modelTestCRSQ());
		}

		// to .pfm file
		strm << "ND NP NF TSS SSE RSQ CRSQ MSE FSTAT log10CRSQ "
			<< "log10MSE AIC BIC" << endl;
		strm << _powerFit.modelNdF() << "  "
			<< _powerFit.countModelTerms() << "  "
			<< _powerFit.degreeOfFreedomF() << "  "
			<< setiosflags(ios::fixed) << setprecision(3)
			<< _powerFit.fittingTSS() << " "
			<< sseFmt << setiosflags(ios::scientific)
			<< _powerFit.modelFittingSSE() << " "
			<< setiosflags(ios::scientific) << setw(10)
			<< setprecision(3)
			<< _powerFit.modelFittingRSquare() << " "
			<< setprecision(3)
			<< _powerFit.modelFittingCRSQ() << " "
			<< setprecision(3)
			<< _powerFit.modelFittingMSE() << " "
			<< setprecision(2)
			<< _powerFit.modelFittingFStatis() << " "
			<< setprecision(3)
			<< fittingLogCRSQ << " "
			<< setprecision(3)
			<< log10(_powerFit.modelFittingMSE()) << " "
			<< setprecision(3)
			<< _powerFit.modelFittingAIC() << " "
			<< setprecision(3)
			<< _powerFit.modelFittingBIC() << endl;

		strm << _powerFit.modelNdT() << "  "
			<< _powerFit.countModelTerms() << "  "
			<< _powerFit.degreeOfFreedomT() << "  "
			<< setiosflags(ios::fixed) << setprecision(3)
			<< _powerFit.testTSS() << " "
			<< sseFmt << setiosflags(ios::scientific)
			<< _powerFit.modelTestSSE() << " "
			<< setiosflags(ios::scientific) << setw(10)
			<< setprecision(3)
			<< _powerFit.modelTestRSquare() << " "
			<< setprecision(3)
			<< _powerFit.modelTestCRSQ() << " "
			<< setprecision(3)
			<< _powerFit.modelTestMSE() << " "
			<< setprecision(2)
			<< _powerFit.modelTestFStatis() << " "
			<< setprecision(3)
			<< testLogCRSQ << " "
			<< setprecision(3)
			<< log10(_powerFit.modelTestMSE()) << " "
			<< setprecision(3)
			<< _powerFit.modelTestAIC() << " "
			<< setprecision(3)
			<< _powerFit.modelTestBIC() << endl;
	}

	// restore width and precision
	strm.unsetf(ios::showpoint);
	strm.setf(ios::fixed, ios::floatfield);
	strm.width(width);
	strm.precision(precision);
}

void
Ui::backUp()
{
	if (_powerFit.countModelTerms() > 0) {
		ofstream backUpFile("mpr.sav");

		if (!backUpFile) {
			cerr << "Cannot open mpr.save to backup result" << endl;
		} else {
			listModel(backUpFile);
		}
	}
}

/////////////////////////////////////////////////////////////////
//	This function relies on the format that printInModel()
//	generates.
/////////////////////////////////////////////////////////////////
BooleanT
Ui::readModelFile()
{
	Trace t("Ui::readModelFile()", TRACE_ID);

	ifstream inputFile(_modelInFile);

	if (!inputFile) {
		cerr << "Cannot open " << _modelInFile << " to read" << endl;
		return NO;
	}

	int position;
	int termIdx, propIdx;
	int multipliers, numIndVar, numTerms, depVarCol;
	int ivColNo, lag;
	ExpT exp;
	char xformErr, norm;
	int marked;

	inputFile.getline(Buffer, BUF_SIZE);		// POWERFIT ...
	inputFile.getline(Buffer, BUF_SIZE);		// dataFile ...
	inputFile.getline(Buffer, BUF_SIZE);		// testFile ...
	inputFile.getline(Buffer, BUF_SIZE);		// empty line
	inputFile.getline(Buffer, BUF_SIZE);		// MaxNumMultipliers ...
	inputFile >> multipliers >> numIndVar >> numTerms >> depVarCol;
	inputFile.getline(Buffer, BUF_SIZE);		// till endl
	inputFile.getline(Buffer, BUF_SIZE);		// TransformErr? ...
	inputFile >> xformErr >> norm >> marked;
	inputFile.getline(Buffer, BUF_SIZE);		// till endl

	t.out(T_DEBUG) << "multipliers = " << multipliers << " numIndVar = "
		<< numIndVar << " numTerms = " << numTerms << endl;

	inputFile.getline(Buffer, BUF_SIZE);		// empty line
	inputFile.getline(Buffer, BUF_SIZE);		// ColNo Max Min Trans
	int idx;
	for (idx = 0; idx <= numIndVar; idx++) {
		inputFile.getline(Buffer, BUF_SIZE);	// colNo Max Min Trans
	}

	inputFile.getline(Buffer, BUF_SIZE);		// empty line
	inputFile.getline(Buffer, BUF_SIZE);		// N/D ivColNo ...
	for (termIdx = 0; termIdx < numTerms; termIdx++) {
		Term term;

		inputFile >> position;
		term.position((Term::PositionT) position);
		
		for (propIdx = 0; propIdx < multipliers; propIdx++) {
			inputFile >> ivColNo >> lag >> exp;

			Property prop(ivColNo, lag, exp);
			term.addProperty(prop);
		}
		inputFile.getline(Buffer, BUF_SIZE);	// rest of the line

		_powerFit.addModelTerm(term);
	}

	return YES;
}

void
Ui::printOn(ostream& strm) const
{
	strm << "Version # " << _versionNum << endl;
	strm << "Data file [" << _dataFile << "] begin:" << _dataBeginRow
		<< " end:" << _dataEndRow << endl;
	strm << "Test file [" << _testFile << "] begin:" << _testBeginRow
		<< " end:" << _testEndRow << endl;
	strm << "DVCOL: " << _depVarCol << endl;
	strm << "ModelIn: [" << _modelInFile << "]" << endl;
	strm << "ModelOut: [" << _modelOutFile << "]" << endl;
}
