/*global describe, it, beforeEach*/

const chai        = require('chai')
    , expect      = chai.expect
    , CacheMixin  = require('../../engine/model/CacheMixin');

describe('CacheMixin', () => {

  let Test;
  let setup = () => {
    Test = class extends CacheMixin() {
      constructor() {
        super();
        this.value = 0;
      }
      foo(amt) {
        return this.value += amt;
      }
      val(a, b=2, c=3) {
        return this.value = a + b + c;
      }
    };
  };

  beforeEach(setup);

  it('can be extended by a subclass', () => {
    expect(() => class extends CacheMixin() {}).not.to.throw();
  });

  it('wraps a base class s.t. a subclass inherits behavior from both', () => {
    let BaseClass = class {};
    let Test = class extends CacheMixin(BaseClass) {};

    expect(new Test()).to.be.instanceof(BaseClass);
    expect(new Test().uncache).to.exist;
  });

  it('caches the return value of a function for a set of parameters', () => {
    let t = new Test();

    // Sanity check -- no caching
    expect(t.foo(1)).to.equal(1);
    expect(t.foo(1)).to.equal(2);
    expect(t.foo(1)).to.equal(3);

    // With caching -- value should be the same for every return
    CacheMixin.cache(Test, 'foo');
    expect(t.foo(1)).to.equal(4);
    expect(t.foo(1)).to.equal(4);
    expect(t.foo(1)).to.equal(4);

    // The function is not called when the cache is hit
    expect(t.value).to.equal(4);
  });

  it('caches values for multiple parameters', () => {
    let t = new Test();

    CacheMixin.cache(Test, 'val');

    expect(t.value).to.equal(0);
    expect(t.val(1, 2, 3)).to.equal(6);

    t.foo(10);

    expect(t.value).to.equal(16);
    expect(t.val(1, 2, 3)).to.equal(6);

    // t.value shouldn't change b.c. result for "1,2,3" is cached
    expect(t.value).to.equal(16);
  });

  describe('static cache()', () => {

    beforeEach(setup);

    it('accepts a subclass of CacheMixin and a function name to cache', () => {
      expect(() => CacheMixin.cache(Test, 'foo'))
        .to.not.throw();
    });

    it('throws if the class passed in is not a subclass of CacheMixin', () => {
      let TestNotSubclass = class {
        foo() { return 3; }
      };
      expect(() => CacheMixin.cache(TestNotSubclass, 'foo'))
        .to.throw(/Class must extend CacheMixin/);
    });

    it('throws if the function specified does not exist on the proto', () => {
      expect(() => CacheMixin.cache(Test, 'bar'))
        .to.throw(/is not a function/);
    });

    it('accepts subclass of a subclass of CacheMixin', () => {
      let SubTest = class extends Test {
        foo() { return this.value += 2; }
      };
      expect(() => CacheMixin.cache(Test, 'foo'))
        .to.not.throw();
    });

    it('optionally accepts and applies default arguments', () => {
      let t = new Test();

      CacheMixin.cache(Test, 'val', [null, 2, 3]);

      expect(t.val(1)).to.equal(6);
      expect(t.val(0, 0)).to.equal(3);
    });

  });

  describe('uncache()', () => {

    beforeEach(setup);

    it('accepts a function name + args and deletes that cached value', () => {
      let t = new Test();

      expect(t.foo(2)).to.equal(2);
      expect(t.foo(2)).to.equal(4);

      CacheMixin.cache(Test, 'foo');

      expect(t.foo(2)).to.equal(6);
      expect(t.foo(2)).to.equal(6);

      t.uncache('foo', 2);

      expect(t.foo(2)).to.equal(8);
      expect(t.foo(2)).to.equal(8);
    });

    it('removes cached values for multiple arguments', () => {
      let t = new Test();

      CacheMixin.cache(Test, 'val');

      expect(t.val(1, 2, 3)).to.equal(6);
      t.value = 27;
      expect(t.val(1, 2, 3)).to.equal(6);
      expect(t.value).to.equal(27);

      t.uncache('val', 1, 2, 3);

      expect(t.val(1, 2, 3)).to.equal(6);
      expect(t.value).to.equal(6);
    });

    it('applies default arguments', () => {
      let t = new Test();

      CacheMixin.cache(Test, 'val');

      expect(t.val(1)).to.equal(6);
      t.value = 27;
      expect(t.val(1)).to.equal(6);
      expect(t.value).to.equal(27);

      t.uncache('val', 1);

      expect(t.val(1)).to.equal(6);
      expect(t.value).to.equal(6);
    });

    it('clears every cache if no function is specified', () => {
      let t = new Test();

      CacheMixin.cache(Test, 'foo');

      expect(t.foo(1)).to.equal(1);
      expect(t.foo(1)).to.equal(1);

      t.uncache();

      expect(t.foo(1)).to.equal(2);
      expect(t.foo(1)).to.equal(2);
    });

    it('clears ret value for every set of args if no args are specified', () => {
      let t = new Test();

      CacheMixin.cache(Test, 'foo');

      expect(t.foo(1)).to.equal(1);
      expect(t.foo(1)).to.equal(1);
      expect(t.foo(2)).to.equal(3);
      expect(t.foo(2)).to.equal(3);

      t.uncache('foo');

      expect(t.foo(1)).to.equal(4);
      expect(t.foo(1)).to.equal(4);
      expect(t.foo(2)).to.equal(6);
      expect(t.foo(2)).to.equal(6);
    });

  });

});

