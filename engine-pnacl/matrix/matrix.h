#ifndef _MATRIX_H_
#define _MATRIX_H_

#include <cmath>
#include <vector>
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"
#include "json/json.h"

class Matrix {
  public:
    Matrix() : Matrix(0, 0) { }
    Matrix(int m, int n) : data_(new double[m*n]), m_(m), n_(n) { }
    Matrix(int m, int n, double *data) : m_(m), n_(n)
      { data_ = new double[m*n]; memcpy(data_, data, m*n*sizeof(double)); }
    Matrix(const pp::VarArray&);
    Matrix(const std::vector<std::vector<double>>&);
    Matrix(const Matrix&);
    Matrix(Matrix*);

    //~Matrix() { delete data_; }

    int             m() const { return m_; }
    int             n() const { return n_; }

    Json::Value     toJSON();

    Matrix          operator*(const Matrix&);   // elem-wise multiplication
    Matrix          operator*(const double);    // scalar multiplication
    Matrix          dot(const Matrix&) const;   // matrix multiplication
    Matrix          operator/(const Matrix&);   // elem-wise division
    Matrix          operator/(const double);    // elem-wise division
    Matrix          operator+(const Matrix&);   // elem-wise addition
    Matrix          operator+(const double);    // scalar addition
    Matrix          operator-(const Matrix&);   // elem-wise subtraction
    Matrix          operator-(const double);    // scalar subtraction
    Matrix          operator|(const Matrix&);   // horizontal stack
    Matrix          operator||(const Matrix&);  // vertical stack

    double          sum();

    Matrix          col(int);
    Matrix          row(int);
    Matrix          T() const;
    Matrix          cols(const std::vector<int>&);

    static Matrix   zeros(int, int);

    double         *data_;

  private:
    int             m_;
    int             n_;
};


Matrix operator^(const Matrix &matrix, const double n);
Matrix operator^(const Matrix &matrix, const float n);
Matrix operator^(const Matrix &matrix, const int n);

#endif
