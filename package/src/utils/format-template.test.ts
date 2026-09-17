import { formatTemplate } from './format-template';

describe('utils/format-template', () => {
  it('replaces every placeholder and keeps replacement patterns literal', () => {
    expect(formatTemplate('{count} of {count} {name}', { count: 2, name: 'a' })).toBe('2 of 2 a');
    expect(formatTemplate('Remove {name}?', { name: "$& $' $`" })).toBe("Remove $& $' $`?");
    expect(formatTemplate('No {missing}', {})).toBe('No {missing}');
  });
});
