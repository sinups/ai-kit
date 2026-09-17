import { useCallback, useEffect, useRef, useState } from 'react';
import type { ElicitationAction } from '../../elicitation/ElicitationForm';
import type { ElicitationContent } from '../../elicitation/elicitation-schema';
import type { PlanDecision } from '../../message-actions/types';
import type { ChatMessage, ChatStatus, MessagePart } from '../../types';
import {
  DEMO_PLAN,
  DEPLOY_SCHEMA,
  ELICITATION_ANSWER,
  ELICITATION_TOOL,
  EXPLORE_ANSWER,
  PLAN_ANSWER,
  PLAN_APPROVAL_TOOL,
  RETRY_ANSWER,
  createExploreParts,
  createUserMessage,
  pickScenario,
  splitIntoChunks,
  type DemoScenario,
} from './demo-script';

export type ApprovalDecision = { approved: true; scope?: string } | { approved: false };
export type ElicitationDecision = { action: ElicitationAction; content?: ElicitationContent };

export interface DemoChatOptions {
  /** Messages the conversation starts with */
  initialMessages: ChatMessage[];
  /** Called when a tool call is approved with the `always` scope */
  onAlwaysAllow?: (rule: string) => void;
}

class CancelledRun extends Error {}

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${idCounter++}`;

function getText(message: ChatMessage | undefined): string {
  const part = message?.parts.find((item) => item.type === 'text') as { text?: string } | undefined;
  return part?.text ?? '';
}

export function useDemoChat({ initialMessages, onAlwaysAllow }: DemoChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [waitingFor, setWaitingFor] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | undefined>(undefined);
  const [lastActivityAt, setLastActivityAt] = useState<number | undefined>(undefined);
  const [tokens, setTokens] = useState(0);
  const runRef = useRef(0);
  const turnRef = useRef(0);
  const resolversRef = useRef(new Map<string, (value: unknown) => void>());
  const alwaysAllowRef = useRef(onAlwaysAllow);
  alwaysAllowRef.current = onAlwaysAllow;

  useEffect(() => () => void (runRef.current += 1), []);

  const updateMessage = useCallback(
    (id: string, update: (parts: MessagePart[]) => MessagePart[]) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, parts: update(message.parts) } : message
        )
      );
    },
    []
  );

  const resolveDecision = useCallback((key: string, value: unknown) => {
    const resolve = resolversRef.current.get(key);
    resolversRef.current.delete(key);
    resolve?.(value);
  }, []);

  const runScenario = useCallback(
    async (scenario: DemoScenario | 'retry', assistantId: string) => {
      const run = ++runRef.current;
      const ensureActive = () => {
        if (runRef.current !== run) {
          throw new CancelledRun();
        }
      };
      const sleep = async (ms: number) => {
        await new Promise((resolve) => setTimeout(resolve, ms));
        ensureActive();
        setLastActivityAt(Date.now());
      };
      const waitFor = async <T>(key: string, label: string): Promise<T> => {
        setWaitingFor(label);
        const value = await new Promise<unknown>((resolve) =>
          resolversRef.current.set(key, resolve)
        );
        setWaitingFor(null);
        ensureActive();
        return value as T;
      };
      const appendPart = (part: MessagePart) =>
        updateMessage(assistantId, (parts) => [...parts, part]);
      const patchPart = (toolCallId: string, patch: Partial<MessagePart>) =>
        updateMessage(assistantId, (parts) =>
          parts.map((part) =>
            (part as { toolCallId?: string }).toolCallId === toolCallId
              ? { ...part, ...patch }
              : part
          )
        );
      const streamText = async (text: string) => {
        const index = { value: -1 };
        updateMessage(assistantId, (parts) => {
          index.value = parts.length;
          return [...parts, { type: 'text', text: '' }];
        });
        for (const chunk of splitIntoChunks(text)) {
          await sleep(45);
          setTokens((value) => value + 3);
          updateMessage(assistantId, (parts) =>
            parts.map((part, position) =>
              position === index.value && part.type === 'text'
                ? { ...part, text: `${(part as { text: string }).text}${chunk}` }
                : part
            )
          );
        }
      };

      setStatus('submitted');
      setStartedAt(Date.now());
      setLastActivityAt(Date.now());
      setTokens(0);
      try {
        await sleep(600);
        setStatus('streaming');

        if (scenario === 'explore') {
          const [intro, ...tools] = createExploreParts();
          await streamText((intro as { text: string }).text);
          for (const tool of tools) {
            await sleep(350);
            appendPart({ ...tool, state: 'input-available' });
            await sleep(450);
            patchPart((tool as { toolCallId: string }).toolCallId, { state: 'output-available' });
          }
          const bashId = nextId('bash');
          appendPart({
            type: 'tool-Bash',
            toolCallId: bashId,
            state: 'input-available',
            input: {
              command: 'npm run test -- src/auth',
              description: 'Run the auth tests',
              approval: {
                reason: 'Runs a command that is not allowed by your permission rules',
                labels: { approve: 'Run', reject: 'Skip' },
                approveOptions: [
                  { value: 'once', label: 'Allow once' },
                  { value: 'session', label: 'Allow for this session' },
                  {
                    value: 'always',
                    label: 'Always allow npm run test',
                    description: 'Adds Bash(npm run test:*) to local permission rules',
                  },
                ],
                onApprove: (scope?: string) =>
                  resolveDecision(`approval:${bashId}`, { approved: true, scope }),
                onReject: () => resolveDecision(`approval:${bashId}`, { approved: false }),
                onRejectWithFeedback: () =>
                  resolveDecision(`approval:${bashId}`, { approved: false }),
              },
            },
          });
          const decision = await waitFor<ApprovalDecision>(
            `approval:${bashId}`,
            'Waiting for approval'
          );
          if (!decision.approved) {
            patchPart(bashId, { state: 'output-error', errorText: 'Rejected by the user' });
            await streamText('Okay, I will not run the tests. Tell me what to do instead.');
          } else {
            if (decision.scope === 'always') {
              alwaysAllowRef.current?.('Bash(npm run test:*)');
            }
            await sleep(1200);
            patchPart(bashId, {
              state: 'output-available',
              output: {
                stdout: 'Test Suites: 6 passed\nTests: 42 passed\nTime: 3.1 s',
                exitCode: 0,
              },
            });
            await streamText(EXPLORE_ANSWER);
          }
        } else if (scenario === 'elicitation') {
          await streamText('The deploy server needs a few details before it can start.');
          const toolCallId = nextId('elicitation');
          appendPart({
            type: `tool-${ELICITATION_TOOL}`,
            toolCallId,
            state: 'input-available',
            input: {
              serverName: 'deploy-server',
              message: 'Choose where to deploy build 2.4.0.',
              requestedSchema: DEPLOY_SCHEMA,
            },
          });
          const decision = await waitFor<ElicitationDecision>(
            `elicitation:${toolCallId}`,
            'Waiting for your input'
          );
          patchPart(toolCallId, { state: 'output-available', output: decision });
          await streamText(
            decision.action === 'accept'
              ? ELICITATION_ANSWER
              : 'Deployment cancelled. Nothing was changed.'
          );
        } else if (scenario === 'plan') {
          await streamText('Here is the plan. Nothing is edited until you approve it.');
          const toolCallId = nextId('plan');
          appendPart({
            type: `tool-${PLAN_APPROVAL_TOOL}`,
            toolCallId,
            state: 'input-available',
            input: { plan: DEMO_PLAN },
          });
          const decision = await waitFor<PlanDecision>(
            `plan:${toolCallId}`,
            'Waiting for plan approval'
          );
          patchPart(toolCallId, { state: 'output-available', output: decision });
          await streamText(
            decision.kind === 'rejected'
              ? `Understood, I will revise the plan: ${decision.feedback}`
              : PLAN_ANSWER
          );
        } else if (scenario === 'error') {
          await streamText('Connecting to the build service');
          await sleep(900);
          appendPart({
            type: 'error',
            title: 'Request failed',
            message: 'Connection to the model was lost (ECONNRESET). Retry the turn to continue.',
          });
          setStatus('error');
          return;
        } else {
          await streamText(RETRY_ANSWER);
        }
        setStatus('ready');
      } catch (error) {
        if (!(error instanceof CancelledRun)) {
          throw error;
        }
      } finally {
        if (runRef.current === run) {
          setWaitingFor(null);
        }
      }
    },
    [resolveDecision, updateMessage]
  );

  const send = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text) {
        return;
      }
      const assistantId = nextId('assistant');
      const scenario = pickScenario(text, turnRef.current++);
      setMessages((current) => [
        ...current,
        createUserMessage(nextId('user'), text),
        { id: assistantId, role: 'assistant', parts: [] },
      ]);
      void runScenario(scenario, assistantId);
    },
    [runScenario]
  );

  const stop = useCallback(() => {
    runRef.current += 1;
    const pending = new Map(resolversRef.current);
    resolversRef.current.clear();
    const pendingToolCalls = new Set(Array.from(pending.keys(), (key) => key.split(':')[1]));
    const isPending = (part: MessagePart) =>
      pendingToolCalls.has((part as { toolCallId?: string }).toolCallId ?? '');
    setMessages((current) =>
      current.map((message) =>
        message.parts.some(isPending)
          ? {
              ...message,
              parts: message.parts.map((part) =>
                isPending(part)
                  ? ({ ...part, state: 'output-error', errorText: 'Stopped' } as MessagePart)
                  : part
              ),
            }
          : message
      )
    );
    pending.forEach((resolve) => resolve(undefined));
    setWaitingFor(null);
    setStatus('ready');
  }, []);

  const retry = useCallback(
    (assistantId: string) => {
      const index = messages.findIndex((message) => message.id === assistantId);
      if (index === -1) {
        return;
      }
      const isError = messages[index].parts.some((part) => part.type === 'error');
      const prompt = getText(
        messages
          .slice(0, index)
          .reverse()
          .find((m) => m.role === 'user')
      );
      const nextAssistantId = nextId('assistant');
      setMessages((current) => [
        ...current.slice(0, index),
        { id: nextAssistantId, role: 'assistant', parts: [] },
      ]);
      void runScenario(
        isError ? 'retry' : pickScenario(prompt, turnRef.current++),
        nextAssistantId
      );
    },
    [messages, runScenario]
  );

  const retryLast = useCallback(() => {
    const last = [...messages].reverse().find((message) => message.role === 'assistant');
    if (last) {
      retry(last.id);
    }
  }, [messages, retry]);

  const handleToolAction = useCallback(
    (toolCallId: string, action: string, payload?: unknown) => {
      if (action === 'plan') {
        resolveDecision(`plan:${toolCallId}`, payload);
      } else {
        resolveDecision(`elicitation:${toolCallId}`, { action, content: payload });
      }
    },
    [resolveDecision]
  );

  const edit = useCallback(
    (userId: string, text: string) => {
      const index = messages.findIndex((message) => message.id === userId);
      if (index === -1) {
        return;
      }
      setMessages((current) => current.slice(0, index));
      send(text);
    },
    [messages, send]
  );

  const reset = useCallback(
    (next: ChatMessage[]) => {
      stop();
      setMessages(next);
    },
    [stop]
  );

  return {
    messages,
    status,
    waitingFor,
    startedAt,
    lastActivityAt,
    tokens,
    send,
    stop,
    retry,
    retryLast,
    handleToolAction,
    edit,
    reset,
    resolveDecision,
  };
}
