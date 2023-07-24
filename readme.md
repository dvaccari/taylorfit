
# TaylorFit

TaylorFit is a multivariate polynomial regression application that fits data to
a predictive model consisting of a polynomial function, such as

`f(x, y) = a*x + b*y + c*xy + d*x*y^2`

where `x`, `y`, and `xy` are terms selected by the user, and `a`, `b`, and `c`
are coefficients determined using least squares regression.


## On the Web

The application works entirely client-side in your browser, so there's no need
to download or install anything and no need to create an account. In order to
be reasonably efficient, TaylorFit utilizes specific JavaScript primitives and
browser capabilities that emulate native execution.

## Frameworks used

- KnockoutJS
- CoffeeScript
- PugJS
- Stylus

## Installation

1. Ensure npm is installed
    - If `npm --version` prints version info, you're good
    - Else, install it at [nodejs.org](https://nodejs.org/en/)
2. Ensure yarn is installed
    - If `yarn --version` prints version info, you're good
    - Else, run `npm install yarn` to install
3. `git clone` or download a zip of the repo
4. Open the directory in a terminal
5. Run `npm install`
6. Run the server (by default hosted at `http://localhost:8080/`)
    - Run `npm run debug` to start the development server (includes hot reloading)
    - Run `npm start` to start the production server
7. Run `npm run test` to run the test suite

## Export to gh-pages (the GitHub Pages site)

1. Run `npm run build`
2. Copy the build directory (`cp -r build/ ../build/`)
3. Run `git checkout gh-pages`
    1. If git won't let you checkout, use `git status` to see if you have any unsaved changes on the current branch
4. Paste the build directory files into the main directory (`rm -r resources/ && mv ../build/* . && rm -r ../build/` [be careful you don't have another `build` directory in one level up from your clone])
    1. The first command deletes the old `resources` folder (since `mv` doesn't allow merges)
    2. The second command actually puts in the new build files
    3. The third command cleans up the copy of the build directory
5. Push up the code (`git add -A && git commit -m "..." && git push`)
6. Run `git checkout master` to return to the working branch
