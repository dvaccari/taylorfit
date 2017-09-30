
# TaylorFit

TaylorFit is a multivariate polynomial regression application that fits data to
a predictive model consisting of a polynomial function, such as

`f(x, y) = ax + by + cxy`

where `x`, `y`, and `xy` are terms selected by the user, and `a`, `b`, and `c`
are coefficients determined using least squares regression.


## On the Web

The application works entirely client-side in your browser, so there's no need
to download or install anything and no need to create an account. In order to
be reasonably efficient, TaylorFit utilizes specific JavaScript primitives and
browser capabilities that emulate native execution.

## Frameworks used

- Knockoutjs
- CoffeeScript

## Installation

1. Ensure npm is installed
    - Run `npm --version` in terminal to check
    - Install at [nodejs.org](https://nodejs.org/en/)
2. Ensure yarn is installed
    - Run `yarn --version` to check
    - Run `npm install yarn` to install
3. Git clone or download a zip of the repo
4. Open the directory in terminal
5. Run `npm install`
6. Run the server
    - Run `npm run debug` to start the development server (includes hot reloading)
    - Run `npm start` to start the production server
7. Run `npm run test` to run the test suite

## Export to gh-pages

1. Run `npm run build`
2. Copy the build directory
3. Run `git checkout gh-pages`
4. Paste the build directory files into the main directory
5. Push up the code
6. Run `git checkout master`
