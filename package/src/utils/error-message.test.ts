import { getErrorMessage } from './error-message';

describe('utils/error-message', () => {
  it('prefers the error message, then a string reason, then the fallback', () => {
    expect(getErrorMessage(new Error('Network down'), 'Failed')).toBe('Network down');
    expect(getErrorMessage('Timed out', 'Failed')).toBe('Timed out');
    expect(getErrorMessage(new Error(''), 'Failed')).toBe('Failed');
    expect(getErrorMessage({ code: 1 }, 'Failed')).toBe('Failed');
  });
});
