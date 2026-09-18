import type { ChatMessage, ToolPart } from '../types';
import { createToolCallLookups, deriveToolCallState } from './tool-call-state';

const call = (overrides: Partial<ToolPart> = {}): ToolPart => ({
  type: 'tool-Bash',
  toolCallId: 'c1',
  state: 'input-available',
  input: { command: 'ls' },
  ...overrides,
});

const message = (parts: ToolPart[]): ChatMessage => ({ id: 'm1', role: 'assistant', parts });

describe('tools/tool-call-state', () => {
  it('derives running, done and error from the part alone', () => {
    expect(deriveToolCallState(call(), { chatStatus: 'streaming' })).toBe('running');
    expect(deriveToolCallState(call({ state: 'input-streaming' }), { chatStatus: 'ready' })).toBe(
      'running'
    );
    expect(deriveToolCallState(call({ state: 'output-available', output: 'ok' }))).toBe('done');
    expect(deriveToolCallState(call({ state: 'output-error', errorText: 'boom' }))).toBe('error');
    expect(
      deriveToolCallState(call({ state: 'output-available', output: { success: false } }))
    ).toBe('error');
  });

  it('reads a refusal from the output and from the error text', () => {
    expect(
      deriveToolCallState(call({ state: 'output-error', errorText: 'Rejected by the user' }))
    ).toBe('rejected');
    expect(
      deriveToolCallState(call({ state: 'output-available', output: { rejected: true } }))
    ).toBe('rejected');
  });

  it('says a call is waiting for a decision instead of idle', () => {
    const part = call({ input: { command: 'rm -rf build', approval: { reason: 'Destructive' } } });
    expect(deriveToolCallState(part, { chatStatus: 'ready' })).toBe('awaiting-permission');
  });

  it('does not flash running for a restored call whose result came later', () => {
    const part = call();
    const lookups = createToolCallLookups([
      message([part]),
      message([call({ state: 'output-available', output: 'ok' })]),
    ]);
    expect(deriveToolCallState(part, { chatStatus: 'streaming', lookups })).toBe('done');
  });

  it('queues every open call after the first one', () => {
    const first = call({ toolCallId: 'a' });
    const second = call({ toolCallId: 'b' });
    const third = call({ toolCallId: 'c' });
    const lookups = createToolCallLookups([message([first, second, third])]);
    expect(deriveToolCallState(first, { chatStatus: 'streaming', lookups })).toBe('running');
    expect(deriveToolCallState(second, { chatStatus: 'streaming', lookups })).toBe('queued');
    expect(deriveToolCallState(third, { chatStatus: 'streaming', lookups })).toBe('queued');
  });

  it('takes an open decision over the queue', () => {
    const waiting = call({
      toolCallId: 'a',
      input: { command: 'rm -rf build', approval: { reason: 'Destructive' } },
    });
    const next = call({ toolCallId: 'b' });
    const lookups = createToolCallLookups([message([waiting, next])]);
    expect(deriveToolCallState(waiting, { chatStatus: 'streaming', lookups })).toBe(
      'awaiting-permission'
    );
    expect(deriveToolCallState(next, { chatStatus: 'streaming', lookups })).toBe('running');
  });

  it('survives a malformed transcript', () => {
    const lookups = createToolCallLookups([
      null as unknown as ChatMessage,
      { id: 'm2', role: 'assistant', parts: 'nope' } as unknown as ChatMessage,
      message([call({ input: 'not json at all' })]),
    ]);
    expect(lookups.hasResult?.('c1')).toBe(false);
    expect(deriveToolCallState(call({ input: 'not json at all' }), { lookups })).toBe('running');
  });
});
