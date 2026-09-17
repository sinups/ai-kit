import { formatCount } from './format-count';

describe('utils/format-count', () => {
  it('picks the singular form only for one', () => {
    expect(formatCount(1, 'file', 'files')).toBe('1 file');
    expect(formatCount(0, 'file', 'files')).toBe('0 files');
    expect(formatCount(3, 'search', 'searches')).toBe('3 searches');
  });
});
