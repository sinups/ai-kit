import { query } from '@anthropic-ai/claude-agent-sdk';
import { askUser } from './approvals';
import { config, mcpServer, sampleDir } from './config';
import type { AgentEvent, ApprovalOutcome } from './events';
import { isPreApproved, permissionState, rememberTool } from './permissions';

const SYSTEM_PROMPT = [
  'You are a demo assistant for a UI kit example.',
  `Answer every question with the tools of the "${config.serverName}" MCP server instead of guessing.`,
  config.transport === 'stdio'
    ? `The server is scoped to the folder ${sampleDir}.`
    : 'The server is reached over HTTP and holds the data you are asked about.',
  'Reply in the language the user writes in.',
  'Act instead of interviewing: when a request is clear enough, call the tools, pick sensible defaults for anything optional and say afterwards what you assumed.',
  'Ask at most one short question, and only when a required argument cannot be guessed or the action would be destructive.',
  'Answer in markdown, keep answers under six lines and use lists for collections.',
].join(' ');

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
          cwd: sampleDir,
          maxTurns: config.maxTurns,
          systemPrompt: SYSTEM_PROMPT,
          tools: [],
          settingSources: [],
          strictMcpConfig: true,
          includePartialMessages: true,
          permissionMode: 'default',
          resume: sessionId,
          mcpServers: { [config.serverName]: mcpServer },
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

            if (isPreApproved(chatId, name)) {
              settle('auto');
              return { behavior: 'allow', updatedInput: input };
            }

            emit({
              kind: 'approval',
              requestId: options.requestId,
              toolCallId: options.toolUseID,
              name,
              title: options.title,
            });
            const choice = await askUser(options.requestId, signal);
            if (choice === 'always') {
              rememberTool(chatId, name);
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
          } else if (message.type === 'result' && message.subtype !== 'success') {
            emit({ kind: 'error', message: `The agent stopped: ${message.subtype}` });
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
