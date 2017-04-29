#ifndef _MATRIX_H_
#define _MATRIX_H_

#include <cmath>
#include <vector>
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_array.h"
#include "json/json.h"

class Matrix {
  public:
    Matrix(int m, int n) : _data(new double[m*n]), _m(m), _n(n) { }
    Matrix(const pp::VarArray&);
    Matrix(const std::vector<std::vector<double>>&);
    Matrix(double *data);
    Matrix(const Matrix&);
    Matrix(Matrix*);

    int             m() const { return _m; }
    int             n() const { return _n; }

    Json::Value     toJSON();

    Matrix         *operator*(const Matrix&);   // elem-wise multiplication
    Matrix         *operator*(const double);    // scalar multiplication
    Matrix         *dot(const Matrix&);         // matrix multiplication
    Matrix         *operator/(const Matrix&);   // elem-wise division
    Matrix         *operator/(const double);    // elem-wise division
    Matrix         *operator+(const Matrix&);   // elem-wise addition
    Matrix         *operator+(const double);    // scalar addition
    Matrix         *operator-(const Matrix&);   // elem-wise subtraction
    Matrix         *operator-(const double);    // scalar subtraction
    Matrix         *operator|(const Matrix&);   // horizontal stack
    Matrix         *operator||(const Matrix&);  // vertical stack

    Matrix         *col(int);
    Matrix         *row(int);
    Matrix         *T();
    Matrix         *cols(const std::vector<int>&);

    static Matrix  *zeros(int, int);

    double         *_data;

  private:
    int             _m;
    int             _n;
};


Matrix *operator^(const Matrix &matrix, const double n);
Matrix *operator^(const Matrix &matrix, const float n);
Matrix *operator^(const Matrix &matrix, const int n);

#endif
