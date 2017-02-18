'use strict';


function statcom(q, i, j, b) {
  var zz = 1
    , z = zz
    , k = i;

  while (k <= j) {
    zz *= q * k / (k-b);
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

  var w = t / Math.sqrt(n)
    , th = Math.atan(w);

  if (n === 1) {
    return 1 - th / (Math.PI / 2);
  }

  var sth = Math.sin(th)
    , cth = Math.cos(th);

  if ((n % 2) === 1) {
    return 1 - (th + sth * cth * statcom(cth*cth, 2, n-3, -1)) / (Math.PI / 2);
  }
  return 1 - sth * statcom(cth*cth, 1, n-3, -1);
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
  var x = n2/(n1*f+n2);

  if ((n1 % 2) === 0) {
    return statcom(1-x, n2, n1+n2-4, n2-2) * Math.pow(x, n2/2);
  }
  if ((n2 % 2) === 0) {
    return 1 - statcom(x, n1, n1+n2-4, n1-2) * Math.pow(1-x, n1/2);
  }

  var th = Math.atan(Math.sqrt(n1*f/n2))
    , a = th / (Math.PI / 2)
    , sth = Math.sin(th)
    , cth = Math.cos(th);

  if (n2 > 1) {
    a += sth * cth * statcom(cth*cth, 2, n2-3, -1) / (Math.PI / 2);
  }
  if (n1 === 1) {
    return 1 - a;
  }

  var c = 4 * statcom(sth*sth, n2+1, n1+n2-4, n2-2)
            * sth * Math.pow(cth, n2) / Math.PI;

  if (n2 === 1) {
    return 1 - a + c / 2;
  }

  var k = 2;

  while (k <= (n2-1)/2) {
    c *= k/(k-0.5);
    k += 1;
  }
  return 1 - a + c;
}

module.exports.pt = pt;
module.exports.pf = pf;

