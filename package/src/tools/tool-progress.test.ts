import { formatToolProgress, getToolProgress, getToolProgressRatio } from './tool-progress';

describe('tools/tool-progress', () => {
  it('reads the notification from the part and from the provider metadata', () => {
    expect(
      getToolProgress({
        type: 'tool-mcp__tracker__search',
        progress: { progress: 3, total: 10, message: 'Reading tasks', progressToken: 7 },
      })
    ).toEqual({ progress: 3, total: 10, message: 'Reading tasks', progressToken: 7 });

    expect(
      getToolProgress({
        type: 'tool-mcp__tracker__search',
        callProviderMetadata: { custom: { progress: { progress: 2 } } },
      })
    ).toEqual({ progress: 2, total: undefined, message: undefined, progressToken: undefined });
  });

  it('ignores a call without progress and malformed values', () => {
    expect(getToolProgress({ type: 'tool-Read' })).toBeUndefined();
    expect(
      getToolProgress({ type: 'tool-Read', progress: { total: 10 } as never })
    ).toBeUndefined();
    expect(
      getToolProgress({ type: 'tool-Read', progress: { progress: Number.NaN } })
    ).toBeUndefined();
  });

  it('formats a share of the total and falls back to the raw count', () => {
    expect(formatToolProgress({ progress: 3, total: 10 })).toBe('30%');
    expect(formatToolProgress({ progress: 12 })).toBe('12');
    expect(getToolProgressRatio({ progress: 15, total: 10 })).toBe(1);
    expect(getToolProgressRatio({ progress: 3 })).toBeUndefined();
    expect(getToolProgressRatio({ progress: 3, total: 0 })).toBeUndefined();
  });
});
