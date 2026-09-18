import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { ToolPart } from '../types';
import { createToolCallLookups } from '../tools/tool-call-state';
import { ToolApprovalsProvider } from '../approvals/tool-approvals';
import { ToolPresentationProvider } from '../tools/tool-presentation';
import { ResponseRow } from './ResponseRow';
import { ToolPartRow } from './ToolPartRow';

const readCall: ToolPart = {
  type: 'tool-Read',
  toolCallId: 'r1',
  state: 'output-available',
  input: { file_path: 'src/app.ts' },
  output: 'line 1\nline 2\nline 3\nline 4\nline 5',
};

function marker(container: HTMLElement) {
  return container.querySelector('[data-state]')!;
}

describe('rows/ToolPartRow', () => {
  it('puts the name, the arguments and the first lines of the output in the transcript', () => {
    const { container } = render(<ToolPartRow part={readCall} chatStatus="ready" />);

    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('(src/app.ts)')).toBeInTheDocument();
    expect(screen.getByText(/line 3/)).toBeInTheDocument();
    expect(screen.queryByText(/line 4/)).toBeNull();
    expect(screen.getByText('… +2 lines')).toBeInTheDocument();
    expect(marker(container)).toHaveAttribute('data-state', 'done');
  });

  it('marks a failure with the error marker and keeps ten lines of it', () => {
    const errorText = Array.from({ length: 14 }, (_, index) => `error ${index + 1}`).join('\n');
    const { container } = render(
      <ToolPartRow
        part={{ type: 'tool-Bash', toolCallId: 'b1', state: 'output-error', errorText }}
        chatStatus="ready"
      />
    );

    expect(marker(container)).toHaveAttribute('data-state', 'error');
    expect(screen.getByText(/error 10/)).toBeInTheDocument();
    expect(screen.queryByText(/error 11/)).toBeNull();
    expect(screen.getByText('… +4 lines')).toBeInTheDocument();
  });

  it('says a call is queued, waiting for a decision or refused', () => {
    const waiting: ToolPart = {
      type: 'tool-Bash',
      toolCallId: 'p1',
      state: 'input-available',
      input: { command: 'rm -rf build', approval: { decision: null } },
    };
    const queued: ToolPart = {
      type: 'tool-Read',
      toolCallId: 'q1',
      state: 'input-available',
      input: { file_path: 'src/b.ts' },
    };
    const lookups = createToolCallLookups([
      { id: 'm1', role: 'assistant', parts: [waiting, queued, { ...queued, toolCallId: 'q2' }] },
    ]);

    render(
      <>
        <ToolPartRow part={waiting} chatStatus="streaming" lookups={lookups} />
        <ToolPartRow
          part={{ ...queued, toolCallId: 'q2' }}
          chatStatus="streaming"
          lookups={lookups}
        />
        <ToolPartRow
          part={{
            type: 'tool-Bash',
            toolCallId: 'x1',
            state: 'output-error',
            errorText: 'Rejected by the user',
          }}
          chatStatus="ready"
        />
      </>
    );

    expect(screen.getByText('Waiting for permission')).toBeInTheDocument();
    expect(screen.getByText('Queued')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
  });

  it('gives the permission slot of the host the place of the waiting line', () => {
    render(
      <ToolPartRow
        part={{
          type: 'tool-Bash',
          toolCallId: 'p2',
          state: 'input-available',
          input: { command: 'rm -rf build', approval: { decision: null } },
        }}
        chatStatus="streaming"
        approval={<button type="button">Allow once</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Allow once' })).toBeInTheDocument();
    expect(screen.queryByText('Waiting for permission')).toBeNull();
  });

  it('puts the approval of the host under the gutter and then its outcome', () => {
    const call: ToolPart = {
      type: 'tool-Bash',
      toolCallId: 'a1',
      state: 'input-available',
      input: { command: 'rm -rf build' },
    };
    const { rerender } = render(
      <ToolApprovalsProvider approvals={{ a1: { onApprove: () => {} } }}>
        <ToolPartRow part={call} chatStatus="streaming" />
      </ToolApprovalsProvider>
    );

    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();

    rerender(
      <ToolApprovalsProvider
        approvals={{
          a1: {
            onApprove: () => {},
            outcome: { decision: 'rejected', scope: 'session' },
          },
        }}
      >
        <ToolPartRow part={call} chatStatus="streaming" />
      </ToolApprovalsProvider>
    );

    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    expect(screen.getByText('Skipped · session')).toBeInTheDocument();
  });

  it('sums up an edit instead of printing its output', () => {
    render(
      <ToolPartRow
        part={{
          type: 'tool-Edit',
          toolCallId: 'e1',
          state: 'output-available',
          input: { file_path: '/repo/src/app.ts', old_string: 'a\nb', new_string: 'a\nc\nd' },
          output: {},
        }}
        chatStatus="ready"
      />
    );

    expect(screen.getByText('Updated app.ts with 2 additions and 1 removals')).toBeInTheDocument();
  });

  it('sums an MCP result up by its output schema instead of printing its JSON', () => {
    render(
      <ToolPresentationProvider
        catalog={{
          mcp__tracker__task_list: {
            outputSchema: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'title'],
                properties: { id: { type: 'string' }, title: { type: 'string' } },
              },
            },
          },
        }}
      >
        <ToolPartRow
          part={{
            type: 'tool-mcp__tracker__task_list',
            toolCallId: 'm1',
            state: 'output-available',
            input: { overdue: true },
            output: {
              content: [{ type: 'text', text: '4 overdue issues' }],
              structuredContent: [
                { id: 'TRK-400', title: 'Перенести сборку' },
                { id: 'TRK-401', title: 'Обновить лицензии' },
                { id: 'TRK-402', title: 'Почистить ветки' },
                { id: 'TRK-403', title: 'Сверить бюджеты' },
              ],
            },
          }}
          chatStatus="ready"
        />
      </ToolPresentationProvider>
    );

    expect(screen.getByText(/4 items/)).toBeInTheDocument();
    expect(screen.getByText(/TRK-400 · Перенести сборку/)).toBeInTheDocument();
    expect(screen.queryByText(/"title"/)).toBeNull();
  });

  it('keeps the text of an MCP result without a schema behind the toggle', async () => {
    render(
      <ToolPartRow
        part={{
          type: 'tool-mcp__tracker__task_list',
          toolCallId: 'm1',
          state: 'output-available',
          input: {},
          output: [{ type: 'text', text: '4 overdue issues' }],
        }}
        chatStatus="ready"
      />
    );
    expect(screen.queryByText('4 overdue issues')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'show result' }));
    expect(screen.getByText('4 overdue issues')).toBeInTheDocument();
  });

  it('opens the whole result on a click and folds it back', async () => {
    render(
      <ToolPartRow
        part={{
          type: 'tool-mcp__tracker__page_get',
          toolCallId: 'm2',
          state: 'output-available',
          input: { page: 'План недели' },
          output: { id: 'PAGE-7', title: 'План недели', words: 1240 },
        }}
        chatStatus="ready"
      />
    );

    const toggle = screen.getByRole('button', { expanded: false });
    expect(screen.queryByText(/"words"/)).toBeNull();

    await userEvent.click(toggle);
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
    expect(screen.getByText(/"words"/)).toBeInTheDocument();
  });

  it('lets a formatter of the host replace the summary and fall back to it', () => {
    const part = {
      type: 'tool-mcp__tracker__task_create',
      toolCallId: 'm3',
      state: 'output-available',
      input: { title: 'Разобрать просроченное' },
      output: { id: 'TRK-482', title: 'Разобрать просроченное' },
    } as ToolPart;

    const { rerender } = render(
      <ToolPartRow
        part={part}
        chatStatus="ready"
        toolOutputs={{ 'tool-mcp__tracker__*': () => 'Создана задача TRK-482' }}
      />
    );
    expect(screen.getByText('Создана задача TRK-482')).toBeInTheDocument();

    rerender(
      <ToolPartRow
        part={part}
        chatStatus="ready"
        toolOutputs={{ 'tool-mcp__tracker__*': () => null }}
      />
    );
    expect(screen.getByText(/id: TRK-482 · title: Разобрать просроченное/)).toBeInTheDocument();
  });

  it('says a refused call once when the host settled its approval', () => {
    render(
      <ToolApprovalsProvider
        approvals={{ x2: { onApprove: () => {}, outcome: { decision: 'rejected' } } }}
      >
        <ToolPartRow
          part={{
            type: 'tool-Bash',
            toolCallId: 'x2',
            state: 'output-error',
            errorText: 'Rejected by the user',
          }}
          chatStatus="ready"
        />
      </ToolApprovalsProvider>
    );

    expect(screen.getAllByText('Skipped')).toHaveLength(1);
  });

  it('reads a call by its catalog title and its arguments as they are', () => {
    render(
      <ToolPresentationProvider
        catalog={{ mcp__tracker__tracker_task_search: { title: 'Найти задачи по условиям' } }}
      >
        <ToolPartRow
          part={{
            type: 'tool-mcp__tracker__tracker_task_search',
            toolCallId: 'c1',
            state: 'input-available',
            input: { size: 100, overdue: true },
          }}
          chatStatus="streaming"
        />
      </ToolPresentationProvider>
    );

    expect(screen.getByText('Найти задачи по условиям')).toBeInTheDocument();
    expect(screen.getByText('(size: 100 · overdue)')).toBeInTheDocument();
  });

  it('draws one gutter for an answer nested in another answer', () => {
    const { container } = render(
      <ResponseRow>
        outer
        <ResponseRow>inner</ResponseRow>
      </ResponseRow>
    );

    expect(container.querySelectorAll('.gutter')).toHaveLength(1);
  });
});
