import { createId } from './create-id';

describe('utils/create-id', () => {
  it('creates distinct ids with the prefix', () => {
    const first = createId('rule');
    expect(first).toMatch(/^rule-[a-z0-9]+-[a-z0-9]+$/);
    expect(createId('rule')).not.toBe(first);
  });
});
