

const csv = require('fast-csv');
const Matrix = require('./matrix');


module.exports = (path, removeHeader, callback) => {
  var data = [];

  if (removeHeader instanceof Function) {
    callback = removeHeader;
    removeHeader = false;
  }

  csv.fromPath(path)
    .on('data', (row) => {
      if (removeHeader) {
        removeHeader = false;
        return;
      }
      data.push(row.map((x) => parseFloat(x)));
    })
    .on('end', () => callback(new Matrix(data)));
};

