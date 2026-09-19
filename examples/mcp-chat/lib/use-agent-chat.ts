'use client';

import type {
  ChatMessage,
  ChatStatus,
  MessagePart,
  PermissionRule,
  ToolPart,
} from '@sinups/ai-kit';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AgentEvent,
  ApprovalChoice,
  ApprovalDetails,
  ApprovalOutcome,
  PermissionMode,
  PermissionState,
  TurnUsage,
} from './events';

export type ApprovalState = {
  requestId: string;
  toolCallId: string;
  name: string;
  details?: ApprovalDetails;
  outcome?: ApprovalOutcome;
  matchedRule?: string;
};

/** Texts the hook writes into the transcript itself, from the dictionary of the page */
export type AgentChatTexts = {
  /** Result of a call the turn ended before it answered */
  interrupted: string;
  /** Error shown when the server did not accept a decision */
  approvalFailed: string;
  /** Error shown when the chat endpoint refuses the request, `{status}` is replaced */
  chatFailed: string;
};

function withParts(messages: ChatMessage[], update: (parts: MessagePart[]) => MessagePart[]) {
  const last = messages.at(-1);
  if (!last || last.role !== 'assistant') {
    return messages;
  }
  return [...messages.slice(0, -1), { ...last, parts: update(last.parts) }];
}

const THINKING = 'tool-Thinking';

function isOpenThinking(part: MessagePart | undefined): part is ToolPart {
  return part?.type === THINKING && (part as ToolPart).state === 'input-streaming';
}

function closeThinking(parts: MessagePart[]): MessagePart[] {
  const last = parts.at(-1);
  if (!isOpenThinking(last)) {
    return parts;
  }
  return [...parts.slice(0, -1), { ...last, state: 'output-available' }];
}

function appendThinking(parts: MessagePart[], delta: string, id: string): MessagePart[] {
  const last = parts.at(-1);
  if (isOpenThinking(last)) {
    const thought = `${(last.input as { thought?: string } | undefined)?.thought ?? ''}${delta}`;
    return [...parts.slice(0, -1), { ...last, input: { thought } }];
  }
  return [
    ...parts,
    { type: THINKING, toolCallId: id, state: 'input-streaming', input: { thought: delta } },
  ];
}

function appendText(parts: MessagePart[], delta: string): MessagePart[] {
  const closed = closeThinking(parts);
  const last = closed.at(-1);
  if (last && last.type === 'text') {
    return [
      ...closed.slice(0, -1),
      { ...last, text: `${(last as { text: string }).text}${delta}` },
    ];
  }
  return [...closed, { type: 'text', text: delta }];
}

function isOpenTool(part: MessagePart): part is ToolPart {
  const state = (part as ToolPart).state;
  return (
    part.type.startsWith('tool-') &&
    part.type !== THINKING &&
    (state === 'input-streaming' || state === 'input-available')
  );
}

function closeOpenTools(parts: MessagePart[], interrupted: string): MessagePart[] {
  return closeThinking(parts).map((part) =>
    isOpenTool(part) ? { ...part, state: 'output-error', errorText: interrupted } : part
  );
}

/** Text of an MCP result: the text blocks joined, anything else as JSON */
function outputText(output: unknown): string {
  if (typeof output === 'string') {
    return output;
  }
  const blocks =
    output && typeof output === 'object' && !Array.isArray(output)
      ? (output as { content?: unknown }).content
      : output;
  if (Array.isArray(blocks)) {
    const texts = blocks
      .map((block) =>
        block && typeof block === 'object' && typeof (block as { text?: unknown }).text === 'string'
          ? (block as { text: string }).text
          : null
      )
      .filter((text): text is string => text !== null);
    if (texts.length > 0) {
      return texts.join('\n');
    }
  }
  return JSON.stringify(output);
}

function updateTool(
  parts: MessagePart[],
  toolCallId: string,
  patch: Partial<ToolPart>
): MessagePart[] {
  return parts.map((part) =>
    (part as ToolPart).toolCallId === toolCallId ? { ...part, ...patch } : part
  );
}

async function* readEvents(response: Response): AsyncGenerator<AgentEvent> {
  const reader = response.body?.getReader();
  if (!reader) {
    return;
  }
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim()) {
        yield JSON.parse(line) as AgentEvent;
      }
    }
  }
}

