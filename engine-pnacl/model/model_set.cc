
#include "ppapi/cpp/var_array.h"
#include "model.h"
#include "../utils/utils.h"

/**
 * Expects a set of arrays (an array of arrays). Sets the data
 */
Model *Model::set_data(const pp::VarArray &data) {
  _data = new Matrix(data);
  return this;
}


Model *Model::set_multiplicands(int mults) {
  _multiplicands = range(1, mults + 1);
  return this;
}


Model *Model::set_exponents(const pp::VarArray &exponents) {
  _exponents = ppvar_to_float_vec(exponents);
  return this;
}

