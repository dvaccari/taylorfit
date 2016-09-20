#include <new.h>
#include "Ui.h"

void new_error();

int
main(int argc, char *argv[])
{
	Trace::init();
	Trace t("main()", TRACE_ID);

	char initFile[40];

	if (argc > 2) {
		cout << "Usage: " << argv[0] << " [init_file]" << endl;
		return (1);
	} else if (argc == 2) {
		// command line provided init file name
		strcpy(initFile, argv[1]);
	} else {
		// default init file name
		strcpy(initFile, "pf.ini");
	}

	set_new_handler(new_error);

	Ui ui;

	ui.coverPage();

	if (ui.readInitFile(initFile) == NO) {
		return (1);
	}

	if (ui.readFittingData() == NO || ui.readTestData() == NO) {
		return (1);
	}

	ui.run();

	return 0;
}

void
new_error()
{
	cerr << "Unable to allocate more memory" << endl;
	abort();
}

