/*global describe, it, before*/

const chai    = require('chai')
    , expect  = chai.expect
    , should  = chai.should;

const combos  = require('../../engine/model/combos');

describe('combos', () => {

  describe('combinations()', () => {

    it('should return all combinations of k items from an array', () => {
      var cs = combos.combinations([1, 2, 3], 2);

      expect(cs).to.include.deep.members([
        [1, 2],
        [1, 3],
        [2, 3]
      ]);
      // FIXME: Upon upgrading to chai v4.0+, change these to
      //        .to.not.deep.include(pair)
      expect(cs).to.not.include.deep.members([[1, 1]]);
      expect(cs).to.not.include.deep.members([[2, 2]]);
      expect(cs).to.not.include.deep.members([[3, 3]]);
    });

    it('should return all combos w/ replacement when flag is set', () => {
      var cs = combos.combinations([1, 2, 3], 2, true);

      expect(cs).to.include.deep.members([
        [1, 1],
        [1, 2],
        [1, 3],
        [2, 2],
        [2, 3],
        [3, 3]
      ]);
      // FIXME: Upon upgrading to chai v4.0+, change these to
      //        .to.not.deep.include(pair)
      expect(cs).to.not.include.deep.members([[2, 1]]);
      expect(cs).to.not.include.deep.members([[3, 1]]);
      expect(cs).to.not.include.deep.members([[3, 2]]);
    });

    it('should return [] when k <= 0', () => {
      expect(combos.combinations([1, 2, 3], 0)).to.eql([]);
      expect(combos.combinations([1, 2, 3], -1)).to.eql([]);
    });

    it('should return [] when terms == []', () => {
      expect(combos.combinations([], 0)).to.eql([]);
      expect(combos.combinations([], 3)).to.eql([]);
    });

    it('should return [] when k > terms.length (w/o replacement)', () => {
      expect(combos.combinations([1, 2], 4)).to.eql([]);
      expect(combos.combinations([1, 2, 3], 4)).to.eql([]);
      expect(combos.combinations([1, 2, 3, 4], 4)).to.not.eql([]);
    });

    it('should not return [] when k > terms.length w/ replacements', () => {
      var cs = combos.combinations([1, 2], 3, true);

      expect(cs).to.include.deep.members([
        [1, 1, 1],
        [1, 1, 2],
        [1, 2, 2],
        [2, 2, 2]
      ]);
      expect(cs.length).to.equal(4);
    });

  });

  describe('combinationsFromBins()', () => {

    it('should return all combinations of k items, one from each bin', () => {
      var cs = combos.combinationsFromBins([
        ['a', 'aa'],
        ['b', 'bb'],
        ['c', 'cc']
      ], 2);

      expect(cs).to.include.deep.members([
        ['a', 'b'],
        ['a', 'bb'],
        ['a', 'c'],
        ['a', 'cc'],
        ['aa', 'b'],
        ['aa', 'bb'],
        ['aa', 'c'],
        ['aa', 'cc'],
        ['b', 'c'],
        ['b', 'cc'],
        ['bb', 'c'],
        ['bb', 'cc']
      ]);
      expect(cs.length).to.equal(12);
    });

    it('does not choose more than one item from a bin', () => {
      var cs = combos.combinationsFromBins([
        ['a', 'aa'],
        ['b', 'bb'],
        ['c', 'cc']
      ], 2);

      // FIXME: Upon upgrading to chai v4.0+, change these to
      //        .to.not.deep.include(pair)
      expect(cs).to.not.include.deep.members([['a', 'aa']]);
      expect(cs).to.not.include.deep.members([['b', 'bb']]);
      expect(cs).to.not.include.deep.members([['c', 'cc']]);
    });

    it('should return [] when k <= 0', () => {
      expect(combos.combinationsFromBins([[1], [2], [3]], 0)).to.eql([]);
      expect(combos.combinationsFromBins([[1], [2], [3]], -1)).to.eql([]);
    });

    it('should return [] when terms == []', () => {
      expect(combos.combinationsFromBins([], 0)).to.eql([]);
      expect(combos.combinationsFromBins([], 3)).to.eql([]);
    });

    it('should return [] when k > terms.length', () => {
      expect(combos.combinationsFromBins([1, 2], 4)).to.eql([]);
      expect(combos.combinationsFromBins([1, 2, 3], 4)).to.eql([]);
      expect(combos.combinationsFromBins([[1], [2], [3], [4]], 4)).to.not.eql([]);
    });

  });

  describe('generateTerms()', () => {

    it('returns all terms for the given dep, indep, exps, mults, and lags', () => {
      // each triple => [column, exponent, lag]
      // [[0, 1, 0], [1, 2, 1]] => col(0)^1 * col(1)^2[lag 1] => x(y.shift(1))^2
      expect(combos.generateTerms(2, [0, 1], [1, 2], [2], [])).to.eql([
        [[0, 1, 0], [1, 1, 0]],
        [[0, 1, 0], [1, 2, 0]],
        [[0, 2, 0], [1, 1, 0]],
        [[0, 2, 0], [1, 2, 0]]
      ]);

      expect(combos.generateTerms(2, [0, 1], [1, 2], [1], [1])).to.eql([
        [[2, 1, 1]], [[2, 2, 1]],     // includes dependent column with lag > 0
        [[0, 1, 0]], [[0, 1, 1]],
        [[0, 2, 0]], [[0, 2, 1]],
        [[1, 1, 0]], [[1, 1, 1]],
        [[1, 2, 0]], [[1, 2, 1]],
      ]);
    });

  });

});

