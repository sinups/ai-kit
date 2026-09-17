import { truncateErrorMessage } from './error-message';

describe('ErrorMessage/truncateErrorMessage', () => {
  it('keeps short messages', () => {
    expect(truncateErrorMessage('Boom')).toEqual({ text: 'Boom', truncated: false });
    expect(truncateErrorMessage('a\nb\nc\nd\ne\nf')).toEqual({
      text: 'a\nb\nc\nd\ne\nf',
      truncated: false,
    });
  });

  it('cuts after the maximum number of lines', () => {
    expect(truncateErrorMessage('1\n2\n3\n4\n5\n6\n7\n8')).toEqual({
      text: '1\n2\n3\n4\n5\n6…',
      truncated: true,
    });
  });

  it('cuts long text at a nearby word boundary', () => {
    const message = `${'word '.repeat(150)}end`;
    const { text, truncated } = truncateErrorMessage(message);
    expect(truncated).toBe(true);
    expect(text.length).toBeLessThanOrEqual(601);
    expect(text.endsWith('word…')).toBe(true);
  });

  it('cuts a long unbroken string at the limit', () => {
    const { text } = truncateErrorMessage('x'.repeat(700), 100);
    expect(text).toBe(`${'x'.repeat(100)}…`);
  });
});
