
const utils = require('../utils.es6');

/**
 * Private members
 *
 * @private
 */
const _data = Symbol('data');
const _m    = Symbol('m');
const _n    = Symbol('n');

// Maximum number of decimal points to print
const PRINT_DECIMALS = 5;


/**
 * Swap rows `i` and `j` in matrix `m` in place.
 *
 * @param {Matrix} m
 * @param {number} i
 * @param {number} j
 */
function swapRows(m, i, j) {
  var k, temp;

  for (k = 0; k < m[_n]; k += 1) {
    temp = m[_data][j * m[_n] + k];
    m[_data][j * m[_n] + k] = m[_data][i * m[_n] + k];
    m[_data][i * m[_n] + k] = temp;
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

  for (k = 0; k < m[_n]; k += 1) {
    m[_data][i * m[_n] + k] /= factor;
    inv[_data][i * m[_n] + k] /= factor;
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

  for (l = 0; l < m[_m]; l += 1) {
    factor = m[_data][l * m[_n] + j];

    if (l !== i) {
      for (k = 0; k < m[_n]; k += 1) {
        m[_data][l * m[_n] + k] -= m[_data][i * m[_n] + k] * factor;
        inv[_data][l * m[_n] + k] -= inv[_data][i * m[_n] + k] * factor;
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
  constructor(m, n, stuff) {
    if (m instanceof Matrix) {
      return m;
    }
    if (Array.isArray(m)) {
      return Matrix.from(m);
    }
    if (stuff != null) {
      stuff = (stuff instanceof Float64Array)
              ? stuff
              : Float64Array.from(stuff);
      if (stuff.length !== m * n) {
        throw new Error('Array does not match the specified dimensions');
      }
    } else {
      stuff = new Float64Array(m * n);
    }
    this[_data] = stuff;
    this[_m] = m;
    this[_n] = n;
    return this;
  }

  /**
   * Retrieve the element at the ith row and jth column.
   *
   * @param {number} i s.t. 0 <= i < m
   * @param {number} j s.t. 0 <= i < n
   * @return {number} Element at (i, j)
   */
  get(i, j) {
    return this[_data][i * this[_n] + j];
  }

  /**
   * Set the element at the ith row and jth column.
   *
   * @param {number} i s.t. 0 <= i < m
   * @param {number} j s.t. 0 <= i < n
   * @param {number} value To replace the existing one
   * @return {number} Element at (i, j)
   */
  set(i, j, value) {
    return this[_data][i * this[_n] + j] = value;
  }

  /**
   * Performs element-wise addition between two matrices and returns a new copy.
   *
   * @param {Matrix<m,n>} other Matrix with equivalent dimensions to this
   * @return {Matrix<m,n>} this + other
   * @throws {Error} If dimensions do not match
   */
  add(other) {
    if (this[_m] !== other[_m] || this[_n] !== other[_n]) {
      throw new Error('Dimensions (' + this.shape +
                      ') and (' + other.shape + ') do not match: ' +
                      this[_n] + ' !== ' + other[_m] + ' && ' +
                      this[_m] + ' !== ' + other[_m]);
    }

    var sum = this.clone()
      , i;

    for (i = 0; i < sum[_data].length; i += 1) {
      sum[_data][i] += other[_data][i];
    }
    return sum;
  }

  /**
   * Performs element-wise subtraction between two matrices and returns a new
   * copy.
   *
   * @param {Matrix<m,n>} other Matrix with equivalent dimensions to this
   * @return {Matrix<m,n>} this - other
   * @throws {Error} If dimensions do not match
   */
  sub(other) {
    if (this[_m] !== other[_m] || this[_n] !== other[_n]) {
      throw new Error('Dimensions (' + this.shape +
                      ') and (' + other.shape + ') do not match: ' +
                      this[_n] + ' !== ' + other[_m] + ' && ' +
                      this[_m] + ' !== ' + other[_m]);
    }

    var sum = this.clone()
    , i;

    for (i = 0; i < sum[_data].length; i += 1) {
      sum[_data][i] -= other[_data][i];
    }
    return sum;
  }

  /**
   * Performs matrix multiplication between this and other.
   *
   * @param {Matrix<n,k>} other Matrix whose rows must be === to this's columns
   * @return {Matrix<m,k>} this * other
   * @throws {Error} If dimensions do not match
   */
  dot(other) {
    if (this[_n] !== other[_m]) {
      throw new Error('Dimensions (' + this.shape +
                      ') and (' + other.shape + ') do not match: ' +
                      this[_n] + ' !== ' + other[_m]);
    }

    var product = new Matrix(this[_m], other[_n])
      , i, j, k, sum;

    for (i = 0; i < this[_m]; i += 1) {
      for (j = 0; j < other[_n]; j += 1) {
        for (k = 0, sum = 0; k < this[_n]; k += 1) {
          sum += this[_data][i * this[_n] + k] *
                 other[_data][k * other[_n] + j];
        }
        product[_data][i * other[_n] + j] = sum;
      }
    }
    return product;
  }

  /**
   * Computes the inverse of the matrix (only if it is square!).
   *
   * @return {Matrix<m,n>} Inverse matrix s.t. this * inv(this) === I
   * @throws {Error} If not a square matrix
   */
  inv() {
    if (this[_m] !== this[_n]) {
      throw new Error('Must be square');
    }

    var self = this.clone()
      , inverse = Matrix.eye(this[_m], this[_n])
      , i, j, k, factor;

    for (i = 0, j = 0; i < self[_m] && j < self[_n]; i += 1, j += 1) {
      if (self[_data] === 0) {
        for (
          k = 0;
          self[_data][k * self[_n] + j] !== 0 && k < self[_m];
          k += 1
        )
          ;
        if (k >= self[_m]) {
          j += 1;
          continue;
        }
        swapRows(self, j, k);
        swapRows(inverse, j, k);
      }
      divideRow(self, inverse, j, self[_data][j * self[_n] + j]);
      subtractRowMultiple(self, inverse, i, j);
    }
    return inverse;
  }

  /**
   * Returns a copy of the matrix.
   *
   * @return {Matrix<m,n>} Fresh clone
   */
  clone() {
    return new Matrix(this[_m], this[_n], this[_data].slice());
  }

  /**
   * Horizontally stacks `other` and returns the new matrix.
   *
   * @param {Matrix<m,k>} other Matrix whose rows === this's rows
   * @return {Matrix<m,n+k>} Horizontal concatenation of this and other
   * @throws {Error} If dimensions do not match
   */
  hstack(other) {
    if (this[_m] !== other[_m]) {
      throw new Error('Dimensions (' + this.shape +
                      ') and (' + other.shape + ') do not match: ' +
                      this[_m] + ' !== ' + other[_m]);
    }

    var newM = this[_n] + other[_n]
      , stacked = new Matrix(this[_m], newM)
      , i, j;

    for (i = 0; i < this[_m]; i += 1) {
      for (j = 0; j < this[_n]; j += 1) {
        stacked[_data][i*newM + j] = this[_data][i*this[_n] + j];
      }
      for (j = 0; j < other[_n]; j += 1) {
        stacked[_data][i*newM + this[_n]+j] = other[_data][i*other[_n] + j];
      }
    }
    return stacked;
  }

  /**
   * Vertically stacks `other` and returns the new matrix.
   *
   * @param {Matrix<k,n>} other Matrix whose cols === this's cols
   * @return {Matrix<m+k,n>} Vertical concatenation of this and other
   * @throws {Error} If dimensions do not match
   */
  vstack(other) {
    if (this[_n] !== other[_n]) {
      throw new Error('Dimensions (' + this.shape +
                      ') and (' + other.shape + ') do not match: ' +
                      this[_n] + ' !== ' + other[_n]);
    }

    var stacked = new Matrix(this[_m] + other[_m], this[_n]);

    stacked[_data].subarray(0, this[_m] * this[_n]).set(this[_data]);
    stacked[_data].subarray(this[_m] * this[_n]).set(other[_data]);
    return stacked;
  }

  /**
   * Performs element-wise exponentiation to the matrix and returns a new copy.
   *
   * @param {number} exponent Power to raise each element to
   * @return {Matrix<m,n>} this[i,i]^exponent
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
   * @return {Matrix<m,n>} this[i,i] * n   OR   this[i,i] * n[i,i]
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
   * @return {Matrix<m,n>} this[i,i] / n   OR   this[i,i] / n[i,i]
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

  /**
   * @see inspect
   */
  toString() {
    return this.inspect();
  }

  /**
   * Stringifies the matrix into a pretty format
   *
   * @return {string} Representation of the matrix
   */
  inspect(depth, options={ stylize: (x) => ''+x }) {
    var repr = options.stylize(this.constructor.name, 'none')
      , strings = Array.from(this[_data])
          .map((i) => (''+i).match(/(NaN|-?Infinity|-?\d*)\.?(\d*)/))
      , lwidth = Math.max.apply(null, strings.map((match) => match[1].length))
      , rwidth = Math.min(
          Math.max.apply(null, strings.map((match) => match[2].length)),
          PRINT_DECIMALS
        )
      , rows = []
      , i;

    strings = Array.from(this[_data]).map(
      (n) => options.stylize(utils.formatNum(lwidth, rwidth, n), 'number')
    );

    for (i = 0; i < this[_m]; i += 1) {
      rows.push('[ ' + strings.slice(i*this[_n], (i+1)*this[_n]).join(', ') + ' ]');
    }

    return repr + ' ' + utils.padAll(
      this.constructor.name.length + 1,
      rows.join('\n')
    ).trim();
  }

  /**
   * Retrieves/sets the ith column of the matrix
   *
   * @param {number}    i         Column index
   * @param {number[]}  [newCol]  Elements to replace the col with
   * @return {Matrix<m,1>} Column as a matrix
   */
  col(i, newCol) {
    var theCol = new Matrix(this[_m], 1)
      , k;

    if (newCol != null) {
      if (newCol.length > this[_m]) {
        throw new RangeError('newCol cannot be longer than ' + this[_m]);
      }
      for (k = 0; k < this[_m]; k += 1) {
        this[_data][k * this[_n] + i] = newCol[k];
      }
    }

    for (k = 0; k < this[_m]; k += 1) {
      theCol[_data][k] = this[_data][k * this[_n] + i];
    }
    return theCol;
  }

  /**
   * Retrieves/sets the ith row of the matrix
   *
   * @param {number}    i         Row index
   * @param {number[]}  [newRow]  Elements to replace the row with
   * @return {Matrix<1,n>} Row as a matrix
   */
  row(i, newRow) {
    if (newRow != null) {
      if (newRow.length > this[_n]) {
        throw new RangeError('newRow cannot be longer than ' + this[_n]);
      }
      this[_data].subarray(i * this[_n]).set(newRow);
    }
    return new Matrix(
      1, this[_n],
      this[_data].slice(i * this[_n], (i+1) * this[_n])
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
    rows = utils.convertRange(rows, this[_m]);
    cols = utils.convertRange(cols, this[_n]);

    var subMatrix = new Matrix(rows.length, cols.length)
      , i, j;

    for (i = 0; i < rows.length; i += 1) {
      for (j = 0; j < rows.length; j += 1) {
        subMatrix[_data][i * subMatrix[_n] + j] =
          this[_data][rows[i] * this[_n] + cols[j]];
      }
    }
    return subMatrix;
  }

  /**
   * Retrieves the diagonal elements as a 1 x min(m, n) matrix.
   *
   * @return {Matrix<1,min(m,n)>} Diagonal elements
   */
  diag() {
    var diagonal = new Matrix(1, Math.min(this[_m], this[_n]))
      , i;

    for (i = 0; i < this[_m] && i < this[_n]; i += 1) {
      diagonal[_data][i] = this[_data][i * this[_n] + i];
    }
    return diagonal;
  }

  /**
   * Performs `Math.abs()` on each element then returns the resulting matrix.
   *
   * @return {Matrix<m,n>} A clone of `this`, but with the absolute value of
   *                       each element
   */
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
   * @property {Matrix<n,m>} T The transposition of the matrix
   */
  get T() {
    var transpose = new Matrix(this[_n], this[_m])
      , i, j;

    for (i = 0; i < this[_m]; i += 1) {
      for (j = 0; j < this[_n]; j += 1) {
        transpose[_data][j * this[_m] + i] = this[_data][i * this[_n] + j];
      }
    }
    return transpose;
  }

  /**
   * @property {[number, number]} shape The shape of this matrix [m, n]
   */
  get shape() {
    return [this[_m], this[_n]];
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
   * @return {Matrix<m,n>} Matrix full'a random numbas
   */
  static random(m, n) {
    var randMatrix = new Matrix(m, n)
      , i, j;

    for (i = 0; i < m; i += 1) {
      for (j = 0; j < n; j += 1) {
        randMatrix[_data][i * n + j] = Math.random();
      }
    }
    return randMatrix;
  }

  /**
   * Generates a matrix whose diagonal elements equal 1.
   *
   * @static
   * @return {Matrix<m,n>} Diagonal onez
   */
  static eye(m, n=m) {
    var onez = new Matrix(m, n)
      , i, j;

    for (i = 0; i < m; i += 1) {
      onez[_data][i * n + i] = 1;
    }
    return onez;
  }

  /**
   * Creates a matrix from matrix-looking nested arrays, or a flat array and the
   * given `m` and `n`.
   *
   * @param {iterable | Matrix} arr Values to populate the matrix with
   * @param {number}            m   Rows in the new matrix
   * @param {number}            n   Columns in the new matrix
   */
  static from(arr, m, n) {
    if (arr instanceof Matrix) {
      return arr.clone();
    }
    if (!Array.isArray(arr)) {
      throw new TypeError('Expected an array or Matrix');
    }
    if (arr.length <= 0) {
      return new Matrix(0, 0);
    }

    var i;

    m = m || arr.length;
    n = n || arr[0].length;

    // handed a 1-d array
    if (arr[0].length == null) {
      return new Matrix(1, arr.length, Float64Array.from(arr));
    }

    // otherwise, it's a 2-d array (and hopefully not >2-d)
    for (i = 0; i < arr.length; i += 1) {
      if (arr[i].length !== n) {
        throw new Error('All rows must have equal length');
      }
    }
    return new Matrix(m, n, Float64Array.from([].concat.apply([], arr)));
  }

  /**
   * Creates a matrix using `arr` to fill the diagonal elements in order.
   *
   * @param {number[m]} arr Array of numbers
   * @returns {Matrix<m,m>} Matrix consisting only of the diagonal elements
   */
  static diag(arr) {
    var m = arr.length
      , mat = new Matrix(m, m)
      , i;

    for (i = 0; i < m; i += 1) {
      mat.data[i*m+i] = arr[i];
    }
    return mat;
  }

}

module.exports = Matrix;
