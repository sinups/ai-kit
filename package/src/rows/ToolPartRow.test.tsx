import React from 'react';
import { render, screen } from '@mantine-tests/core';
import type { ToolPart } from '../types';
import { createToolCallLookups } from '../tools/tool-call-state';
import { ToolApprovalsProvider } from '../approvals/tool-approvals';
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
