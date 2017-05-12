;;(function(){this.global=this;this.window=this})();;
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 12);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/* unknown exports provided */
/* all exports used */
/*!********************************!*\
  !*** ./engine/matrix/index.js ***!
  \********************************/
/***/ (function(module, exports, __webpack_require__) {


module.exports = __webpack_require__(/*! ./Matrix */ 8);

/***/ }),
/* 1 */
/* unknown exports provided */
/* all exports used */
/*!************************************!*\
  !*** ./engine/statistics/index.js ***!
  \************************************/
/***/ (function(module, exports, __webpack_require__) {


const Statistic = __webpack_require__(/*! ./Statistic */ 3);
const topsort = __webpack_require__(/*! ./topsort */ 11);
const definitions = __webpack_require__(/*! ./definitions */ 10);
const metadata = __webpack_require__(/*! ./metadata.json */ 13);

// used for t-stat calculations
//let VdivwSq = V.dotDivide(w).dotPow(2);

const sorted = topsort(definitions);

const noShow = metadata.filter(({ show }) => !show);

module.exports = predefinedStats => {
  let stats = sorted.reduce((calculatedStats, stat) => stat.calc(calculatedStats), predefinedStats);

  /*
  for (let key of noShow) {
    delete stats[key];
  }
   */

  return stats;
};

/***/ }),
/* 2 */
/* unknown exports provided */
/* all exports used */
/*!************************************************!*\
  !*** ./engine/regression/svd-golub-reinsch.js ***!
  \************************************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const Matrix = __webpack_require__(/*! ../matrix */ 0);

function pythag(a, b) {
  var absa = Math.abs(a),
      absb = Math.abs(b);

  return absa > absb ? absa * Math.sqrt(1 + Math.pow(absb / absa, 2)) : absb === 0 ? 0 : absb * Math.sqrt(1 + Math.pow(absa / absb, 2));
}

/**
 * Translation of the SVD algorithm published in Numer. Math. 14, 403-420 (1970)
 * by G. H. Golub and C. Reinsch.
 *
 * Source: http://cs.brown.edu/courses/csci0530/current/homeworks/svd.py
 *
 * @param {Matrix<m,n>} A Matrix to decompose (m >= n)
 * @return {[Matrix<m,m>, Matrix<m,n>, Matrix<n,n>]} [U, E, V] s.t. A = U*E*V
 */
