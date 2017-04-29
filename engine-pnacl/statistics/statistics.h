#ifndef _TF_STATISTICS_H_
#define _TF_STATISTICS_H_

#include <vector>
#include <unordered_map>
#include <functional>
#include "json/json.h"
#include "../matrix/matrix.h"

class stat {

  public:
    enum type {
      MATRIX,
      DOUBLE
    };

  public:
    stat() {}
    stat(Matrix *matrix)    : matrix_value_(matrix), type_(MATRIX) {}
    stat(const double &val) : double_value_(val), type_(DOUBLE) {}

    Matrix   *matrix_val() const { return matrix_value_; }
    double    double_val() const { return double_value_; }
    type      type() const { return type_; }

  private:
    Matrix   *matrix_value_;
    double    double_value_;
    enum type type_;

};

typedef std::unordered_map<std::string, stat> stats_bundle;


template <typename T>
class Statistic {
  public:
    static void define(
        const std::string              &name,     // name of statistic
        const std::vector<std::string> &params,   // required params
        std::function<T(stats_bundle&)> func      // fn to compute statistic
    ) {
      registered_statistics_.push_back(Statistic(name, params, func));
    }

  private:
    Statistic() { }
    Statistic(
        const std::string&,               // name of statistic
        const std::vector<std::string>&,  // required params
        std::function<T(stats_bundle&)>
    );

    static std::vector<Statistic> registered_statistics_;
};

#endif
