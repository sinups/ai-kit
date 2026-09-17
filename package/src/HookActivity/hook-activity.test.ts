import { getHookActivityTitle } from './hook-activity';

describe('HookActivity/hook-activity', () => {
  it('titles each status', () => {
    expect(getHookActivityTitle('PreToolUse', 'running', 0)).toBe('Running PreToolUse hooks…');
    expect(getHookActivityTitle('PreToolUse', 'done', 3)).toBe('Ran 3 PreToolUse hooks');
    expect(getHookActivityTitle('Stop', 'done', 1)).toBe('Ran 1 Stop hook');
    expect(getHookActivityTitle('PreToolUse', 'blocked', 1)).toBe('Blocked by PreToolUse hook');
    expect(getHookActivityTitle('PostToolUse', 'error', 2)).toBe('PostToolUse hook failed');
  });
});
