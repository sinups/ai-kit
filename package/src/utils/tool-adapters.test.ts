import { mapToolInvocationToStep, mapToolStateToStepState } from './tool-adapters';

describe('utils/mapToolInvocationToStep', () => {
  it('maps bash results with exit code', () => {
    const step = mapToolInvocationToStep('1', {
      toolName: 'Bash',
      args: { command: 'ls' },
      state: 'result',
      result: { stdout: 'a', stderr: 'b', exitCode: 1 },
    });
    expect(step.bashCommand).toBe('ls');
    expect(step.bashOutput).toBe('a\nb');
    expect(step.bashSuccess).toBe(false);
  });

  it('maps edit structuredPatch to diff lines', () => {
    const step = mapToolInvocationToStep('2', {
      toolName: 'Edit',
      args: { file_path: '/repo/src/a.ts' },
      state: 'result',
      result: { structuredPatch: [{ lines: [' x', '-y', '+z'] }] },
    });
    expect(step.filePath).toBe('/repo/src/a.ts');
    expect(step.diffStats).toBe('+1 -1');
    expect(step.diffLines).toHaveLength(3);
  });

  it('maps write content to added lines', () => {
    const step = mapToolInvocationToStep('3', {
      toolName: 'Write',
      args: { file_path: 'a.ts', content: 'a\nb' },
      state: 'call',
    });
    expect(step.diffStats).toBe('+2');
  });

  it('maps tool state to step state', () => {
    expect(mapToolStateToStepState('result')).toBe('complete');
    expect(mapToolStateToStepState('call')).toBe('animating');
  });
});
