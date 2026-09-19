import { isSafeLinkUrl, isSafeMediaUrl, readUrlScheme } from './safe-url';

const script = ['java', 'script:alert(1)'].join('');

describe('utils/safe-url', () => {
  it('reads the scheme the way a browser does', () => {
    expect(readUrlScheme('HTTPS://a.b')).toBe('https');
    expect(readUrlScheme(' \tjava\nscript:x')).toBe('javascript');
    expect(readUrlScheme('/files/a.png')).toBeNull();
    expect(readUrlScheme('docs/a.md')).toBeNull();
  });

  it('keeps every link but the ones that run code or embed content', () => {
    for (const url of [
      'https://a.b',
      '/docs',
      '#top',
      'mailto:a@b.c',
      'tel:1',
      'ftp://a.b',
      'vscode://file/a',
      'artifact:x',
    ]) {
      expect(isSafeLinkUrl(url)).toBe(true);
    }
    for (const url of [
      script,
      ` ${script}`,
      'java\tscript:x',
      'VBScript:x',
      'data:text/html,x',
      'blob:https://a/1',
      'file:///etc/passwd',
    ]) {
      expect(isSafeLinkUrl(url)).toBe(false);
    }
  });

  it('lets relative, web and data media addresses reach the page', () => {
    expect(isSafeMediaUrl('/files/a.png')).toBe(true);
    expect(isSafeMediaUrl('https://a/b.mp3')).toBe(true);
    expect(isSafeMediaUrl('data:audio/mpeg;base64,AAA')).toBe(true);
    expect(isSafeMediaUrl('data:text/html,<b>x</b>')).toBe(false);
    expect(isSafeMediaUrl('blob:https://a/1')).toBe(false);
    expect(isSafeMediaUrl(script)).toBe(false);
  });
});
