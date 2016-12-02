
const utils = require('./utils.es6');

/**
 * Private members
 *
 * @private
 */
const _data = Symbol('data');
const _n    = Symbol('n');
const _m    = Symbol('m');


/**
 * Swap rows `i` and `j` in matrix `m` in place.
 *
 * @param {Matrix} m
 * @param {number} i
 * @param {number} j
 */
function swapRows(m, i, j) {
  var k, temp;

  for (k = 0; k < m[_m]; k += 1) {
    temp = m[_data][j * m[_m] + k];
    m[_data][j * m[_m] + k] = m[_data][i * m[_m] + k];
    m[_data][i * m[_m] + k] = temp;
  }
}

/**
 * Divide row `i` in both matrix `m` and matrix `inv` by `factor`.
 *
 * @param {Matrix} m
 * @param {Matrix} inv
 * @param {number} i
 * @param {number} j
 */
function divideRow(m, inv, i, factor) {
  var k, temp;

  for (k = 0; k < m[_m]; k += 1) {
    m[_data][i * m[_m] + k] /= factor;
    inv[_data][i * m[_m] + k] /= factor;
  }
}

/**
 * Subtract multiple of row `i` and column `j` from every row in `m` and `inv`.
 *
 * @param {Matrix} m
 * @param {Matrix} inv
 * @param {number} i
 * @param {number} j
 */
function subtractRowMultiple(m, inv, i, j) {
  var k, l, factor;

  for (l = 0; l < m[_n]; l += 1) {
    factor = m[_data][l * m[_m] + j];

    if (l !== i) {
      for (k = 0; k < m[_m]; k += 1) {
        m[_data][l * m[_m] + k] -= m[_data][i * m[_m] + k] * factor;
        inv[_data][l * m[_m] + k] -= inv[_data][i * m[_m] + k] * factor;
      }
    }
  }
}


/**
 * A speedy 2-dimensional matrix implementation.
 *
 * @class Matrix
 */
class Matrix {

  /**
   * Creates a new Matrix of size <n, m>, using `stuff`.
   *
   * If `stuff` is a Float64Array, then the reference will be used. Otherwise,
   * its contents will be copied into a new Float64Array.
   *
   * @param {number | number[][]}       n     Number of rows (or nested arrays
   *                                          that look like a matrix)
   * @param {number}                    m     Number of columns
   * @param {Float64Array | number[][]} stuff Items to populate the matrix
   */
  constructor(n, m, stuff) {
    if (Array.isArray(n)) {
      return Matrix.from(n);
    }
    if (stuff != null) {
      stuff = (stuff instanceof Float64Array)
              ? stuff
              : Float64Array.from(stuff);
      if (stuff.length !== n * m) {
        throw new Error('Array does not match the specified dimensions');
      }
    } else {
      stuff = new Float64Array(n * m);
    }
    this[_data] = stuff;
    this[_n] = n;
    this[_m] = m;
    return this;
  }

  get(i, j) {
    return this[_data][i * this[_m] + j];
  }

  /**
   * Performs element-wise addition between two matrices and returns a new copy.
   *
   * @param {Matrix<n,m>} other Matrix with equivalent dimensions to this
   * @return {Matrix<n,m>} this + other
   * @throws {Error} If dimensions do not match
   */
  add(other) {
    if (this[_n] !== other[_n] || this[_m] !== other[_m]) {
      throw new Error('Dimensions do not match');
    }

    var sum = this.clone()
      , i;

    for (i = 0; i < sum[_data].length; i += 1) {
      sum[_data][i] += other[_data][i];
    }
    return sum;
  }