function svd(A) {
  var eps = Number.EPSILON,
      tol = Number.MIN_VALUE / eps;

  if (1.0 + eps <= 1.0) {
    throw new Error('Make eps bigger');
  }
  if (tol <= 0.0) {
    throw new Error('Make tol bigger');
  }

  var itmax = 50,
      u = A.clone(),
      m = u.shape[0],
      n = u.shape[1],
      e = [],
      q = [],
      v = new Matrix(n, n),
      g = 0.0,
      x = 0.0,
      i,
      j,
      k,
      l,
      s,
      f,
      h,
      y,
      iteration,
      gotoTestFConvergence,
      z,
      c,
      l1;

  if (m < n) {
    throw new Error('m is less than n');
  }

  for (i = 0; i < n; i++) {
    e[i] = g;
    s = 0.0;
    l = i + 1;
    for (j = i; j < m; j++) s += u.data[j * n + i] * u.data[j * n + i];
    if (s < tol) {
      g = 0.0;
    } else {
      f = u.data[i * n + i];
      if (f < 0.0) {
        g = Math.sqrt(s);
      } else {
        g = -Math.sqrt(s);
      }
      h = f * g - s;
      u.data[i * n + i] = f - g;
      for (j = l; j < n; j++) {
        s = 0.0;
        for (k = i; k < m; k++) s += u.data[k * n + i] * u.data[k * n + j];
        f = s / h;
        for (k = i; k < m; k++) u.data[k * n + j] = u.data[k * n + j] + f * u.data[k * n + i];
      }
    }
    q[i] = g;
    s = 0.0;
    for (j = l; j < n; j++) s = s + u.data[i * n + j] * u.data[i * n + j];
    if (s <= tol) {
      g = 0.0;
    } else {
      f = u.data[i * n + i + 1];
      if (f < 0.0) {
        g = Math.sqrt(s);
      } else {
        g = -Math.sqrt(s);
      }
      h = f * g - s;
      u.data[i * n + i + 1] = f - g;
      for (j = l; j < n; j++) e[j] = u.data[i * n + j] / h;
      for (j = l; j < m; j++) {
        s = 0.0;
        for (k = l; k < n; k++) s = s + u.data[j * n + k] * u.data[i * n + k];
        for (k = l; k < n; k++) u.data[j * n + k] = u.data[j * n + k] + s * e[k];
      }
    }
    y = Math.abs(q[i]) + Math.abs(e[i]);
    if (y > x) {
      x = y;
    }
  }
  // accumulation of right hand transformations
  for (i = n - 1; i > -1; i--) {
    if (g !== 0) {
      h = g * u.data[i * n + i + 1];
      for (j = l; j < n; j++) v.data[j * n + i] = u.data[i * n + j] / h;
      for (j = l; j < n; j++) {
        s = 0.0;
        for (k = l; k < n; k++) s += u.data[i * n + k] * v.data[k * n + j];
        for (k = l; k < n; k++) v.data[k * n + j] += s * v.data[k * n + i];
      }
    }
    for (j = l; j < n; j++) {
      v.data[i * n + j] = 0.0;
      v.data[j * n + i] = 0.0;
    }
    v.data[i * n + i] = 1.0;
    g = e[i];
    l = i;
  }
  // accumulation of left hand transformations
  for (i = n - 1; i > -1; i--) {
    l = i + 1;
    g = q[i];
    for (j = l; j < n; j++) u.data[i * n + j] = 0.0;
    if (g !== 0.0) {
      h = u.data[i * n + i] * g;
      for (j = l; j < n; j++) {
        s = 0.0;
        for (k = l; k < m; k++) s += u.data[k * n + i] * u.data[k * n + j];
        f = s / h;
        for (k = i; k < m; k++) u.data[k * n + j] += f * u.data[k * n + i];
      }
      for (j = i; j < m; j++) u.data[j * n + i] = u.data[j * n + i] / g;
    } else {
      for (j = i; j < m; j++) u.data[j * n + i] = 0.0;
    }
    u.data[i * n + i] += 1.0;
  }
  // diagonalization of the bidiagonal form
  eps = eps * x;
  for (k = n - 1; k > -1; k--) {
    for (iteration = 0; iteration < itmax; iteration++) {
      // test f splitting
      for (l = k; l > -1; l--) {
        gotoTestFConvergence = false;
        if (Math.abs(e[l]) <= eps) {
          // goto test f convergence
          gotoTestFConvergence = true;
          break;
        }
        if (Math.abs(q[l - 1]) <= eps) {
          // goto cancellation
          break;
        }
      }
      if (!gotoTestFConvergence) {
        // cancellation of e[l] if l>0
        c = 0.0;
        s = 1.0;
        l1 = l - 1;
        for (i = l; i < k + 1; i++) {
          f = s * e[i];
          e[i] = c * e[i];
          if (Math.abs(f) <= eps) {
            // goto test f convergence
            break;
          }
          g = q[i];
          h = pythag(f, g);
          q[i] = h;
          c = g / h;
          s = -f / h;
          for (j = 0; j < m; j++) {
            y = u.data[j * n + l1];
            z = u.data[j * n + i];
            u.data[j * n + l1] = y * c + z * s;
            u.data[j * n + i] = -y * s + z * c;
          }
        }
      }
      // test f convergence
      z = q[k];
      if (l === k) {
        // convergence
        if (z < 0.0) {
          // q[k] is made non-negative
          q[k] = -z;
          for (j = 0; j < n; j++) {
            v.data[j * n + k] = -v.data[j * n + k];
          }
        }
        break; // break out of iteration loop and move on to next k value
      }
      if (iteration >= itmax - 1) {
        throw new Error('SVD: No convergence');
      }
      // shift from bottom 2x2 minor
      x = q[l];
      y = q[k - 1];
      g = e[k - 1];
      h = e[k];
      f = ((y - z) * (y + z) + (g - h) * (g + h)) / (2.0 * h * y);
      g = pythag(f, 1.0);
      if (f < 0) {
        f = ((x - z) * (x + z) + h * (y / (f - g) - h)) / x;
      } else {
        f = ((x - z) * (x + z) + h * (y / (f + g) - h)) / x;
      }
      // next QR transformation
      c = 1.0;
      s = 1.0;
      for (i = l + 1; i < k + 1; i++) {
        g = e[i];
        y = q[i];
        h = s * g;
        g = c * g;
        z = pythag(f, h);
        e[i - 1] = z;
        c = f / z;
        s = h / z;
        f = x * c + g * s;
        g = -x * s + g * c;
        h = y * s;
        y = y * c;
        for (j = 0; j < n; j++) {
          x = v.data[j * n + i - 1];
          z = v.data[j * n + i];
          v.data[j * n + i - 1] = x * c + z * s;
          v.data[j * n + i] = -x * s + z * c;
        }
        z = pythag(f, h);
        q[i - 1] = z;
        c = f / z;
        s = h / z;
        f = c * g + s * y;
        x = -s * g + c * y;
        for (j = 0; j < m; j++) {
          y = u.data[j * n + i - 1];
          z = u.data[j * n + i];
          u.data[j * n + i - 1] = y * c + z * s;
          u.data[j * n + i] = -y * s + z * c;
        }
      }
      e[l] = 0.0;
      e[k] = f;
      q[k] = x;
      // goto test f splitting
    }
  }

  return [u, q, v];
}

module.exports = svd;

/***/ }),
/* 3 */
/* unknown exports provided */
/* all exports used */
/*!****************************************!*\
  !*** ./engine/statistics/Statistic.js ***!
  \****************************************/
/***/ (function(module, exports) {


const defaults = ['X', 'y', 'BHat'];

class Statistic {

  constructor(name, args, fn, description) {
    this.name = name;
    this.args = args;
    this.fn = fn;
  }

  calc(statistics) {
    statistics[this.name] = this.fn(statistics);
    return statistics;
  }

  inspect(depth, options = { stylize: x => '' + x }) {
    return `${this.name}(${this.args})`;
  }

}

module.exports = (...args) => new Statistic(...args);

/***/ }),
/* 4 */
/* unknown exports provided */
/* all exports used */
/*!*************************************************!*\
  !*** ./engine/statistics/distributions-socr.js ***!
  \*************************************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function statcom(q, i, j, b) {
  var zz = 1,
      z = zz,
      k = i;

  while (k <= j) {
    zz *= q * k / (k - b);
    z += zz;
    k += 2;
  }
  return z;
}

/**
 * Two sided T-distribution estimator.
 *
 * Source: https://github.com/SOCR/HTML5_WebSite
 *         (Applets/Normal_T_Chi2_F_Tables.html)
 * License: GNU LGPL
 *
 * @param {Number} t T-statistic for some independent variable
 * @param {Number} n Degrees of freedom
 * @return {Number} 2-tailed p-value for the t statistic ( Pr(t) )
 */
function pt(t, n) {
  t = Math.abs(t);

  var w = t / Math.sqrt(n),
      th = Math.atan(w);

  if (n === 1) {
    return 1 - th / (Math.PI / 2);
  }

  var sth = Math.sin(th),
      cth = Math.cos(th);

  if (n % 2 === 1) {
    return 1 - (th + sth * cth * statcom(cth * cth, 2, n - 3, -1)) / (Math.PI / 2);
  }
  return 1 - sth * statcom(cth * cth, 1, n - 3, -1);
}

