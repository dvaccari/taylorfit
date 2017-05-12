'use strict';

function nchars(n, char) {
  n = Math.max(0, n);
  return Array(n + 1).join(char);
}

let nspaces = (n) => nchars(n, ' ');

function pad(width, val) {
  val = val || '';
  return nspaces(width - (''+val).length) + val;
}


let range = module.exports.range = (start, end) => {
  if (start >= end) {
    return [];
  }
  return Array(end - start).join(' ').split(' ').map((_, i) => i + start);
};

let zeros = module.exports.zeros = (n) =>
      Array(n).join(' ').split(' ').map(() => 0);

let sum = module.exports.sum = (arr) =>
      arr.reduce((tot, curr) => tot + curr);

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

module.exports.formatNum = (leftwidth, rightwidth, val, nilDecimalChar=' ') => {
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
    repr += frac.slice(0, rightwidth) +
      nchars(rightwidth - frac.length, nilDecimalChar);
  } else {
    repr += nspaces(rightwidth + 1);
  }
  return repr;
};

let padAll = module.exports.padAll = (lwidth, str) => {
  if (Array.isArray(str)) {
    return str.map((s) => padAll(lwidth + s.length, s));
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

module.exports.join = (arr) => [].concat.apply([], arr);

module.exports.sign = (x) => x < 0 ? -1 : x > 0 ? 1 : 0;

module.exports.argmax = (arr) => arr.indexOf(Math.max.apply(null, arr));