  /**
   * Performs matrix multiplication between this and other.
   *
   * @param {Matrix<m,k>} other Matrix whose rows must be === to this's columns
   * @return {Matrix<n,k>} this * other
   * @throws {Error} If dimensions do not match
   */
  multiply(other) {
    if (this[_m] !== other[_n]) {
      throw new Error('Dimensions do not match');
    }

    var product = new Matrix(this[_n], other[_m])
      , i, j, k, sum;

    for (i = 0; i < this[_n]; i += 1) {
      for (j = 0; j < other[_m]; j += 1) {
        for (k = 0, sum = 0; k < this[_m]; k += 1) {
          sum += this[_data][i * this[_m] + k] *
                 other[_data][k * other[_m] + j];
        }
        product[_data][i * other[_m] + j] = sum;
      }
    }
    return product;
  }

  /**
   * Computes the inverse of the matrix (only if it is square!).
   *
   * @return {Matrix<n,m>} Inverse matrix s.t. this * inv(this) === I
   * @throws {Error} If not a square matrix
   */
  inv() {
    if (this[_n] !== this[_m]) {
      throw new Error('Must be square');
    }

    var self = this.clone()
      , inverse = Matrix.eye(this[_n], this[_m])
      , i, j, k, factor;

    for (i = 0, j = 0; i < self[_n] && j < self[_m]; i += 1, j += 1) {
      if (self[_data] === 0) {
        for (
          k = 0;
          self[_data][k * self[_m] + j] !== 0 && k < self[_n];
          k += 1
        )
          ;
        if (k >= self[_n]) {
          j += 1;
          continue;
        }
        swapRows(self, j, k);
        swapRows(inverse, j, k);
      }
      divideRow(self, inverse, j, self[_data][j * self[_m] + j]);
      subtractRowMultiple(self, inverse, i, j);
    }
    return inverse;
  }

  /**
   * Returns a copy of the matrix.
   *
   * @return {Matrix<n,m>} Fresh clone
   */
  clone() {
    return new Matrix(this[_n], this[_m], this[_data].slice());
  }

  /**
   * Horizontally stacks `other` and returns the new matrix.
   *
   * @param {Matrix<n,k>} other Matrix whose rows === this's rows
   * @return {Matrix<n,m+k>} Horizontal concatenation of this and other
   * @throws {Error} If dimensions do not match
   */
  hstack(other) {
    if (this[_n] !== other[_n]) {
      throw new Error('Dimensions do not match');
    }

    var newM = this[_m] + other[_m]
      , stacked = new Matrix(this[_n], newM)
      , i, j;

    for (i = 0; i < this[_n]; i += 1) {
      for (j = 0; j < this[_m]; j += 1) {
        stacked[_data][i*newM + j] = this[_data][i*this[_m] + j];
      }
      for (j = 0; j < other[_m]; j += 1) {
        stacked[_data][i*newM + this[_m]+j] = other[_data][i*other[_m] + j];
      }
    }
    return stacked;
  }

  /**
   * Vertically stacks `other` and returns the new matrix.
   *
   * @param {Matrix<k,m>} other Matrix whose cols === this's cols
   * @return {Matrix<n+k,m>} Vertical concatenation of this and other
   * @throws {Error} If dimensions do not match
   */
  vstack(other) {
    if (this[_m] !== other[_m]) {
      throw new Error('Dimensions do not match');
    }

    var stacked = new Matrix(this[_n] + other[_n], this[_m]);

    stacked[_data].subarray(0, this[_n] * this[_m]).set(this[_data]);
    stacked[_data].subarray(this[_n] * this[_m]).set(other[_data]);
    return stacked;
  }

  /**
   * Performs element-wise exponentiation to the matrix and returns a new copy.
   *
   * @param {number} exponent Power to raise each element to
   * @return {Matrix<n,m>} this[i,i]^exponent
   */
  dotPow(exponent) {
    var powd = this.clone()
      , i;

    for (i = 0; i < powd[_data].length; i += 1) {
      powd[_data][i] = Math.pow(powd[_data][i], exponent);
    }
    return powd;
  }

