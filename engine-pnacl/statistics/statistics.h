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
    stat(Matrix matrix) : matrix_value_(new Matrix(matrix)), type_(MATRIX) {}
    stat(const double &val) : double_value_(val), type_(DOUBLE) {}

    Matrix   &matrix_val() const { return *matrix_value_; }
    double    double_val() const { return double_value_; }
    type      type() const { return type_; }

    operator  Matrix&() const { return matrix_val(); }
    operator  double() const { return double_val(); }

  private:
    Matrix   *matrix_value_;
    double    double_value_;
    enum type type_;

};

typedef std::unordered_map<std::string, stat> stats_bundle;


class Statistic {
  public:
    static void define(
        const std::string                 &name,     // name of statistic
        const std::vector<std::string>    &params,   // required params
        std::function<void(stats_bundle&)> func      // fn to compute statistic
    ) {
      Statistic::registered_statistics_.push_back(
        Statistic(name, params, func)
      );
    }

    static stats_bundle &compute(stats_bundle&);
    static void init();

    std::string                           name_;
    std::vector<std::string>              params_;
    std::function<void(stats_bundle&)>    func_;

    bool operator==(const Statistic &other) {
      return other.name_ == name_;
    }

  private:
    Statistic() { }
    Statistic(
        const std::string                 &name,     // name of statistic
        const std::vector<std::string>    &params,   // required params
        std::function<void(stats_bundle&)> func      // fn to compute statistic
    ) : name_(name), params_(params), func_(func) { }

    static void sort_statistics();
    static std::vector<Statistic> registered_statistics_;
    static bool initialized_;
};

#endif
