
#include "model.h"

Matrix &Model::data(std::string label) const {
  str_map<Matrix*>::const_iterator found = data_.find(label);

  if (found == data_.end()) {
    throw "Cannot find data for label '" + label + "'";
  }

  return *(found->second);
}

Matrix &Model::data() const { return data(DEFAULT_LABEL); }


Matrix Model::X(std::string label) {
  Matrix aggregate(data_.at(label)->m(), 0);

  for (Term *t : terms_) {
    aggregate = aggregate | t->col();
  }

  return aggregate;
}

Matrix Model::X() { return X(DEFAULT_LABEL); }


Matrix Model::y(std::string label) {
  return data_.at(label)->col(dependent_);
}

Matrix Model::y() { return y(DEFAULT_LABEL); }

