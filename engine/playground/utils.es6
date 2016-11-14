
module.exports.range = (start, end) => {
  return Array(end - start).join(' ').split(' ').map((_, i) => i + start);
};

module.exports.convertRange = (str, length) => {
  var range, start, end;

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

