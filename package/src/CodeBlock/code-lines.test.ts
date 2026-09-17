import { countCodeLines, getCollapsedLineCount } from './code-lines';

describe('code lines', () => {
  it('counts lines ignoring one trailing newline', () => {
    expect(countCodeLines('')).toBe(1);
    expect(countCodeLines('a\nb')).toBe(2);
    expect(countCodeLines('a\nb\n')).toBe(2);
    expect(countCodeLines('a\n\n')).toBe(2);
  });

  it('collapses only when enough lines would be hidden', () => {
    expect(getCollapsedLineCount(24, 20)).toBeNull();
    expect(getCollapsedLineCount(25, 20)).toBe(20);
    expect(getCollapsedLineCount(100)).toBe(20);
  });
});
