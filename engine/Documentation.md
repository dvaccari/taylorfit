# Objects

## Matrix - in ./matrix/Matrix.js

Custom Matrix Object

Members - n: Number of rows
          m: Number of columns
          stuff: Contents of the matrix

Holds common matrix operations (add, subtract, get, set, etc.)

## Model - in ./model/Model.js

### Model.js

Object descriptor for a model
Holds data, exponents, lags, columns
Methods for setting, clearing data; getting model
setting values


### Term.js

A single term for a model
Constructor takes form (model, parts)
s.t. model owns the term
parts[0] - index of column for the term
parts[1] - exponent for that column
parts[2] - lag to apply to that column

### Termpool.js

Given a model, this holds a list of terms attatched to that model

get(term) - attempt to retrieve term from hash table; if not, then add that term to the hash table.

This is basically a collection for Term objects that uses hashing for constant time lookup.

## Observable - in ./observable/Observable.js

An object wrapper around the Knockout observable structure.
on - map events to handlers
removeListener - remove listener from observable
fire - fire data for each listener to a given event

## Statistic - in ./statistics/Statistc.js

An object holding a descriptor for a given feature statistic.

Holds name, arguments, and function
calc - calculates statistic
inspect - return string representation of options

### definitions.js (in ./statistics)

Holds a number of prederfined statistics over a dataset

### distributions-socr.ks

Holds a number of distributions (t, F) over dataset

## Regression - ./regression/

Export methods for performing regression

### lstsq.js

Perform Least Squares Regression over an input dataset and an output. Currently, can either use SVD or NE (SVD is set.)

Also returns statistics
{ X, y, BHat, VdivwSq, stdev, mean, weights, V, w }

### svd-golub-reinsch.js

Return the SVD (u , q , v) for a given matrix A, using the 
Golub-Reinsch Algorithm