/**
 * Fisher's F-density estimator.
 *
 * Source: https://github.com/SOCR/HTML5_WebSite
 *         (Applets/Normal_T_Chi2_F_Tables.html)
 * License: GNU LGPL
 *
 * @param {Number} f  F value for the model
 * @param {Number} n1 # of terms in the model
 * @param {Number} n2 Degrees of freedom
 * @return {Number} Probability of (F < f)
 */
function pf(f, n1, n2) {
  var x = n2 / (n1 * f + n2);

  if (n1 % 2 === 0) {
    return statcom(1 - x, n2, n1 + n2 - 4, n2 - 2) * Math.pow(x, n2 / 2);
  }
  if (n2 % 2 === 0) {
    return 1 - statcom(x, n1, n1 + n2 - 4, n1 - 2) * Math.pow(1 - x, n1 / 2);
  }

  var th = Math.atan(Math.sqrt(n1 * f / n2)),
      a = th / (Math.PI / 2),
      sth = Math.sin(th),
      cth = Math.cos(th);

  if (n2 > 1) {
    a += sth * cth * statcom(cth * cth, 2, n2 - 3, -1) / (Math.PI / 2);
  }
  if (n1 === 1) {
    return 1 - a;
  }

  var c = 4 * statcom(sth * sth, n2 + 1, n1 + n2 - 4, n2 - 2) * sth * Math.pow(cth, n2) / Math.PI;

  if (n2 === 1) {
    return 1 - a + c / 2;
  }

  var k = 2;

  while (k <= (n2 - 1) / 2) {
    c *= k / (k - 0.5);
    k += 1;
  }
  return 1 - a + c;
}

module.exports.pt = pt;
module.exports.pf = pf;

/***/ }),
/* 5 */
/* unknown exports provided */
/* all exports used */
/*!*************************!*\
  !*** ./engine/utils.js ***!
  \*************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function nchars(n, char) {
  n = Math.max(0, n);
  return Array(n + 1).join(char);
}

let nspaces = n => nchars(n, ' ');

function pad(width, val) {
  val = val || '';
  return nspaces(width - ('' + val).length) + val;
}

let range = module.exports.range = (start, end) => {
  if (start >= end) {
    return [];
  }
  return Array(end - start).join(' ').split(' ').map((_, i) => i + start);
};

let zeros = module.exports.zeros = n => Array(n).join(' ').split(' ').map(() => 0);

let sum = module.exports.sum = arr => arr.reduce((tot, curr) => tot + curr);

module.exports.convertRange = (str, length) => {
  var range, start, end;

  if (typeof str === 'number') {
    return str < 0 ? [length + str] : [str];
  }
  if (typeof str !== 'string') {
    return str.map(ind => ind < 0 ? length + ind : ind);
  }

  if ((range = str.split(':')).length > 1) {
    start = parseInt(range[0]) || 0;
    end = parseInt(range[1]) || length;

    if (start < 0) {
      start = length + start;
    }
    if (end < 0) {
      end = length + end;
    }
    return module.exports.range(start, end);
  }

  throw new TypeError('Invalid range');
};

module.exports.formatNum = (leftwidth, rightwidth, val, nilDecimalChar = ' ') => {
  val = '' + val;
  var match = val.match(/(NaN|-?Infinity|-?\d*)\.?(\d*)/),
      whole = match[1],
      frac = match[2],
      repr = '';

  if (frac.length > rightwidth) {
    frac = frac.slice(0, rightwidth);
  }
  repr += nspaces(leftwidth - whole.length) + whole;
  if (frac !== '' || rightwidth > 0) {
    repr += '.';
    repr += frac.slice(0, rightwidth) + nchars(rightwidth - frac.length, nilDecimalChar);
  } else {
    repr += nspaces(rightwidth + 1);
  }
  return repr;
};

let padAll = module.exports.padAll = (lwidth, str) => {
  if (Array.isArray(str)) {
    return str.map(s => padAll(lwidth + s.length, s));
  } else if (typeof str === 'string') {
    return str.split('\n').map(s => pad(lwidth + s.length, s)).join('\n');
  }
  return pad(lwidth, str);
};

let clone = module.exports.clone = obj => {
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(clone);
  }

  let newObj = {};
  Object.keys(obj).forEach(key => newObj[key] = clone(obj[key]));
  return newObj;
};

let split = module.exports.split = (arr, n) => {
  let results = range(0, n).map(() => []);
  let i;

  for (i = 0; i < arr.length; i += 1) {
    results[i % n].push(arr[i]);
  }
  return results;
};

let splitToSize = module.exports.splitToSize = (arr, n) => {
  let results = [];
  let subset;
  let i;

  for (i = 0, subset = []; i < arr.length; i += 1) {
    subset.push(arr[i]);
    if ((i + 1) % n === 0) {
      results.push(subset);
      subset = [];
    }
  }
  if (i % n !== 0) {
    results.push(subset);
  }
  return results;
};

module.exports.join = arr => [].concat.apply([], arr);

module.exports.sign = x => x < 0 ? -1 : x > 0 ? 1 : 0;

module.exports.argmax = arr => arr.indexOf(Math.max.apply(null, arr));

/***/ }),
/* 6 */
/* unknown exports provided */
/* all exports used */
/*!************************************!*\
  !*** ./engine/regression/index.js ***!
  \************************************/
/***/ (function(module, exports, __webpack_require__) {


// lstsqSVD | lstsqNE
const METHOD = 'lstsqSVD';

module.exports.svd = __webpack_require__(/*! ./svd-golub-reinsch */ 2);
module.exports.lstsq = __webpack_require__(/*! ./lstsq */ 9)[METHOD];

/***/ }),
/* 7 */
/* unknown exports provided */
/* all exports used */
/*!*************************************!*\
  !*** ./engine/worker/subworkers.js ***!
  \*************************************/
