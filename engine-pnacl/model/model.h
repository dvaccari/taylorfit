#ifndef _MODEL_H_
#define _MODEL_H_

#include <vector>
#include <unordered_map>
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"
#include "ppapi/cpp/var_dictionary.h"
#include "json/json.h"

#include "../matrix/matrix.h"
#include "combos.h"
#include "term.h"
#include "termpool.h"


class Model {
  public:
    Model()   : _data(new Matrix(0, 0)),
                _dependent(0),
                _exponents({ 1 }),
                _multiplicands({ 1 }),
                _termpool(this) { }

    Model              *set_data(const pp::VarArray&);
    Model              *set_multiplicands(int);
    Model              *set_exponents(const pp::VarArray&);
    Model              *set_lags(const pp::VarArray&);

    Model              *add_term(part_set&);
    Model              *remove_term(part_set&);

    std::vector<Term*>  get_candidates();

    Matrix             *data();

    Json::Value         toJSON();

  private:
    Matrix             *_data;
    int                 _dependent;
    std::vector<float>  _exponents;
    std::vector<int>    _lags;
    std::vector<int>    _multiplicands;
    TermPool            _termpool;
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
