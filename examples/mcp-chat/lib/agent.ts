import { query } from '@anthropic-ai/claude-agent-sdk';
import { askUser } from './approvals';
import { config, mcpServers, serverOf } from './config';
import { describeCall } from './describe-call';
import type { AgentEvent, ApprovalOutcome } from './events';
import { mcpServerInfo } from './mcp-tools';
import { addRule, matchingRule, permissionState } from './permissions';
import { buildSystemPrompt } from './system-prompt';

function textDelta(event: {
  type: string;
  delta?: { type?: string; text?: string };
}): string | null {
  if (event.type !== 'content_block_delta' || event.delta?.type !== 'text_delta') {
    return null;
  }
  return event.delta.text ?? null;
}

export function runAgent(
  chatId: string,
  prompt: string,
  sessionId: string | undefined,
  signal: AbortSignal
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const emit = (event: AgentEvent) => {
        if (!closed) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
      };

      const run = query({
        prompt,
        options: {
          model: config.model,
          maxTurns: config.maxTurns,
          systemPrompt: buildSystemPrompt(await mcpServerInfo()),
          tools: [],
          settingSources: [],
          strictMcpConfig: true,
          includePartialMessages: true,
          permissionMode: 'default',
          resume: sessionId,
          mcpServers: mcpServers(),
          canUseTool: async (name, input, options) => {
            const settle = (outcome: ApprovalOutcome, matchedRule?: string) => {
              emit({
                kind: 'approval-settled',
                requestId: options.requestId,
                toolCallId: options.toolUseID,
                name,
                outcome,
                matchedRule,
              });
              emit({ kind: 'permissions', state: permissionState(chatId) });
            };

            const rule = matchingRule(chatId, name);
            const state = permissionState(chatId);
            if (rule || state.auto) {
              settle(rule ? 'rule' : 'auto', rule?.toolName);
              return { behavior: 'allow', updatedInput: input };
            }

            emit({
              kind: 'approval',
              requestId: options.requestId,
              toolCallId: options.toolUseID,
              name,
              details: await describeCall(name, input, serverOf(name)?.name ?? 'mcp'),
            });
            const choice = await askUser(options.requestId, signal);
            if (choice === 'session' || choice === 'always') {
              addRule(chatId, name, choice === 'always' ? 'user' : 'session');
            }
            settle(choice);
            return choice === 'deny'
              ? { behavior: 'deny', message: 'The user rejected this tool call.' }
              : { behavior: 'allow', updatedInput: input };
          },
        },
      });

      signal.addEventListener('abort', () => run.interrupt?.(), { once: true });

      try {
        for await (const message of run) {
          if (message.type === 'system' && message.subtype === 'init') {
            emit({ kind: 'session', sessionId: message.session_id, tools: message.tools });
            emit({ kind: 'permissions', state: permissionState(chatId) });
          } else if (message.type === 'stream_event') {
            const delta = textDelta(message.event as never);
            if (delta) {
              emit({ kind: 'text', delta });
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
          }
        }
      } catch (error) {
        emit({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
      } finally {
        emit({ kind: 'done' });
        closed = true;
        controller.close();
      }
    },
  });
}