/***/ (function(module, exports, __webpack_require__) {

(function () {

  /* Detect if we're in a worker or not */
  var isWorker = false;
  try {
    document;
  } catch (e) {
    isWorker = true;
  }

  if (isWorker) {
    // For some reason, nested workers on firefox sucks. So, just polyfill all
    // of the browsers to make this work
    if (true /* we don't really need to check this */) {
        self.Worker = function (path) {
          var that = this;
          this.id = Math.random().toString(36).substr(2, 5);

          this.eventListeners = {
            "message": []
          };
          self.addEventListener("message", function (e) {
            if (e.data._from === that.id) {
              var newEvent = new MessageEvent("message");
              newEvent.initMessageEvent("message", false, false, e.data.message, that, "", null, []);
              that.dispatchEvent(newEvent);
              if (that.onmessage) {
                that.onmessage(newEvent);
              }
            }
          });

          var location = self.location.pathname;
          var absPath = path; //location.substring(0, location.lastIndexOf('/')) + '/' + path;
          self.postMessage({
            _subworker: true,
            cmd: 'newWorker',
            id: this.id,
            path: absPath
          });
        };
        Worker.prototype = {
          onerror: null,
          onmessage: null,
          postMessage: function (message) {
            self.postMessage({
              _subworker: true,
              id: this.id,
              cmd: 'passMessage',
              message: message
            });
          },
          terminate: function () {
            self.postMessage({
              _subworker: true,
              cmd: 'terminate',
              id: this.id
            });
          },
          addEventListener: function (type, listener, useCapture) {
            if (this.eventListeners[type]) {
              this.eventListeners[type].push(listener);
            }
          },
          removeEventListener: function (type, listener, useCapture) {
            if (!(type in this.eventListeners)) return;
            var index = this.eventListeners[type].indexOf(listener);
            if (index !== -1) {
              this.eventListeners[type].splice(index, 1);
            }
          },
          dispatchEvent: function (event) {
            var listeners = this.eventListeners[event.type];
            for (var i = 0; i < listeners.length; i++) {
              listeners[i](event);
            }
          }
        };
      }
  }

  var allWorkers = {};
  var cmds = {
    newWorker: function (event) {
      var worker = new Worker(event.data.path);
      worker.addEventListener("message", function (e) {
        var envelope = {
          _from: event.data.id,
          message: e.data
        };
        event.target.postMessage(envelope);
      });
      allWorkers[event.data.id] = worker;
    },
    terminate: function (event) {
      allWorkers[event.data.id].terminate();
    },
    passMessage: function (event) {
      allWorkers[event.data.id].postMessage(event.data.message);
    }
  };
  var messageRecieved = function (event) {
    if (event.data._subworker) {
      cmds[event.data.cmd](event);
    }
  };

  /* Hijack Worker */
  var oldWorker = window.Worker;
  window.Worker = function (path) {

    var blobIndex = path.indexOf('blob:');

    if (blobIndex !== -1 && blobIndex !== 0) {
      path = path.substring(blobIndex);
    }

    var newWorker = new oldWorker(path);
    newWorker.addEventListener("message", messageRecieved);

    return newWorker;
  };
})();

/***/ }),
/* 8 */
/* unknown exports provided */
/* all exports used */
/*!*********************************!*\
  !*** ./engine/matrix/Matrix.js ***!
  \*********************************/
