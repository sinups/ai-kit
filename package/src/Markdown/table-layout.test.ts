import { shouldStackTable } from './table-layout';

describe('shouldStackTable', () => {
  it('never stacks before the width is measured or with few columns', () => {
    expect(shouldStackTable(6, 0)).toBe(false);
    expect(shouldStackTable(2, 100)).toBe(false);
  });

  it('stacks when the columns do not fit their minimum width', () => {
    expect(shouldStackTable(3, 340)).toBe(true);
    expect(shouldStackTable(3, 360)).toBe(false);
    expect(shouldStackTable(5, 520)).toBe(true);
    expect(shouldStackTable(5, 520, 100)).toBe(false);
  });
});
