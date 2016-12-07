

const math = require('mathjs');


let lstsq = math.parse("inv(A'*A)*A'*b");

var N = 1000;
var T = 9;
var CT= 1000;

var X, y;

console.time('lstsq');
for (var i = 0; i < CT; i += 1) {
  X = math.matrix(math.random([N, T]));
  y = math.matrix(math.random([N]));
  lstsq.eval({ A: X, b: y });
}
console.timeEnd('lstsq');


