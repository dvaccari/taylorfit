

const utils     = require('../utils');
const Matrix    = require('../matrix').Matrix;
const Model     = require('./model');

const defaults  = {
  dataset       : new Matrix(0, 0),
  dependent     : 0,
  exponents     : [1],
  multiplicands : 1
};


let instance = null;

/**
 * Singleton which maintains a single Model instance and keeps track of the
 * parameters for the model -- exponents, multiplicands, ... . When one of these
 * parameters is updated, the model is reinstantiated.
 *
 * XXX: Consider updating the model instead of replacing it. This will make
 * things easier by saving terms already in the model.
 *
 * @class SingletonModel
 */
class SingletonModel {

  constructor() {
    if (instance) {
      return instance;
    }

    for (let property in defaults) {
      this[property] = defaults[property];
    }

    this.update();

    return instance = this;
  }

  static getInstance() {
    if (!instance) {
      instance = new SingletonModel();
    }
    return instance;
  }

  static reset() {
    instance = null;
    return new SingletonModel();
  }

  getX() {
    var inputColumnRange = [].concat(
      utils.range(0, this.dependent),
      utils.range(this.dependent + 1, this.dataset.shape[1])
    );

    return this.dataset.subset(':', inputColumnRange);
  }

  gety() {
    return this.dataset.col(this.dependent);
  }

  update() {
    return this.model = new Model(
      this.getX(),
      this.gety(),
      this.exponents,
      this.multiplicands
    );
  }

  setExponents(exponents) {
    if (!Array.isArray(exponents)) {
      throw new TypeError('exponents must be an array of numbers');
    }
    exponents.forEach((exp) => {
      if (typeof exp !== 'number') {
        throw new TypeError('exponents must be an array of numbers');
      }
    });

    this.exponents = exponents;
    this.update();
    return this;
  }

  setMultiplicands(multiplicands) {
    if (typeof multiplicands !== 'number' || multiplicands % 1 !== 0) {
      throw new TypeError('multiplicands must be an integer');
    }

    this.multiplicands = multiplicands;
    this.update();
    return this;
  }

  setDependent(dependent) {
    if (typeof dependent !== 'number' || dependent % 1 !== 0) {
      throw new TypeError('dependent must be an integer');
    }
    if (dependent < 0 || dependent >= this.dataset.shape[1]) {
      throw new RangeError('depdendent column is out of range: ' +
                           dependent + ' not in [' + 0 + ', ' +
                           this.dataset.shape[1] + ']');
    }

    this.dependent = dependent;
    this.update();
    return this;
  }

  setDataset(dataset) {
    this.dataset = new Matrix(dataset);
    this.dependent = defaults.dependent;
    this.update();
    return this;
  }

}


module.exports = SingletonModel;
