import { fillTemplate } from './fill-template';

describe('utils/fill-template', () => {
  it('replaces every known placeholder and keeps unknown ones', () => {
    expect(fillTemplate('{a} and {b} {c} {a}', { a: '1', b: '2' })).toBe('1 and 2 {c} 1');
  });

  it('formats numbers', () => {
    expect(fillTemplate('{count} of {count} {name}', { count: 2, name: 'a' })).toBe('2 of 2 a');
  });

  it('does not expand placeholders coming from a value', () => {
    expect(fillTemplate('Remove {name}?', { name: '{count}', count: 7 })).toBe('Remove {count}?');
  });

  it('keeps replacement patterns literal', () => {
    expect(fillTemplate('Remove {name}?', { name: "$& $' $`" })).toBe("Remove $& $' $`?");
  });
});