  /**
   * Performs element-wise multiplication to the matrix and returns a new copy.
   *
   * @param {number | Matrix} n Multiplicand to multiply each element by, or a
   *                            matrix whose elements will be iterated through
   *                            in alignment with this
   * @return {Matrix<n,m>} this[i,i] * n   OR   this[i,i] * n[i,i]
   */
  dotMultiply(n) {
    var product = this.clone()
      , i;

    if (typeof n === 'number') {
      for (i = 0; i < product[_data].length; i += 1) {
        product[_data][i] = product[_data][i] * n;
      }
    } else if (n instanceof Matrix) {
      for (i = 0; i < product[_data].length; i += 1) {
        product[_data][i] = product[_data][i] * n[_data][i];
      }
    }
    return product;
  }

  /**
   * Performs element-wise division to the matrix and returns a new copy.
   *
   * @param {number | Matrix} n Divisor to divide each element by, or a matrix
   *                            whose elements will be iterated through in
   *                            alignment with this
   * @return {Matrix<n,m>} this[i,i] / n   OR   this[i,i] / n[i,i]
   */
  dotDivide(n) {
    var product = this.clone()
      , i, j;

    if (typeof n === 'number') {
      for (i = 0; i < product[_data].length; i += 1) {
        product[_data][i] = product[_data][i] / n;
      }
    } else if (n instanceof Matrix) {
      for (i = 0, j = 0; i < product[_data].length; i += 1, j += 1) {
        if (j >= n[_data].length) {
          j = 0;
        }
        product[_data][i] = product[_data][i] / n[_data][j];
      }
    }
    return product;
  }

  dotInv() {
    var inverse = this.clone()
      , i;

    for (i = 0; i < this[_data].length; i += 1) {
      inverse[_data][i] = 1.0 / inverse[_data][i];
    }
    return inverse;
  }

  /** * Stringifies the matrix into a (somewhat) pretty format
   *
   * @return {string} Representation of the matrix /
   */
  toString() {
    var str = '';
    var colSizes = [];
    var i, j, max, n;

    for (j = 0; j < this[_m]; j += 1) {
      for (max = 0, i = 0; i < this[_n]; i += 1) {
        max = Math.max(max, (''+this[_data][i * this[_m] + j]).length);
      }
      colSizes.push(max);
    }

    for (i = 0; i < this[_n]; i += 1) {
      for (j = 0; j < this[_m] - 1; j += 1) {
        n = ''+this[_data][i * this[_m] + j];
        str += Array(colSizes[j] - n.length + 1).join(' ') + n + ' ';
      }
      n = ''+this[_data][i * this[_m] + j];
      str += Array(colSizes[j] - n.length + 1).join(' ') + n + '\n';
    }
    return str;
  }

  /**
   * Retrieves the ith column of the matrix
   *
   * @param {number} i Column index
   * @return {Matrix<n,1>} Column as a matrix
   */
  col(i) {
    var theCol = new Matrix(this[_n], 1)
      , k;

    for (k = 0; k < this[_n]; k += 1) {
      theCol[_data][k] = this[_data][k * this[_m] + i];
    }
    return theCol;
  }

  /**
   * Retrieves the ith row of the matrix
   *
   * @param {number} i Row index
   * @return {Matrix<1,m>} Row as a matrix
   */
  row(i) {
    return new Matrix(
      1, this[_m],
      this[_data].slice(i * this[_m], (i+1) * this[_m])
    );
  }

  /**
   * Retrieves a subset of the matrix, constructed from indices in `rows` and
   * `cols`. The resulting matrix will have rows s.t. result[i] = this[rows[i]]
   * and columns s.t. result[i][j] = this[rows[i][cols[j]]]
   *
   * @param {number[]} rows Array of indices used to construct the subset
   * @param {number[]} cols Array of indices used to construct the subset
   * @return {Matrix<rows.length, cols.length>} Subset of this
   */
  subset(rows, cols) {
    rows = utils.convertRange(rows, this[_n]);
    cols = utils.convertRange(cols, this[_m]);

    var subMatrix = new Matrix(rows.length, cols.length)
      , i, j;

    for (i = 0; i < rows.length; i += 1) {
      for (j = 0; j < rows.length; j += 1) {
        subMatrix[_data][i * subMatrix[_m] + j] =
          this[_data][rows[i] * this[_m] + cols[j]];
      }
    }
    return subMatrix;
  }

