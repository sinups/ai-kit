import { applyCompletion, findCompletionToken } from './completion-token';

describe('findCompletionToken', () => {
  it('finds a slash command at the start of the input', () => {
    expect(findCompletionToken('/rev', 4, ['/', '@'])).toEqual({
      trigger: '/',
      query: 'rev',
      start: 0,
      end: 4,
    });
  });

  it('finds a slash command at the start of a later line', () => {
    expect(findCompletionToken('hi\n/co', 6, ['/'])).toMatchObject({ query: 'co', start: 3 });
  });

  it('ignores a slash in the middle of a line', () => {
    expect(findCompletionToken('see a/b', 7, ['/'])).toBeNull();
    expect(findCompletionToken('see /b', 6, ['/'])).toBeNull();
  });

  it('finds a mention after a space', () => {
    expect(findCompletionToken('ask @ali', 8, ['@'])).toEqual({
      trigger: '@',
      query: 'ali',
      start: 4,
      end: 8,
    });
  });

  it('ignores a trigger glued to a previous word', () => {
    expect(findCompletionToken('mail@host', 9, ['@'])).toBeNull();
  });

  it('returns an empty query right after the trigger', () => {
    expect(findCompletionToken('@', 1, ['@'])).toMatchObject({ query: '' });
  });

  it('closes once a space follows the query', () => {
    expect(findCompletionToken('@ali ', 5, ['@'])).toBeNull();
  });

  it('extends the token end past the caret', () => {
    expect(findCompletionToken('@alice rest', 2, ['@'])).toMatchObject({ query: 'a', end: 6 });
  });

  it('prefers the longest matching trigger', () => {
    expect(findCompletionToken('#!x', 3, ['#', '#!'])).toMatchObject({ trigger: '#!', query: 'x' });
  });
});

describe('applyCompletion', () => {
  it('replaces the token with the trigger, value and a trailing space', () => {
    const token = findCompletionToken('ask @al now', 7, ['@'])!;
    expect(applyCompletion('ask @al now', token, 'alice')).toEqual({
      text: 'ask @alice now',
      caret: 11,
    });
  });

  it('appends a space at the end of the input', () => {
    const token = findCompletionToken('/re', 3, ['/'])!;
    expect(applyCompletion('/re', token, 'review')).toEqual({ text: '/review ', caret: 8 });
  });
});
