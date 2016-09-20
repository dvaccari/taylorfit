#ifndef	__UI_H
#define	__UI_H

#include "PowerFit.h"

class Ui {
public:
	enum {MANUAL = PowerFit::MANUAL, AUTO = PowerFit::AUTO, BATCH};
	enum {MAIN_QUIT, MAIN_METHOD, MAIN_FIT, MAIN_FILE, MAIN_VIEW};
	enum {METHOD_PRE, METHOD_EXP, METHOD_LAG, METHOD_MULTIPLIERS,
		METHOD_NORMALIZE, METHOD_TOLERANCE, METHOD_MULTI_INCLD_DEP};
	enum {FIT_PRE, FIT_FIT, FIT_MANUAL, FIT_AUTO};
	enum {FILE_PRE, FILE_READ_MODEL, FILE_READ_FIT_DATA,
		FILE_READ_TEST_DATA, FILE_SAVE_MODEL, FILE_SAVE_PREDICT};

	Ui();
	~Ui();

	const char *	versionNum() const;
	const char *	dataFile() const;

	BooleanT	readInitFile(const char *fileName);
	BooleanT	readFittingData();
	BooleanT	readTestData();

	int		mode() const;

	void		run();
	void		coverPage();

	void		printOn(ostream& strm = cout) const;
private:
	PowerFit	_powerFit;
	char		_versionNum[10];
	char		_dataFile[128];		// fitting data file name
	int		_dataBeginRow;
	int		_dataEndRow;
	char		_testFile[128];		// test data file name
	int		_testBeginRow;
	int		_testEndRow;
	int		_depVarCol;
	char		_modelInFile[128];
	char		_modelOutFile[128];
	int		_mode;			// Auto, manual or batch
	BooleanT	_modelModified;
	BooleanT	_rational;

	void		setDefaultModelOutFile();
	void		listInCanTerms(ostream& strm = cout) const;
	void		listModel(ostream& strm = cout, BooleanT pb = NO) const;
	BooleanT	readModelFile();
	void		clearScreen();

	void		mainMenu();
	void		methodMenu();
	void		fitMenu();
	void		fitManualSubMenu();
	void		fitAutoSubMenu();
	void		fileMenu();
	void		qryFileName(char *);
	BooleanT	qryModelOutFile();
	void		qryDataFileBeginEndRows();
	void		qryTestFileBeginEndRows();
	void		savePredictionFile();

	void		fit();
	BooleanT	saveModel();
	void		backUp();
};

inline const char *
Ui::dataFile() const
{
	return _dataFile;
}

inline const char *
Ui::versionNum() const
{
	return _versionNum;
}

inline int
Ui::mode() const
{
	return _mode;
}

#endif	__UI_H

