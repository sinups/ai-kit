import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { ToolApprovalsProvider } from '../approvals/tool-approvals';
import type { ToolPart } from '../types';
import { McpTool } from './McpTool';
import { ToolPresentationProvider } from './tool-presentation';
import { parseMcpToolType } from './tool-registry';

const type = 'tool-mcp__tracker__tracker_task_list_smart';
const info = parseMcpToolType(type)!;
const catalog = { mcp__tracker__tracker_task_list_smart: { title: 'Найти задачи по условиям' } };

const done: ToolPart = {
  type,
  toolCallId: 'c1',
  state: 'output-available',
  input: { payload: JSON.stringify({ assigneeIds: ['alice'], size: 100 }) },
  output: {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          total: 12,
          items: [
            { id: 'TRK-400', title: 'Перенести сборку' },
            { id: 'TRK-401', title: 'Обновить лицензии' },
          ],
        }),
      },
    ],
  },
};

describe('tools/McpTool with a catalog', () => {
  it('keeps the name of the tool and its raw arguments without a catalog', () => {
    render(<McpTool part={done} mcpInfo={info} chatStatus="ready" />);

    expect(screen.queryByText('Найти задачи по условиям')).toBeNull();
    expect(screen.queryByText(/12 items/)).toBeNull();
  });

  it('reads the call by its catalog title, a short argument line and the result', () => {
    render(
      <ToolPresentationProvider catalog={catalog}>
        <McpTool part={done} mcpInfo={info} chatStatus="ready" />
      </ToolPresentationProvider>
    );

    expect(screen.getByText('Найти задачи по условиям')).toBeInTheDocument();
    expect(screen.getByText('assigneeIds: alice · size: 100')).toBeInTheDocument();
    expect(screen.getByText('12 items')).toBeInTheDocument();
    expect(screen.getByText('TRK-400 · Перенести сборку')).toBeInTheDocument();
  });

  it('lets the formatters of the host replace the argument line and the result', () => {
    render(
      <ToolPresentationProvider
        catalog={catalog}
        args={{ 'tool-mcp__tracker__*': () => 'мои задачи' }}
        outputs={{ [type]: () => 'Двенадцать задач' }}
      >
        <McpTool part={done} mcpInfo={info} chatStatus="ready" />
      </ToolPresentationProvider>
    );

    expect(screen.getByText('мои задачи')).toBeInTheDocument();
    expect(screen.getByText('Двенадцать задач')).toBeInTheDocument();
  });

  it('leaves the error text of a refused call to the outcome line', () => {
    render(
      <ToolApprovalsProvider
        approvals={{ c3: { onApprove: () => {}, outcome: { decision: 'rejected' } } }}
      >
        <ToolPresentationProvider catalog={catalog}>
          <McpTool
            part={{
              ...done,
              toolCallId: 'c3',
              state: 'output-error',
              output: 'The user rejected this tool call.',
              errorText: 'The user rejected this tool call.',
            }}
            mcpInfo={info}
            chatStatus="ready"
          />
        </ToolPresentationProvider>
      </ToolApprovalsProvider>
    );

    expect(screen.getByText('Найти задачи по условиям')).toBeInTheDocument();
    expect(screen.queryByText('The user rejected this tool call.')).toBeNull();
  });

  it('reads a refusal from the call itself when the host settled nothing', () => {
    render(
      <ToolPresentationProvider catalog={catalog}>
        <McpTool
          part={{
            ...done,
            toolCallId: 'c4',
            state: 'output-error',
            output: undefined,
            errorText: 'The user rejected this tool call.',
          }}
          mcpInfo={info}
          chatStatus="ready"
        />
      </ToolPresentationProvider>
    );

    expect(screen.queryByText('The user rejected this tool call.')).toBeNull();
  });

  it('stops the shimmer while the host waits for a decision', () => {
    const { container } = render(
      <ToolApprovalsProvider approvals={{ c2: { onApprove: () => {} } }}>
        <ToolPresentationProvider catalog={catalog}>
          <McpTool
            part={{ ...done, toolCallId: 'c2', state: 'input-available', output: undefined }}
            mcpInfo={info}
            chatStatus="streaming"
          />
        </ToolPresentationProvider>
      </ToolApprovalsProvider>
    );

    expect(screen.getByText('Найти задачи по условиям')).toBeInTheDocument();
    expect(container.querySelector('.shimmer')).toBeNull();
  });
});
