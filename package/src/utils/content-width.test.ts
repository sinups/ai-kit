import { getContentWidthStyle } from './content-width';

describe('utils/content-width', () => {
  it('keeps the style untouched without a width', () => {
    const style = { color: 'red' };
    expect(getContentWidthStyle(undefined, style)).toBe(style);
  });

  it('converts numbers to rem and passes strings through', () => {
    expect(getContentWidthStyle(768)).toEqual({
      '--ae-max-width': 'calc(48rem * var(--mantine-scale))',
    });
    expect(getContentWidthStyle('100%', { color: 'red' })).toEqual({
      '--ae-max-width': '100%',
      color: 'red',
    });
  });
});
