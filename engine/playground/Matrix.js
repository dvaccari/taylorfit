
const utils = require('./utils.es6');

const _data = Symbol('data');
const _n    = Symbol('n');
const _m    = Symbol('m');


function swapRows(m, i, j) {
  var k, temp;

  for (k = 0; k < m[_m]; k += 1) {
    temp = m[_data][j * m[_m] + k];
    m[_data][j * m[_m] + k] = m[_data][i * m[_m] + k];
    m[_data][i * m[_m] + k] = temp;
  }
}

function divideRow(m, inv, i, factor) {
  var k, temp;

  for (k = 0; k < m[_m]; k += 1) {
    m[_data][i * m[_m] + k] /= factor;
    inv[_data][i * m[_m] + k] /= factor;
  }
}

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


class Matrix {

  constructor(n, m, stuff) {
    if (Array.isArray(n)) {
      return Matrix.from(n);
    }
    if (stuff != null) {
      stuff = (stuff instanceof Float64Array)
              ? stuff
              : Float64Array.from(stuff);
    } else {
      stuff = new Float64Array(n * m);
    }
    this[_data] = stuff;
    this[_n] = n;
    this[_m] = m;
    return this;
  }

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

  clone() {
    return new Matrix(this[_n], this[_m], this[_data].slice());
  }

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

  vstack(other) {
    if (this[_m] !== other[_m]) {
      throw new Error('Dimensions do not match');
    }

    var stacked = new Matrix(this[_n] + other[_n], this[_m]);

    stacked[_data].subarray(0, this[_n] * this[_m]).set(this[_data]);
    stacked[_data].subarray(this[_n] * this[_m]).set(other[_data]);
    return stacked;
  }

  dotPow(exponent) {
    var powd = this.clone()
      , i;

    for (i = 0; i < powd[_data].length; i += 1) {
      powd[_data][i] = Math.pow(powd[_data][i], exponent);
    }
    return powd;
  }

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

  dotDivide(n) {
    var product = this.clone()
    , i;

    if (typeof n === 'number') {
      for (i = 0; i < product[_data].length; i += 1) {
        product[_data][i] = product[_data][i] / n;
      }
    } else if (n instanceof Matrix) {
      for (i = 0; i < product[_data].length; i += 1) {
        product[_data][i] = product[_data][i] / n[_data][i];
      }
    }
    return product;
  }

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

  col(i) {
    var theCol = new Matrix(this[_n], 1)
      , k;

    for (k = 0; k < this[_n]; k += 1) {
      theCol[_data][k] = this[_data][k * this[_m] + i];
    }
    return theCol;
  }

  row(i) {
    return new Matrix(
      1, this[_m],
      this[_data].slice(i * this[_m], (i+1) * this[_m])
    );
  }

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

  diag() {
    var diagonal = new Matrix(1, Math.min(this[_n], this[_m]))
      , i;

    for (i = 0; i < this[_n] && i < this[_m]; i += 1) {
      diagonal[_data][i] = this[_data][i * this[_m] + i];
    }
    return diagonal;
  }

  sum() {
    var tot = 0
      , i;

    for (i = 0; i < this[_data].length; i += 1) {
      tot += this[_data][i];
    }
    return tot;
  }

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

  get shape() {
    return [this[_n], this[_m]];
  }

  get data() {
    return this[_data];
  }

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

  static eye(n, m=n) {
    var onez = new Matrix(n, m)
      , i, j;

    for (i = 0; i < n; i += 1) {
      onez[_data][i * m + i] = 1;
    }
    return onez;
  }

  static from(arr, n, m) {
    if (!Array.isArray(arr)) {
      throw new TypeError('Expected an array');
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

}

module.exports = Matrix;
