import type { ChatMessage, ToolPart } from '../types';
import {
  getMessagePartIndex,
  hasUnresolvedToolCalls,
  indexTranscript,
  isFeedPart,
} from './transcript-index';

function call(toolCallId: string, extra: Partial<ToolPart> = {}): ToolPart {
  return { type: 'tool-Read', toolCallId, state: 'input-available', ...extra } as ToolPart;
}

function done(toolCallId: string, output: unknown = 'ok', extra: Partial<ToolPart> = {}): ToolPart {
  return call(toolCallId, { state: 'output-available', output, ...extra });
}

describe('MessageList/indexTranscript', () => {
  it('returns nothing to render for an empty transcript', () => {
    expect(indexTranscript([])).toEqual({
      turns: [],
      lastUserMessageId: null,
      lastAssistantHasContent: false,
    });
  });

  it('groups messages into turns and remembers the newest prompt', () => {
    const messages: ChatMessage[] = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'First' }] },
      { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'Answer' }] },
      { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'Second' }] },
      { id: 'a2', role: 'assistant', parts: [{ type: 'text', text: '' }] },
    ];
    const index = indexTranscript(messages);
    expect(index.turns).toHaveLength(2);
    expect(index.turns[1].userMsg?.id).toBe('u2');
    expect(index.turns[1].assistantMsgs.map((msg) => msg.id)).toEqual(['a2']);
    expect(index.lastUserMessageId).toBe('u2');
    expect(index.lastAssistantHasContent).toBe(false);
  });

  it('counts a tool call as content of the newest answer', () => {
    const index = indexTranscript([
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Run it' }] },
      { id: 'a1', role: 'assistant', parts: [call('c1')] } as ChatMessage,
    ]);
    expect(index.lastAssistantHasContent).toBe(true);
  });

  it('keeps only feed parts of a message with another role', () => {
    const index = indexTranscript([
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Go on' }] },
      {
        id: 's1',
        role: 'system',
        parts: [
          { type: 'text', text: 'ignored' },
          { type: 'turn-summary', durationMs: 1000 },
        ],
      } as unknown as ChatMessage,
      { id: 's2', role: 'system', parts: [{ type: 'text', text: 'ignored' }] } as ChatMessage,
    ]);
    expect(index.turns).toHaveLength(1);
    expect(index.turns[0].assistantMsgs).toHaveLength(1);
    expect(index.turns[0].assistantMsgs[0].parts.every(isFeedPart)).toBe(true);
  });
});

describe('MessageList/getMessagePartIndex', () => {
  it('finds nothing in a message without parts', () => {
    const index = getMessagePartIndex(undefined);
    expect(index.lastTextIndex).toBe(-1);
    expect(index.unresolvedToolCallCount).toBe(0);
    expect(index.toolCallById.size).toBe(0);
    expect(getMessagePartIndex([]).toolCallById.size).toBe(0);
  });

  it('indexes interleaved tool calls and text in one pass', () => {
    const parts = [
      { type: 'text', text: 'Looking' },
      done('c1'),
      { type: 'text', text: 'and then' },
      done('c2', { success: false }),
      done('c3', undefined, { state: 'output-error', errorText: 'denied' }),
    ];
    const index = getMessagePartIndex(parts);

    expect(index.lastTextIndex).toBe(2);
    expect([...index.toolCallById.keys()]).toEqual(['c1', 'c2', 'c3']);
    expect([...index.resolvedToolCallIds]).toEqual(['c1', 'c2', 'c3']);
    expect([...index.erroredToolCallIds]).toEqual(['c2', 'c3']);
    expect(index.resultByToolCallId.get('c1')).toBe('ok');
    expect(index.unresolvedToolCallCount).toBe(0);
    expect(hasUnresolvedToolCalls(parts)).toBe(false);
  });

  it('leaves a call whose result never arrives out of the results', () => {
    const parts = [done('c1'), call('c2'), { type: 'text', text: 'still working' }];
    const index = getMessagePartIndex(parts);

    expect(index.resolvedToolCallIds.has('c2')).toBe(false);
    expect(index.resultByToolCallId.has('c2')).toBe(false);
    expect(index.toolCallById.get('c2')).toBe(parts[1]);
    expect(index.unresolvedToolCallCount).toBe(1);
    expect(hasUnresolvedToolCalls(parts)).toBe(true);
  });

  it('collects the nested calls of a task next to their parent', () => {
    const parts = [
      done('task-1', 'ok', { type: 'tool-Task' }),
      done('task-1:1'),
      done('other:1'),
      done('task-1:2'),
      done('task-1:3', 'ok', { type: 'tool-TaskOutput' }),
    ];
    const index = getMessagePartIndex(parts);

    expect(index.siblingsByParentId.get('task-1')?.map((part) => part.toolCallId)).toEqual([
      'task-1:1',
      'task-1:2',
    ]);
    expect(index.siblingsByParentId.has('other')).toBe(false);
    expect([...index.nestedToolCallIds]).toEqual(['task-1:1', 'task-1:2']);
  });

  it('reuses the index while the parts array stays the same', () => {
    const parts = [done('c1')];
    expect(getMessagePartIndex(parts)).toBe(getMessagePartIndex(parts));
    expect(getMessagePartIndex([...parts])).not.toBe(getMessagePartIndex(parts));
  });
});