  /**
   * Retrieves the diagonal elements as a 1 x min(n, m) matrix.
   *
   * @return {Matrix<1,min(n,m)>} Diagonal elements
   */
  diag() {
    var diagonal = new Matrix(1, Math.min(this[_n], this[_m]))
      , i;

    for (i = 0; i < this[_n] && i < this[_m]; i += 1) {
      diagonal[_data][i] = this[_data][i * this[_m] + i];
    }
    return diagonal;
  }

  abs() {
    var absolute = this.clone()
      , i;

    for (i = 0; i < absolute[_data].length; i += 1) {
      absolute[_data][i] = Math.abs(absolute[_data][i]);
    }
    return absolute;
  }

  /**
   * Sums all of the elements.
   *
   * @return {number} Sum of all of the elements
   */
  sum() {
    var tot = 0
      , i;

    for (i = 0; i < this[_data].length; i += 1) {
      tot += this[_data][i];
    }
    return tot;
  }

  /**
   * @property {Matrix<m,n>} T The transposition of the matrix
   */
  get T() {
    var transpose = new Matrix(this[_m], this[_n])
      , i, j;

    for (i = 0; i < this[_n]; i += 1) {
      for (j = 0; j < this[_m]; j += 1) {
        transpose[_data][j * this[_n] + i] = this[_data][i * this[_m] + j];
      }
    }
    return transpose;
  }

  /**
   * @property {[number, number]} shape The shape of this matrix [n, m]
   */
  get shape() {
    return [this[_n], this[_m]];
  }

  /**
   * @property {Float64Array} data The underlying storage for the matrix
   */
  get data() {
    return this[_data];
  }

  /**
   * Generates a matrix full of random (0, 1) numbers.
   *
   * @static
   * @return {Matrix<n,m>} Matrix full'a random numbas
   */
  static random(n, m) {
    var randMatrix = new Matrix(n, m)
      , i, j;

    for (i = 0; i < n; i += 1) {
      for (j = 0; j < m; j += 1) {
        randMatrix[_data][i * m + j] = Math.random();
      }
    }
    return randMatrix;
  }

  /**
   * Generates a matrix whose diagonal elements equal 1.
   *
   * @static
   * @return {Matrix<n,m>} Diagonal onez
   */
  static eye(n, m=n) {
    var onez = new Matrix(n, m)
      , i, j;

    for (i = 0; i < n; i += 1) {
      onez[_data][i * m + i] = 1;
    }
    return onez;
  }

  /**
   * Creates a matrix from matrix-looking nested arrays, or a flat array and the
   * given `n` and `m`.
   *
   * @param {iterable | Matrix} arr Values to populate the matrix with
   * @param {number}            n   Rows in the new matrix
   * @param {number}            m   Columns in the new matrix
   */
  static from(arr, n, m) {
    if (arr instanceof Matrix) {
      return arr.clone();
    }
    if (!Array.isArray(arr)) {
      throw new TypeError('Expected an array or Matrix');
    }

    var i;

    n = n || arr.length;
    m = m || arr[0].length;

    // handed a 1-d array
    if (arr[0].length == null) {
      return new Matrix(1, arr.length, Float64Array.from(arr));
    }

    // otherwise, it's a 2-d array (and hopefully not >2-d)
    for (i = 0; i < arr.length; i += 1) {
      if (arr[i].length !== m) {
        throw new Error('All rows must have equal length');
      }
    }
    return new Matrix(n, m, Float64Array.from([].concat.apply([], arr)));
  }

  static diag(arr) {
    var n = arr.length
      , mat = new Matrix(n, n)
      , i;

    for (i = 0; i < n; i += 1) {
      mat.data[i*n+i] = arr[i];
    }
    return mat;
  }

}

module.exports = Matrix;