export function useAgentChat(texts: AgentChatTexts) {
  const textsRef = useRef(texts);
  useEffect(() => {
    textsRef.current = texts;
  }, [texts]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<Error | undefined>(undefined);
  const [approvals, setApprovals] = useState<Record<string, ApprovalState>>({});
  const [permissions, setPermissions] = useState<PermissionState>({
    rules: [],
    mode: 'ask-writes',
  });
  const [usage, setUsage] = useState<TurnUsage | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const sessionId = useRef<string | undefined>(undefined);
  const [chatId] = useState(
    () => `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
  const abort = useRef<AbortController | null>(null);
  const [model, setModel] = useState<string | undefined>(undefined);

  const decide = useCallback(
    async (requestId: string, choice: ApprovalChoice) => {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, requestId, choice }),
      }).catch(() => null);
      if (!response?.ok) {
        setError(new Error(textsRef.current.approvalFailed));
      }
    },
    [chatId]
  );

  const updatePermissions = useCallback(
    async (patch: {
      mode?: PermissionMode;
      reset?: boolean;
      save?: PermissionRule;
      remove?: string;
    }) => {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, ...patch }),
      });
      const body = (await response.json()) as PermissionState | { error: string };
      if (!response.ok || 'error' in body) {
        throw new Error('error' in body ? body.error : `${response.status}`);
      }
      setPermissions(body);
    },
    [chatId]
  );

  const stop = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setStatus('ready');
  }, []);

  const send = useCallback(
    async ({ content, contextFile }: { content: string; contextFile?: string }) => {
      const controller = new AbortController();
      abort.current = controller;
      setError(undefined);
      setStatus('submitted');
      const turnStartedAt = Date.now();
      setStartedAt(turnStartedAt);
      setMessages((current) => [
        ...current,
        { id: `u-${Date.now()}`, role: 'user', parts: [{ type: 'text', text: content }] },
        { id: `a-${Date.now()}`, role: 'assistant', parts: [] },
      ]);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            prompt: content,
            sessionId: sessionId.current,
            model,
            contextFile,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(textsRef.current.chatFailed.replace('{status}', String(response.status)));
        }

        for await (const event of readEvents(response)) {
          switch (event.kind) {
            case 'session':
              sessionId.current = event.sessionId;
              setTools(event.tools);
              setStatus('streaming');
              break;
            case 'text':
              setMessages((current) =>
                withParts(current, (parts) => appendText(parts, event.delta))
              );
              break;
            case 'thinking':
              setMessages((current) =>
                withParts(current, (parts) =>
                  appendThinking(parts, event.delta, `thinking-${Date.now()}`)
                )
              );
              break;
            case 'tool-start':
              setMessages((current) =>
                withParts(current, (parts) => [
                  ...closeThinking(parts),
                  {
                    type: `tool-${event.name}`,
                    toolCallId: event.toolCallId,
                    state: 'input-available',
                    input: event.input,
                  },
                ])
              );
              break;
            case 'tool-end':
              setMessages((current) =>
                withParts(current, (parts) =>
                  updateTool(parts, event.toolCallId, {
                    state: event.isError ? 'output-error' : 'output-available',
                    output: event.output,
                    errorText: event.isError ? outputText(event.output) : undefined,
                  })
                )
              );
              break;
            case 'approval':
              setApprovals((current) => ({
                ...current,
                [event.toolCallId]: {
                  requestId: event.requestId,
                  toolCallId: event.toolCallId,
                  name: event.name,
                  details: event.details,
                  matchedRule: event.matchedRule,
                },
              }));
              break;
            case 'approval-settled':
              setApprovals((current) => ({
                ...current,
                [event.toolCallId]: {
                  ...current[event.toolCallId],
                  requestId: event.requestId,
                  toolCallId: event.toolCallId,
                  name: event.name,
                  outcome: event.outcome,
                },
              }));
              break;
            case 'permissions':
              setPermissions(event.state);
              break;
            case 'usage':
              setUsage(event.usage);
              setMessages((current) =>
                withParts(current, (parts) => [
                  ...parts,
                  {
                    type: 'turn-summary',
                    durationMs: Date.now() - turnStartedAt,
                    tokens: event.usage.tokens,
                  },
                ])
              );
              break;
            case 'error':
              setError(new Error(event.message));
              break;
            case 'done':
              setStatus((current) => (current === 'error' ? current : 'ready'));
              break;
          }
        }
        setStatus('ready');
      } catch (cause) {
        if ((cause as Error).name !== 'AbortError') {
          setError(cause instanceof Error ? cause : new Error(String(cause)));
          setStatus('error');
        }
      } finally {
        abort.current = null;
        const interrupted = textsRef.current.interrupted;
        setMessages((current) => withParts(current, (parts) => closeOpenTools(parts, interrupted)));
        setApprovals((current) =>
          Object.fromEntries(
            Object.entries(current).map(([id, approval]) => [
              id,
              approval.outcome ? approval : { ...approval, outcome: 'interrupted' as const },
            ])
          )
        );
      }
    },
    [chatId, model]
  );

  const retry = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    const text = lastUserMessage?.parts.find((part) => part.type === 'text');
    if (text) {
      setMessages((current) => current.slice(0, current.indexOf(lastUserMessage!)));
      void send({ content: (text as { text: string }).text });
    }
  }, [messages, send]);

  return {
    messages,
    status,
    error,
    send,
    stop,
    retry,
    approvals,
    decide,
    permissions,
    updatePermissions,
    usage,
    startedAt,
    tools,
    model,
    setModel,
  };
}
