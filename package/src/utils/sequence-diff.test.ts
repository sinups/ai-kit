import { diffSequences, type SequenceDiffOp } from './sequence-diff';

function collect<T>(a: T[], b: T[], maxCells = 1_000) {
  const ops: [SequenceDiffOp, T][] = [];
  diffSequences(a, b, maxCells, (op, item) => ops.push([op, item]));
  return ops;
}

describe('utils/diffSequences', () => {
  it('keeps the common prefix and suffix and diffs the middle', () => {
    expect(collect(['a', 'b', 'c', 'd'], ['a', 'x', 'c', 'd'])).toEqual([
      ['equal', 'a'],
      ['remove', 'b'],
      ['add', 'x'],
      ['equal', 'c'],
      ['equal', 'd'],
    ]);
  });

  it('finds the longest common subsequence in the middle', () => {
    expect(collect([1, 2, 3, 4], [0, 2, 4, 5])).toEqual([
      ['remove', 1],
      ['add', 0],
      ['equal', 2],
      ['remove', 3],
      ['equal', 4],
      ['add', 5],
    ]);
  });

  it('replaces the middle wholesale above the cell limit', () => {
    expect(collect(['s', 1, 2, 'e'], ['s', 2, 1, 'e'], 3)).toEqual([
      ['equal', 's'],
      ['remove', 1],
      ['remove', 2],
      ['add', 2],
      ['add', 1],
      ['equal', 'e'],
    ]);
  });
});
