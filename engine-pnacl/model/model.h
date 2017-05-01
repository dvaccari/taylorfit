#ifndef _TF_MODEL_H_
#define _TF_MODEL_H_

#include <vector>
#include <unordered_map>
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"
#include "ppapi/cpp/var_dictionary.h"
#include "json/json.h"

#include "../matrix/matrix.h"
#include "combos.h"
#include "termpool.h"
#include "../observable/observable.h"
#include "../observable/progress.h"

#define DEFAULT_LABEL "fit"

template <typename T>
using str_map = std::unordered_map<std::string, T>;

class Term;
class TermPool;
struct part;
typedef std::vector<part> part_set;

class Model : public Observable<Model> {
  public:
    Model()   : dependent_(0),
                exponents_({ 1 }),
                multiplicands_({ 1 }),
                termpool_(this)
                { data_.insert({ DEFAULT_LABEL, new Matrix(3, 1) }); }

    Model              *set_data(const pp::VarArray&);
    Model              *set_data(const pp::VarArray&, const std::string&);
    Model              *set_exponents(const pp::VarArray&);
    Model              *set_multiplicands(int);
    Model              *set_dependent(int);
    Model              *set_lags(const pp::VarArray&);

    Model              *add_term(const part_set&);
    Model              *remove_term(const part_set&);
    void                clear() { terms_.clear(); }

    Json::Value         get_candidates(Observer<Progress>&);
    Json::Value         lstsq();

    Matrix             &data(std::string) const;
    Matrix             &data() const;
    Matrix              X(std::string);
    Matrix              X();
    Matrix              y(std::string);
    Matrix              y();

    Json::Value         toJSON();

  private:
    str_map<Matrix*>    data_;
    int                 dependent_;
    std::vector<float>  exponents_;
    std::vector<int>    lags_;
    std::vector<int>    multiplicands_;
    TermPool            termpool_;
    std::vector<Term*>  terms_;
};


std::vector<part_set> generate_terms(
    std::vector<int> features,
    std::vector<float> exponents,
    std::vector<int> multipliers,
    std::vector<int> lags
);

namespace Json {

  template <typename T>
  Value fromVector(std::vector<T> things) {
    Value::Value json = Value::Value(ValueType::arrayValue);

    for (T &item : things) {
      json.append(Value::Value(item));
    }

    return json;
  }

}

#endif
