#ifndef _TF_PROGRESSIVE_H_
#define _TF_PROGRESSIVE_H_

#include "observable.h"

class Progress : public Observable<Progress> {

  public:
    Progress()        : Progress(0) { }
    Progress(int max) : progress_value_(0), progress_max_value_(max) { }

    void reset() {
      progress_value_ = 0;
    }

    void tick() {
      progress_value_++;
      fire("progress");
    }

    void on_progress(Observer<Progress> &observer) {
      on("progress", observer);
    }

    int curr_value() {
      return progress_value_;
    }

    int max_value() {
      return progress_max_value_;
    }

    int max_value(int max) {
      progress_max_value_ = max;
      return progress_max_value_;
    }

  private:
    int progress_value_;
    int progress_max_value_;
};

#endif
