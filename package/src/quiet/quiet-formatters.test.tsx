import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { AgentChat } from '../AgentChat/AgentChat';
import type { AgentChatLabels } from '../AgentChat/agent-chat-labels';
import type { ToolOutputFormatters } from '../rows/tool-output';
import type { ToolArgsFormatters } from '../tools/tool-args';
import type { ChatMessage, ToolPart } from '../types';
import { quietPresentation } from './quiet-presentation';

const catalog = {
  mcp__tracker__task_list: {
    title: 'Find tasks',
    outputSchema: {
      type: 'array' as const,
      items: { type: 'object' as const, properties: { key: { type: 'string' as const } } },
    },
  },
  create_note: { title: 'Create a note' },
};

const labels: Partial<AgentChatLabels> = {
  mcpTool: { failed: 'Error', arguments: 'Arguments', result: 'Result' },
  messageList: { toolRuns: { otherTools: (count) => `used ${count} tools` } },
};

const tasks: ToolPart = {
  type: 'tool-mcp__tracker__task_list',
  toolCallId: 't1',
  state: 'output-available',
  input: { assignee: 'alice', size: 100 },
  output: {
    content: [{ type: 'text', text: '2 tasks' }],
    structuredContent: [{ key: 'TRK-1' }, { key: 'TRK-2' }],
  },
};

function chat(
  parts: ToolPart[],
  { toolOutputs, toolArgs }: { toolOutputs?: ToolOutputFormatters; toolArgs?: ToolArgsFormatters }
) {
  const messages = [
    { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'What is mine?' }] },
    { id: 'a1', role: 'assistant', parts },
  ] as ChatMessage[];
  return (
    <AgentChat
      messages={messages}
      status="ready"
      onSend={() => {}}
      onStop={() => {}}
      slots={{ InputBar: () => null }}
      presentation={quietPresentation}
      toolCatalog={catalog}
      toolOutputs={toolOutputs}
      toolArgs={toolArgs}
      labels={labels}
      workingRow={false}
    />
  );
}

async function openRun() {
  await userEvent.click(screen.getByText('Used 1 tools').closest('button')!);
}

describe('quiet presentation with the formatters of the host', () => {
  it('takes the summary of a call from toolOutputs, with the protocol context', async () => {
    const format = jest.fn(() => 'Two tasks for Alice');
    render(chat([tasks], { toolOutputs: { 'tool-mcp__tracker__*': format } }));
    await openRun();

    expect(screen.getByText('Two tasks for Alice')).toBeInTheDocument();
    expect(format).toHaveBeenCalledWith(
      tasks,
      expect.objectContaining({
        state: 'done',
        result: tasks.output,
        schema: catalog.mcp__tracker__task_list.outputSchema,
        summary: '2 items',
      })
    );
  });

  it('keeps the summary of the kit when the formatter returns null', async () => {
    render(chat([tasks], { toolOutputs: { 'tool-mcp__tracker__*': () => null } }));
    await openRun();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('lets the formatter word the reason of a failure', () => {
    const failed: ToolPart = {
      ...tasks,
      state: 'output-error',
      output: undefined,
      errorText: 'quota_exceeded',
    };
    render(
      chat([failed], {
        toolOutputs: {
          'tool-mcp__tracker__*': (_part, ctx) =>
            ctx.state === 'error' ? 'The daily limit is reached' : null,
        },
      })
    );
    expect(screen.getByText('Error · The daily limit is reached')).toBeInTheDocument();
  });

  it('shows the arguments as toolArgs wrote them instead of their JSON', async () => {
    render(
      chat([tasks], {
        toolArgs: { 'tool-mcp__tracker__*': (_part, ctx) => `Tasks of ${ctx.args.assignee}` },
      })
    );
    await openRun();
    await userEvent.click(screen.getByText('Find tasks').closest('button')!);
    expect(screen.getByText('Tasks of alice')).toBeInTheDocument();
    expect(screen.queryByText(/"assignee"/)).toBeNull();
  });

  it('quiets a local tool of the host that the catalog describes, and keeps built-in cards', async () => {
    const note: ToolPart = {
      type: 'tool-create_note',
      toolCallId: 'n1',
      state: 'output-available',
      input: { title: 'Plan' },
      output: 'Saved',
    };
    const bash: ToolPart = {
      type: 'tool-Bash',
      toolCallId: 'b1',
      state: 'output-available',
      input: { command: 'yarn test' },
      output: { stdout: 'PASS', exitCode: 0 },
    };
    expect(quietPresentation.isQuiet(note, catalog)).toBe(true);
    expect(quietPresentation.isQuiet(note)).toBe(false);
    expect(quietPresentation.isQuiet(bash, catalog)).toBe(false);

    render(chat([note, bash], {}));
    await openRun();
    expect(screen.getByText('Create a note')).toBeInTheDocument();
    expect(screen.getByText('Ran command: yarn')).toBeInTheDocument();
  });
});
