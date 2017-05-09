
const _cache = Symbol('cache');
const _mixinref = Symbol('CacheMixin_ref');

const CacheMixin = (superclass=class{}) => class extends superclass {

  constructor() {
    super(...arguments);
    this[_cache] = {};
  }

  uncache(functionName, ...args) {
    let argsKey = args.toString();

    if (functionName == null) {
      this[_cache] = {};
      return this;
    }

    if (this[_cache][functionName] == null) {
      return this;
    }

    if (args.length <= 0) {
      this[_cache][functionName] = {};
      return this;
    }

    let { defaultArgs, originalLength } = this[functionName];

    args = args.concat(defaultArgs.slice(args.length));
    args.length = originalLength + defaultArgs.length;

    delete this[_cache][functionName][args.toString()];
    return this;
  }

  static get [_mixinref]() {
    return true;
  }

};

// Static function that should be used to specify functions to apply caching to
CacheMixin.cache = (clazz, functionName, defaultArgs=[]) => {
  let originalFunction = clazz.prototype[functionName];

  if (clazz[_mixinref] !== true) {
    throw new TypeError('Class must extend CacheMixin');
  }

  if (originalFunction == null) {
    throw new ReferenceError(
      `${clazz.name}.prototype.${functionName} is not a function`
    );
  }

  // Overwrite prototype definition with wrapper that caches results
  clazz.prototype[functionName] = function () {
    let args = Array.prototype.slice.apply(arguments)
          .concat(defaultArgs.slice(arguments.length));
    args.length = originalFunction.length + defaultArgs.length;

    let argsKey = args.toString();

    if (this[_cache][functionName] == null) {
      this[_cache][functionName] = {};
    }

    if (argsKey in this[_cache][functionName]) {
      return this[_cache][functionName][argsKey];
    }
    this[_cache][functionName][argsKey] = originalFunction.apply(this, args);
    return this[_cache][functionName][argsKey];
  };

  // Expose default arguments and original function length for use later on
  clazz.prototype[functionName].defaultArgs = defaultArgs;
  clazz.prototype[functionName].originalLength = originalFunction.length;
};

module.exports = CacheMixin;

