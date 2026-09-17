import type { ToolPart } from '../types';
import { areToolPropsEqual, getLegacyToolState, getToolStatus } from './format-tool';

const part = (overrides: Partial<ToolPart> = {}): ToolPart => ({
  type: 'tool-Bash',
  toolCallId: 't1',
  state: 'input-available',
  input: { command: 'ls' },
  ...overrides,
});

describe('utils/format-tool', () => {
  it('treats output-error as a finished tool', () => {
    expect(getLegacyToolState(part({ state: 'output-error' }))).toBe('result');
    expect(getToolStatus(part({ state: 'output-error' }), 'streaming')).toMatchObject({
      isPending: false,
      isError: true,
    });
  });

  it('reports interrupted tools when the chat is no longer streaming', () => {
    expect(getToolStatus(part(), 'ready').isInterrupted).toBe(true);
    expect(getToolStatus(part(), 'streaming').isPending).toBe(true);
  });

  it('compares parts by identity of state, input and output', () => {
    const input = { command: 'ls' };
    const prev = part({ input });
    expect(areToolPropsEqual({ part: prev }, { part: prev })).toBe(true);
    expect(areToolPropsEqual({ part: prev }, { part: { ...prev } })).toBe(true);
    expect(
      areToolPropsEqual({ part: prev }, { part: { ...prev, state: 'output-available' } })
    ).toBe(false);
    expect(areToolPropsEqual({ part: prev }, { part: { ...prev, input: { command: 'ls' } } })).toBe(
      false
    );
  });

  it('does not share state between two cards with the same toolCallId', () => {
    const first = part();
    const next = { ...first, state: 'output-available' as const, output: 'done' };
    expect(areToolPropsEqual({ part: first }, { part: next })).toBe(false);
    expect(areToolPropsEqual({ part: first }, { part: next })).toBe(false);
  });

  it('re-renders when other props change', () => {
    const p = part();
    expect(areToolPropsEqual({ part: p, className: 'a' }, { part: p, className: 'b' })).toBe(false);
    expect(
      areToolPropsEqual({ part: p, chatStatus: 'streaming' }, { part: p, chatStatus: 'ready' })
    ).toBe(false);
  });
});
