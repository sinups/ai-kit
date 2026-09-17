import { getToolName, getToolResultNoticeVariant } from './tool-result-notice';

describe('message-actions/tool-result-notice', () => {
  it('derives the variant from the part state and chat status', () => {
    const part = (state: string) => ({ type: 'tool-Edit', state });
    expect(getToolResultNoticeVariant(part('output-denied'))).toBe('rejected');
    expect(getToolResultNoticeVariant(part('output-error'))).toBe('error');
    expect(getToolResultNoticeVariant(part('output-cancelled'))).toBe('cancelled');
    expect(getToolResultNoticeVariant(part('output-available'), 'ready')).toBeNull();
    expect(getToolResultNoticeVariant(part('input-available'), 'streaming')).toBeNull();
    expect(getToolResultNoticeVariant(part('input-available'), 'ready')).toBe('interrupted');
  });

  it('reads the tool name', () => {
    expect(getToolName({ type: 'tool-Bash' })).toBe('Bash');
    expect(getToolName({ type: 'dynamic-tool', toolName: 'git_search' })).toBe('git_search');
  });
});
