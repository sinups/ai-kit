import { fillTemplate } from './fill-template';

describe('utils/fill-template', () => {
  it('replaces every known placeholder and keeps unknown ones', () => {
    expect(fillTemplate('{a} and {b} {c} {a}', { a: '1', b: '2' })).toBe('1 and 2 {c} 1');
  });
});
