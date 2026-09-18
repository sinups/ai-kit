import path from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { askUser } from './approvals';
import { config, mcpServers, sampleDir, serverOf } from './config';
import { describeCall } from './describe-call';
import type { AgentEvent, ApprovalChoice, ApprovalOutcome } from './events';
import { isReadOnlyTool, mcpServerInfo } from './mcp-tools';
import { addRule, matchingRule, permissionState } from './permissions';
import { buildSystemPrompt } from './system-prompt';
import { isKnownModel } from './models';

type StreamEvent = {
  type: string;
  delta?: { type?: string; text?: string; thinking?: string };
};

function textDelta(event: StreamEvent): string | null {
  if (event.type !== 'content_block_delta' || event.delta?.type !== 'text_delta') {
    return null;
  }
  return event.delta.text ?? null;
}

function thinkingDelta(event: StreamEvent): string | null {
  if (event.type !== 'content_block_delta' || event.delta?.type !== 'thinking_delta') {
    return null;
  }
  return event.delta.thinking ?? null;
}

/** Tells the model which file the user keeps open, so "this file" has a referent */
export function withContext(prompt: string, contextFile: string | undefined): string {
  if (!contextFile || contextFile.includes('/') || contextFile.includes('..')) {
    return prompt;
  }
  return `${prompt}\n\n(The user has ${path.join(sampleDir, contextFile)} open in context. Read it when the question is about it.)`;
}

export function runAgent(
  chatId: string,
  prompt: string,
  sessionId: string | undefined,
  model: string | undefined,
  signal: AbortSignal
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let closed = false;

  return new ReadableStream<Uint8Array>({
    cancel() {
      closed = true;
    },
    async start(controller) {
      const emit = (event: AgentEvent) => {
        if (closed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };

      if (signal.aborted) {
        closed = true;
        controller.close();
        return;
      }

      const run = query({
        prompt,
        options: {
          model: isKnownModel(model) ? model : config.model,
          maxTurns: config.maxTurns,
          systemPrompt: buildSystemPrompt(await mcpServerInfo()),
          tools: [],
          settingSources: [],
          strictMcpConfig: true,
          includePartialMessages: true,
          thinking: { type: 'adaptive', display: 'summarized' },
          permissionMode: 'default',
          resume: sessionId,
          mcpServers: mcpServers(),
          canUseTool: async (name, input, options) => {
            const settle = (outcome: ApprovalOutcome) => {
              emit({
                kind: 'approval-settled',
                requestId: options.requestId,
                toolCallId: options.toolUseID,
                name,
                outcome,
              });
              emit({ kind: 'permissions', state: permissionState(chatId) });
            };
            const allow = () => ({ behavior: 'allow' as const, updatedInput: input });

            if (matchingRule(chatId, name, 'deny')) {
              settle('blocked');
              return {
                behavior: 'deny',
                message: 'A permission rule of this chat denies this tool.',
              };
            }
            const { mode } = permissionState(chatId);
            const readOnly = await isReadOnlyTool(name);
            if (mode === 'read-only' && !readOnly) {
              settle('blocked');
              return {
                behavior: 'deny',
                message:
                  'The chat is in read-only mode: this tool changes data, so it was not run.',
              };
            }
            const askRule = matchingRule(chatId, name, 'ask');
            if (!askRule && mode !== 'ask-all') {
              if (matchingRule(chatId, name, 'allow')) {
                settle('rule');
                return allow();
              }
              if (mode === 'auto' || readOnly) {
                settle('auto');
                return allow();
              }
            }

            emit({
              kind: 'approval',
              requestId: options.requestId,
              toolCallId: options.toolUseID,
              name,
              details: await describeCall(name, serverOf(name)?.name ?? 'mcp'),
              matchedRule: askRule?.toolName,
            });
            const choice: ApprovalChoice = await askUser(chatId, options.requestId, signal);
            if (choice === 'session' || choice === 'always') {
              addRule(chatId, name, choice === 'always' ? 'user' : 'session');
            }
            settle(choice);
            return choice === 'once' || choice === 'session' || choice === 'always'
              ? allow()
              : { behavior: 'deny', message: 'The user rejected this tool call.' };
          },
        },
      });

      const interrupt = () => void run.interrupt?.().catch(() => {});
      if (signal.aborted) {
        interrupt();
      } else {
        signal.addEventListener('abort', interrupt, { once: true });
      }

      try {
        for await (const message of run) {
          if (message.type === 'system' && message.subtype === 'init') {
            emit({ kind: 'session', sessionId: message.session_id, tools: message.tools });
            emit({ kind: 'permissions', state: permissionState(chatId) });
          } else if (message.type === 'stream_event') {
            const event = message.event as StreamEvent;
            const delta = textDelta(event);
            if (delta) {
              emit({ kind: 'text', delta });
            }
            const thought = thinkingDelta(event);
            if (thought) {
              emit({ kind: 'thinking', delta: thought });
            }
          } else if (message.type === 'assistant') {
            for (const block of message.message.content) {
              if (block.type === 'tool_use') {
                emit({
                  kind: 'tool-start',
                  toolCallId: block.id,
                  name: block.name,
                  input: (block.input ?? {}) as Record<string, unknown>,
                });
              }
            }
          } else if (message.type === 'user' && Array.isArray(message.message.content)) {
            for (const block of message.message.content) {
              if (block.type === 'tool_result') {
                emit({
                  kind: 'tool-end',
                  toolCallId: block.tool_use_id,
                  output: block.content,
                  isError: block.is_error === true,
                });
              }
            }
          } else if (message.type === 'result') {
            const usage = message.usage;
            const context =
              (usage.input_tokens ?? 0) +
              (usage.cache_read_input_tokens ?? 0) +
              (usage.cache_creation_input_tokens ?? 0) +
              (usage.output_tokens ?? 0);
            emit({
              kind: 'usage',
              usage: {
                tokens: usage.output_tokens ?? 0,
                contextTokens: context,
                contextWindow: config.contextWindow,
                durationMs: message.duration_ms,
              },
            });
            if (message.subtype !== 'success') {
              emit({ kind: 'error', message: `The agent stopped: ${message.subtype}` });
            }
            break;
          }
        }
      } catch (error) {
        emit({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
      } finally {
        signal.removeEventListener('abort', interrupt);
        emit({ kind: 'done' });
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // The client left and the stream is already gone
          }
        }
      }
    },
  });
}
