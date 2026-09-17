import { isSafeHttpUrl } from './safe-url';

describe('utils/isSafeHttpUrl', () => {
  it('accepts absolute http and https urls only', () => {
    expect(isSafeHttpUrl('https://example.com/docs')).toBe(true);
    expect(isSafeHttpUrl('http://localhost:3000')).toBe(true);
    expect(isSafeHttpUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeHttpUrl('data:text/html,<b>x</b>')).toBe(false);
    expect(isSafeHttpUrl('/relative/path')).toBe(false);
    expect(isSafeHttpUrl('not a url')).toBe(false);
  });
});
