'use client';

import type {
  ChatMessage,
  ChatStatus,
  MessagePart,
  PermissionRule,
  ToolPart,
} from '@sinups/ai-kit';
import { useCallback, useRef, useState } from 'react';
import type {
  AgentEvent,
  ApprovalChoice,
  ApprovalDetails,
  ApprovalOutcome,
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

function withParts(messages: ChatMessage[], update: (parts: MessagePart[]) => MessagePart[]) {
  const last = messages.at(-1);
  if (!last || last.role !== 'assistant') {
    return messages;
  }
  return [...messages.slice(0, -1), { ...last, parts: update(last.parts) }];
}

function appendText(parts: MessagePart[], delta: string): MessagePart[] {
  const last = parts.at(-1);
  if (last && last.type === 'text') {
    return [...parts.slice(0, -1), { ...last, text: `${(last as { text: string }).text}${delta}` }];
  }
  return [...parts, { type: 'text', text: delta }];
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

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [error, setError] = useState<Error | undefined>(undefined);
  const [approvals, setApprovals] = useState<Record<string, ApprovalState>>({});
  const [permissions, setPermissions] = useState<PermissionState>({ rules: [], auto: false });
  const [usage, setUsage] = useState<TurnUsage | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [tools, setTools] = useState<string[]>([]);
  const sessionId = useRef<string | undefined>(undefined);
  const [chatId] = useState(() => `chat-${Math.random().toString(36).slice(2)}`);
  const abort = useRef<AbortController | null>(null);

  const decide = useCallback(async (requestId: string, choice: ApprovalChoice) => {
    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, choice }),
    });
  }, []);

  const updatePermissions = useCallback(
    async (patch: { auto?: boolean; reset?: boolean; save?: PermissionRule; remove?: string }) => {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, ...patch }),
      });
      setPermissions((await response.json()) as PermissionState);
    },
    [chatId]
  );

  const stop = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setStatus('ready');
  }, []);

  const send = useCallback(
    async ({ content }: { content: string }) => {
      const controller = new AbortController();
      abort.current = controller;
      setError(undefined);
      setStatus('submitted');
      setStartedAt(Date.now());
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
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`The chat endpoint answered ${response.status}`);
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
            case 'tool-start':
              setMessages((current) =>
                withParts(current, (parts) => [
                  ...parts,
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
                    errorText: event.isError ? String(event.output) : undefined,
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
                    durationMs: event.usage.durationMs,
                    tokens: event.usage.tokens,
                  },
                ])
              );
              break;
            case 'error':
              setError(new Error(event.message));
              break;
            case 'done':
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
      }
    },
    [chatId]
  );

  return {
    messages,
    status,
    error,
    send,
    stop,
    approvals,
    decide,
    permissions,
    updatePermissions,
    usage,
    startedAt,
    tools,
  };
}
