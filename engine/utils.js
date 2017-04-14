'use strict';

function nspaces(n) {
  n = Math.max(0, n);
  return Array(n + 1).join(' ');
}

function pad(width, val) {
  val = val || '';
  return nspaces(width - (''+val).length) + val;
}


module.exports.range = (start, end) => {
  if (start >= end) {
    return [];
  }
  return Array(end - start).join(' ').split(' ').map((_, i) => i + start);
};

module.exports.convertRange = (str, length) => {
  var range, start, end;

  if (typeof str === 'number') {
    return (str < 0) ? [length + str] : [str];
  }
  if (typeof str !== 'string') {
    return str.map((ind) => (ind < 0) ? length + ind : ind);
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

module.exports.formatNum = (leftwidth, rightwidth, val) => {
  val = ''+val;
  var match = val.match(/(NaN|-?Infinity|-?\d*)\.?(\d*)/)
    , whole = match[1]
    , frac = match[2]
    , repr = '';

  if (frac.length > rightwidth) {
    frac = frac.slice(0, rightwidth);
  }
  repr += nspaces(leftwidth - whole.length) + whole;
  if (frac !== '' || rightwidth > 0) {
    repr += '.';
    repr += frac.slice(0, rightwidth) + nspaces(rightwidth - frac.length);
  } else {
    repr += nspaces(rightwidth + 1);
  }
  return repr;
};

module.exports.padAll = (lwidth, str) => {
  if (Array.isArray(str)) {
    return str.map((s) => module.exports.padAll(lwidth + s.length, s));
  } else if (typeof str === 'string') {
    return str.split('\n').map((s) => pad(lwidth + s.length, s)).join('\n');
  }
  return pad(lwidth, str);
};

let clone = module.exports.clone = (obj) => {
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(clone);
  }

  let newObj = {};
  Object.keys(obj).forEach((key) => newObj[key] = clone(obj[key]));
  return newObj;
};

module.exports.join = (arr) => [].concat.apply([], arr);

module.exports.sign = (x) => x < 0 ? -1 : x > 0 ? 1 : 0;

module.exports.argmax = (arr) => arr.indexOf(Math.max.apply(null, arr));
