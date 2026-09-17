import { getBashRunInfo } from './bash-output';

describe('tools/bash-output', () => {
  it('reads a streaming tail with timeout and start time', () => {
    expect(
      getBashRunInfo({
        type: 'tool-Bash',
        state: 'input-available',
        input: { command: 'yarn build', timeout: 120000 },
        output: { outputTail: 'building…', outputBytes: 20480 },
        callProviderMetadata: { custom: { startedAt: 1000 } },
      })
    ).toEqual({
      output: 'building…',
      timeoutMs: 120000,
      startedAt: 1000,
      sizeBytes: 20480,
      exitCode: undefined,
      durationMs: undefined,
    });
  });

  it('joins stdout and stderr of a finished run', () => {
    const info = getBashRunInfo({
      type: 'tool-Bash',
      state: 'output-available',
      input: { command: 'yarn test' },
      output: { stdout: 'ok', stderr: 'warn', exit_code: 1, duration_ms: 3200 },
    });
    expect(info).toMatchObject({ output: 'ok\nwarn', exitCode: 1, durationMs: 3200 });
  });

  it('accepts string output and missing output', () => {
    expect(
      getBashRunInfo({ type: 'tool-Bash', state: 'output-available', input: {}, output: 'done' })
        .output
    ).toBe('done');
    expect(getBashRunInfo({ type: 'tool-Bash', state: 'input-streaming', input: {} }).output).toBe(
      undefined
    );
  });
});