/***/ (function(module, exports, __webpack_require__) {


const utils = __webpack_require__(/*! ../utils */ 5);

/**
 * Private members
 *
 * @private
 */
const _data = Symbol('data');
const _m = Symbol('m');
const _n = Symbol('n');

// Maximum number of decimal points to print
const PRINT_DECIMALS = 5;

// Number.MAX_SAFE_INTEGER value [ i.e. doesn't support :( ]
const MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

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
      stuff = stuff instanceof Float64Array ? stuff : Float64Array.from(stuff);
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
   * @param {number | Matrix<m,n>} other  Scalar or Matrix with equivalent
   *                                      dimensions to this
   * @return {Matrix<m,n>} this + other
   * @throws {Error} If dimensions do not match
   */
  add(other) {
    var sum = this.clone(),
        i;

    if (typeof other === 'number') {
      for (i = 0; i < sum[_data].length; i += 1) {
        sum[_data][i] += other;
      }
    } else {
      if (this[_m] !== other[_m] || this[_n] !== other[_n]) {
        throw new Error('Dimensions (' + this.shape + ') and (' + other.shape + ') do not match: ' + this[_n] + ' !== ' + other[_m] + ' && ' + this[_m] + ' !== ' + other[_m]);
      }

      for (i = 0; i < sum[_data].length; i += 1) {
        sum[_data][i] += other[_data][i];
      }
    }
    return sum;
  }

  /**
   * Performs element-wise subtraction between two matrices and returns a new
   * copy.
   *
   * @param {number | Matrix<m,n>} other  Scalar or Matrix with equivalent
   *                                      dimensions to this
   * @return {Matrix<m,n>} this - other
   * @throws {Error} If dimensions do not match
   */
  sub(other) {
    var sum = this.clone(),
        i;

    if (typeof other === 'number') {
      for (i = 0; i < sum[_data].length; i += 1) {
        sum[_data][i] -= other;
      }
    } else {
      if (this[_m] !== other[_m] || this[_n] !== other[_n]) {
        throw new Error('Dimensions (' + this.shape + ') and (' + other.shape + ') do not match: ' + this[_n] + ' !== ' + other[_m] + ' && ' + this[_m] + ' !== ' + other[_m]);
      }

      for (i = 0; i < sum[_data].length; i += 1) {
        sum[_data][i] -= other[_data][i];
      }
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
      throw new Error('Dimensions (' + this.shape + ') and (' + other.shape + ') do not match: ' + this[_n] + ' !== ' + other[_m]);
    }

    var product = new Matrix(this[_m], other[_n]),
        i,
        j,
        k,
        sum;

    for (i = 0; i < this[_m]; i += 1) {
      for (j = 0; j < other[_n]; j += 1) {
        for (k = 0, sum = 0; k < this[_n]; k += 1) {
          sum += this[_data][i * this[_n] + k] * other[_data][k * other[_n] + j];
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

    var self = this.clone(),
        inverse = Matrix.eye(this[_m], this[_n]),
        i,
        j,
        k,
        factor;

    for (i = 0, j = 0; i < self[_m] && j < self[_n]; i += 1, j += 1) {
      if (self[_data] === 0) {
        for (k = 0; self[_data][k * self[_n] + j] !== 0 && k < self[_m]; k += 1);
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
      throw new Error('Dimensions (' + this.shape + ') and (' + other.shape + ') do not match: ' + this[_m] + ' !== ' + other[_m]);
    }

    var newM = this[_n] + other[_n],
        stacked = new Matrix(this[_m], newM),
        i,
        j;

    for (i = 0; i < this[_m]; i += 1) {
      for (j = 0; j < this[_n]; j += 1) {
        stacked[_data][i * newM + j] = this[_data][i * this[_n] + j];
      }
      for (j = 0; j < other[_n]; j += 1) {
        stacked[_data][i * newM + this[_n] + j] = other[_data][i * other[_n] + j];
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
      throw new Error('Dimensions (' + this.shape + ') and (' + other.shape + ') do not match: ' + this[_n] + ' !== ' + other[_n]);
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
    var powd = this.clone(),
        i;

    for (i = 0; i < powd[_data].length; i += 1) {
      powd[_data][i] = Math.pow(powd[_data][i], exponent);
      if (!Number.isFinite(powd[_data][i])) {
        powd[_data][i] = MAX_SAFE_INTEGER;
      }
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
    var product = this.clone(),
        i;

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
    var product = this.clone(),
        i,
        j;

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
   * Converts to nested array format
   *
   * @return {[][]} Nested arrays, where each child array is a row
   */
  toJSON() {
    let i, rows;

    for (i = 1, rows = []; i < this[_m]; i += 1) {
      rows.push(Array.from(this[_data].slice((i - 1) * this[_n], i * this[_n])));
    }
    return rows;
  }

  /**
   * Stringifies the matrix into a pretty format
   *
   * @return {string} Representation of the matrix
   */
  inspect(depth, options = { stylize: x => '' + x }) {
    var repr = options.stylize(this.constructor.name, 'none'),
        strings = Array.from(this[_data]).map(i => ('' + i).match(/(NaN|-?Infinity|-?\d*)\.?(\d*)/)),
        lwidth = Math.max.apply(null, strings.map(match => match[1].length)),
        rwidth = Math.min(Math.max.apply(null, strings.map(match => match[2].length)), PRINT_DECIMALS),
        rows = [],
        i;

    strings = Array.from(this[_data]).map(n => options.stylize(utils.formatNum(lwidth, rwidth, n), 'number'));

    for (i = 0; i < this[_m]; i += 1) {
      rows.push('[ ' + strings.slice(i * this[_n], (i + 1) * this[_n]).join(', ') + ' ]');
    }

    return repr + ' ' + utils.padAll(this.constructor.name.length + 1, rows.join('\n')).trim();
  }

  /**
   * Retrieves/sets the ith column of the matrix
   *
   * @param {number}    i         Column index
   * @param {number[]}  [newCol]  Elements to replace the col with
   * @return {Matrix<m,1>} Column as a matrix
   */
  col(i, newCol) {
    var theCol = new Matrix(this[_m], 1),
        k;

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
    return new Matrix(1, this[_n], this[_data].slice(i * this[_n], (i + 1) * this[_n]));
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
  subset(rows = ':', cols = ':') {
    rows = utils.convertRange(rows, this[_m]);
    cols = utils.convertRange(cols, this[_n]);

    var subMatrix = new Matrix(rows.length, cols.length),
        i,
        j;

    for (i = 0; i < rows.length; i += 1) {
      for (j = 0; j < cols.length; j += 1) {
        subMatrix[_data][i * subMatrix[_n] + j] = this[_data][rows[i] * this[_n] + cols[j]];
      }
    }
    return subMatrix;
  }

  // TODO: document
  lo(row = 0) {
    return new Matrix(this[_m] - row, this[_n], this[_data].slice(row * this[_n]));
  }

  // TODO: document
  hi(row = 0) {
    return new Matrix(row, this[_n], this[_data].slice(0, row * this[_n]));
  }

  // TODO: document
  shift(rows) {
    let newData = new Float64Array(this[_m] * this[_n]);
    newData.subarray(this[_n] * rows).set(this[_data].subarray(0, -(this[_n] * rows) || this[_data].length));
    return new Matrix(this[_n], this[_m], newData);
  }

  /**
   * Retrieves the diagonal elements as a 1 x min(m, n) matrix.
   *
   * @return {Matrix<1,min(m,n)>} Diagonal elements
   */
  diag() {
    var diagonal = new Matrix(1, Math.min(this[_m], this[_n])),
        i;

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
    var absolute = this.clone(),
        i;

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
    var tot = 0,
        i;

    for (i = 0; i < this[_data].length; i += 1) {
      tot += this[_data][i];
    }
    return tot;
  }

  /**
   * Takes the product of all elements.
   *
   * @return {number} Product of all elements
   */
  prod() {
    var tot = 1,
        i;

    for (i = 0; i < this[_data].length; i += 1) {
      tot *= this[_data][i];
    }
    return tot;
  }

  /**
   * Get minimum value in matrix
   *
   * @return {number} Minimum value
   */
  min() {
    let i, min;

    for (i = 0, min = Infinity; i < this[_data].length; i += 1) {
      min = Math.min(min, this[_data][i]);
    }
    return min;
  }

  /**
   * Get maximum value in matrix
   *
   * @return {number} Maximum value
   */
  max() {
    let i, max;

    for (i = 0, max = -Infinity; i < this[_data].length; i += 1) {
      max = Math.max(max, this[_data][i]);
    }
    return max;
  }

  /**
   * @property {Matrix<n,m>} T The transposition of the matrix
   */
  get T() {
    var transpose = new Matrix(this[_n], this[_m]),
        i,
        j;

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
    var randMatrix = new Matrix(m, n),
        i,
        j;

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
  static eye(m, n = m) {
    var onez = new Matrix(m, n),
        i,
        j;

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
    return new Matrix(m, n, Float64Array.from(utils.join(arr)));
  }

  /**
   * Creates a matrix using `arr` to fill the diagonal elements in order.
   *
   * @param {number[m]} arr Array of numbers
   * @returns {Matrix<m,m>} Matrix consisting only of the diagonal elements
   */
  static diag(arr) {
    var m = arr.length,
        mat = new Matrix(m, m),
        i;

    for (i = 0; i < m; i += 1) {
      mat.data[i * m + i] = arr[i];
    }
    return mat;
  }

  static zeros(m, n = m) {
    return this.eye(m, n).dotMultiply(0);
  }

}

module.exports = Matrix;

/***/ }),
/* 9 */
/* unknown exports provided */
/* all exports used */
/*!************************************!*\
  !*** ./engine/regression/lstsq.js ***!
  \************************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const Matrix = __webpack_require__(/*! ../matrix */ 0);
const svd = __webpack_require__(/*! ./svd-golub-reinsch */ 2);
const statistics = __webpack_require__(/*! ../statistics */ 1);
const dist = __webpack_require__(/*! ../statistics/distributions-socr */ 4);
const utils = __webpack_require__(/*! ../utils */ 5);

/**
 * Computes total least squares regression on the matrix `A`, already decomposed
 * using SVD into the constituent `U`, `S` (sigma), and `V` matrices.
 *
 * @param {Matrix<m,n>} A Data matrix
 * @param {Matrix<m,m>} U U matrix resulting from SVD
 * @param {Matrix<m,n>} S Diagonal sigma matrix resulting from SVD
 * @param {Matrix<n,n>} V V matrix resulting from SVD
 * @param {Matrix<m,1>} b Independent column
 * @return {Matrix<n,1>} Estimated weight vector for the parameters (cols) in A
 */
function lstsqSVD(A, U, S, V, b) {
  var s = S,
      m = A.shape[0],
      n = A.shape[1],
      eps = Number.EPSILON,
      efcols = [],
      maxEig = Math.max.apply(null, s.data),
      i,
      d,
      x;

  for (i = 0; i < n; i++) {
    if (s.data[i] < Math.max(m, n) * eps * maxEig) {
      s.data[i] = 0;
    }
  }
  d = U.T.dot(b);
  d = d.dotDivide(s);
  for (i = 0; i < n; i++) {
    if (Math.abs(d.data[i]) === Infinity) {
      d.data[i] = 0;
    }
  }
  x = V.dot(d);
  return x;
}

/**
 * Compute least squares regression using normal equations, then compute
 * analytical statistics to determine the quality of the fit for the model and
 * for each term in the model.
 *
 *    B'      = inv(X'X)X'y                       <-- weight vector
 *    y'      = XB'
 *
 *    Nd      = # of data
 *    Np      = # of params (coefs) in model
 *
 *    SSE     = sum((y - y')^2)                   ^2 is element-wise
 *    TSS     = sum((y - mean(y))^2)
 *    SSR     = TSS - SSE
 *    Var y   = TSS / (Nd - 1)
 *    MSR     = SSR / (Np - 1)
 *    MSE     = SSE / (Nd - Np)
 *    RSQ     = 1 - (SSE / TSS)
 *    cRSQ    = 1 - R^2
 *    adj-RSQ = 1 - (MSE / Var y)
 *    F       = MSR / MSE
 *    AIC     = log(MSE) + 2*(Np/Nd)
 *    BIC     = log(MSE) + Np*log(Nd)/Nd
 *    t_i     = B' / sqrt( inv(X'X)[i,i] * MSE )   / is element-wise
 *
 * @return {object} Regression results
 */
function lstsqNEWithStats(X, y) {
  var XT = X.T,
      pseudoInverse = XT.dot(X).inv(),
      BHat = pseudoInverse.dot(XT).dot(y),
      yHat = X.dot(BHat)

  // fit statistics
  ,
      nd = X.shape[0],
      np = X.shape[1],
      sse = y.sub(yHat).dotPow(2).sum(),
      tss = y.sub(y.sum() / y.shape[0]).dotPow(2).sum(),
      ssr = tss - sse,
      vary = tss / (nd - 1),
      msr = ssr / (np - 1),
      mse = sse / (nd - np),
      rsq = 1 - sse / tss,
      crsq = 1 - rsq,
      adjrsq = 1 - mse / vary,
      f = msr / mse,
      aic = Math.log10(mse) + 2 * (np / nd),
      bic = Math.log10(mse) + np * (Math.log10(nd) / nd)

  // for t-statistics
  ,
      rtmse = Math.sqrt(mse),
      sec = pseudoInverse.diag().abs().dotPow(0.5).dotMultiply(rtmse),
      tstats = BHat.dotDivide(sec),
      pts = tstats.clone();

  pts.data.set(pts.data.map(t => dist.pt(t, nd - np)));

  return {
    weights: BHat,
    tstats: tstats,
    mse: mse,
    rsq: rsq,
    crsq: crsq,
    adjrsq: adjrsq,
    f: f,
    pf: dist.pf(f, np, nd - np),
    aic: aic,
    bic: bic,
    pts: pts
  };
}

function scale(X) {
  let stdevs = [];
  let means = [];
  let intercept = -1;
  let i;

  for (i = 0; i < X.shape[1]; i += 1) {
    let col = X.col(i);
    let nd = col.shape[0];
    let mean = col.sum() / nd;
    let newCol = col.sub(mean);
    let stdev = Math.sqrt(newCol.dotPow(2).sum() / (nd - 1));

    means.push(mean);

    if (stdev <= Number.EPSILON && mean === 1) {
      stdevs.push(1);
      intercept = i;
    } else {
      X.col(i, newCol.dotDivide(stdev).data);
      stdevs.push(stdev);
    }
  }

  return {
    stdev: new Matrix(stdevs).T,
    mean: new Matrix(means).T,
    intercept
  };
}

/**
 * Compute least squares regression using singular value decomposition, then
 * compute analytical statistics to determine the quality of the fit for the
 * model and for each term in the model.
 *
 *    U, s, V = svd(X)
 *    B'      = V(U'b ./ s)                       See svd.lstsq for more
 *    y'      = XB'
 *
 * @return {object} Regression results
 */
function lstsqSVDWithStats(X, y, predictors) {
  let i;
  let stdev = 1,
      mean = 0,
      intercept = -1;
  //let { stdev, mean, intercept } = scale(X);

  let decomposition = svd(X),
      U = decomposition[0],
      w = Matrix.from(decomposition[1]),
      V = decomposition[2],
      VdivwSq = V.dotDivide(w).dotPow(2),
      BHat = predictors || lstsqSVD(X, U, w, V, y),
      weights = BHat.dotDivide(stdev);

  // If there is an intercept, un-scale its weight by subtracting the means of
  // the other columns times the corresponding sign of their weights
  //
  //          B_0 = B_0 - sum(mean(i) * sign(weights(i)))
  //
  if (intercept >= 0) {
    let interceptWeight = weights.get(0, intercept) + 1;

    for (i = 0; i < weights.shape[0]; i += 1) {
      interceptWeight -= mean.data[i] * utils.sign(weights.data[i]);
    }
    weights.data[intercept] = interceptWeight;
  }

  // Remove infinitely high values to work around potential divide-by-zero issue
  for (i = 0; i < VdivwSq.data.length; i += 1) {
    if (Math.abs(VdivwSq.data[i]) === Infinity || isNaN(VdivwSq.data[i])) {
      VdivwSq.data[i] = 0;
    }
  }

  return { X, y, BHat, VdivwSq, stdev, mean, weights, V, w };
}

module.exports.lstsqSVD = lstsqSVDWithStats;
module.exports.lstsqNE = lstsqNEWithStats;

/***/ }),
/* 10 */
/* unknown exports provided */
/* all exports used */
/*!******************************************!*\
  !*** ./engine/statistics/definitions.js ***!
  \******************************************/
/***/ (function(module, exports, __webpack_require__) {


const Statistic = __webpack_require__(/*! ./Statistic */ 3);
const Matrix = __webpack_require__(/*! ../matrix */ 0);
const dist = __webpack_require__(/*! ./distributions-socr */ 4);

// Functional definitions for statistics -- defines how they will be calculated
// NOTE: Make sure each statistic has an entry in `metadata.json`
module.exports = [
// given
Statistic('X', [], ({ X }) => X), Statistic('y', [], ({ y }) => y), Statistic('BHat', [], ({ BHat }) => BHat), Statistic('yHat', ['X', 'BHat'], ({ X, BHat }) => X.dot(BHat)),

// fit statistics
Statistic('nd', ['X'], ({ X }) => X.shape[0]), Statistic('np', ['X'], ({ X }) => X.shape[1]), Statistic('SSE', ['y', 'yHat'], ({ y, yHat }) => y.sub(yHat).dotPow(2).sum()), Statistic('TSS', ['y'], ({ y }) => y.sub(y.sum() / y.shape[0]).dotPow(2).sum()),

// yHat.sub(y.sum() / y.shape[0]).dotPow(2).sum()));
Statistic('SSR', ['TSS', 'SSE'], ({ TSS, SSE }) => TSS - SSE), Statistic('Vary', ['TSS', 'nd'], ({ TSS, nd }) => TSS / (nd - 1)), Statistic('MSR', ['SSR', 'np'], ({ SSR, np }) => SSR / (np - 1)), Statistic('MSE', ['SSE', 'nd', 'np'], ({ SSE, nd, np }) => SSE / (nd - np)), Statistic('Rsq', ['SSE', 'TSS'], ({ SSE, TSS }) => 1 - SSE / TSS), Statistic('cRsq', ['Rsq'], ({ Rsq }) => 1 - Rsq), Statistic('adjRsq', ['Rsq', 'np', 'nd'], ({ Rsq, nd, np }) => 1 - (1 - Rsq) * (nd - 1) / (nd - np)), Statistic('F', ['MSR', 'MSE'], ({ MSR, MSE }) => MSR / MSE), Statistic('AIC', ['MSE', 'np', 'nd'], ({ MSE, np, nd }) => Math.log10(MSE) + 2 * (np / nd)), Statistic('BIC', ['MSE', 'np', 'nd'], ({ MSE, np, nd }) => Math.log10(MSE) + np * (Math.log10(nd) / nd)), Statistic('t', ['X', 'VdivwSq', 'MSE', 'BHat'], ({ X, VdivwSq, MSE, BHat }) => {
  var sec = new Matrix(1, X.shape[1]),
      stdModelErr,
      i;

  for (i = 0; i < X.shape[1]; i += 1) {
    stdModelErr = Math.sqrt(VdivwSq.row(i).sum() * MSE);
    sec.data[i] = stdModelErr;
  }

  return BHat.dotDivide(sec);
}), Statistic('pt', ['t', 'np', 'nd'], ({ t, np, nd }) => {
  let pt = t.clone();
  pt.data.set(pt.data.map(t => Math.max(0, dist.pt(t, nd - np))));
  return pt;
}), Statistic('pF', ['F', 'np', 'nd'], ({ F, np, nd }) => dist.pf(Math.abs(F), np, nd - np))];

/***/ }),
/* 11 */
/* unknown exports provided */
/* all exports used */
/*!**************************************!*\
  !*** ./engine/statistics/topsort.js ***!
  \**************************************/
/***/ (function(module, exports) {


const inDegree = (stat, statistics) => {
  let names = statistics.map(({ name }) => name);
  return stat.args.filter(s => names.includes(s)).length;
};

const topsort = statistics => {
  let S = statistics.filter(stat => stat.args.length === 0);
  let L = [];
  let remaining = statistics.filter(stat => !S.includes(stat));
  let node;

  while (S.length > 0) {
    node = S.shift();
    remaining = remaining.filter(n => n !== node);
    L.push(node);
    S = S.concat(remaining.filter(stat => inDegree(stat, remaining) === 0));
    remaining = remaining.filter(stat => !S.includes(stat));
  }
  if (remaining.length > 0) {
    throw new Error('Statistics are co-dependent');
  }
  return L;
};

module.exports = topsort;

/***/ }),
/* 12 */
/* unknown exports provided */
/* all exports used */
/*!*********************************************************************************!*\
  !*** ./~/babel-loader/lib?presets[]=es2017!./engine/worker/candidate-worker.js ***!
  \*********************************************************************************/
/***/ (function(module, exports, __webpack_require__) {

/*global postMessage, onmessage*/

if (typeof window !== 'undefined') {
  __webpack_require__(/*! ./subworkers */ 7);
}

const UPDATE_INTERVAL = 200;

const Matrix = __webpack_require__(/*! ../matrix */ 0);
const lstsq = __webpack_require__(/*! ../regression */ 6).lstsq;
const statistics = __webpack_require__(/*! ../statistics */ 1);

onmessage = ({ data: { fit, cross, candidates, jobId } }) => {
  fit.X = new Matrix(fit.X.m, fit.X.n, fit.X.data);
  fit.y = new Matrix(fit.y.m, fit.y.n, fit.y.data);

  if (cross !== fit) {
    cross.X = new Matrix(cross.X.m, cross.X.n, cross.X.data);
    cross.y = new Matrix(cross.y.m, cross.y.n, cross.y.data);
  }

  let model = { fit, cross };

  let results = candidates.map(({ fit, cross, lag }, i) => {
    // reconstruct matrices (they were deconstructed for transport)
    fit = {
      X: model.fit.X.hstack(new Matrix(fit.m, fit.n, fit.data)).lo(lag),
      y: model.fit.y.lo(lag)
    };
    cross = {
      X: model.cross.X.hstack(new Matrix(cross.m, cross.n, cross.data)).lo(lag),
      y: model.cross.y.lo(lag)
    };

    if (i % UPDATE_INTERVAL === 0) {
      postMessage({ type: 'progress', data: i, jobId });
    }

    try {
      let regression = lstsq(fit.X, fit.y);
      Object.assign(regression, { X: cross.X, y: cross.y });

      let stats = statistics(regression);

      stats.coeff = stats.weights.get(0, stats.weights.shape[0] - 1);
      stats.t = stats.t.get(0, stats.t.shape[0] - 1);
      stats.pt = stats.pt.get(0, stats.pt.shape[0] - 1);
      delete stats.weights;

      return stats;
    } catch (e) {
      console.error(e);
      return NaN;
    }
  });
  postMessage({ type: 'result', data: results, jobId });
};

/***/ }),
/* 13 */
/* unknown exports provided */
/* all exports used */
/*!*****************************************!*\
  !*** ./engine/statistics/metadata.json ***!
  \*****************************************/
/***/ (function(module, exports) {

module.exports = [
	{
		"id": "X",
		"show": false
	},
	{
		"id": "y",
		"show": false
	},
	{
		"id": "v",
		"show": false
	},
	{
		"id": "w",
		"show": false
	},
	{
		"id": "VdivwSq",
		"show": false
	},
	{
		"id": "BHat",
		"show": false
	},
	{
		"id": "yHat",
		"show": false
	},
	{
		"id": "Vary",
		"show": false
	},
	{
		"id": "nd",
		"globalOnly": true,
		"format": "int"
	},
	{
		"id": "np",
		"globalOnly": true,
		"format": "int"
	},
	{
		"id": "SSE",
		"sort": ">"
	},
	{
		"id": "TSS",
		"globalOnly": true
	},
	{
		"id": "SSR"
	},
	{
		"id": "MSR",
		"sort": ">"
	},
	{
		"id": "MSE"
	},
	{
		"id": "Rsq",
		"sort": "<"
	},
	{
		"id": "cRsq",
		"sort": ">"
	},
	{
		"id": "adjRsq",
		"sort": "<"
	},
	{
		"id": "AIC",
		"sort": ">"
	},
	{
		"id": "BIC",
		"sort": ">"
	},
	{
		"id": "F",
		"sort": "<"
	},
	{
		"id": "pF",
		"displayName": "p(F)",
		"sort": ">"
	},
	{
		"id": "t",
		"sort": "|<|",
		"candidateOnly": true,
		"default": true
	},
	{
		"id": "pt",
		"displayName": "p(t)",
		"sort": ">",
		"candidateOnly": true,
		"default": true
	},
	{
		"id": "stdev",
		"show": false
	},
	{
		"id": "mean",
		"show": false
	},
	{
		"id": "weights",
		"show": false
	}
];

/***/ })
/******/ ]);