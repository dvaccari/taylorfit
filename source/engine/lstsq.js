
const math = require('mathjs');

module.exports = (A, b) => {
  var invCovar = math.inv(math.multiply(math.transpose(A), A))
    , result = math.multiply(math.multiply(invCovar, math.transpose(A)), b);
  return math.squeeze(result);
};

