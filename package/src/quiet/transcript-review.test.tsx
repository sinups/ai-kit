import React, { memo } from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { ToolApprovalsProvider, type ToolApprovals } from '../approvals/tool-approvals';
import { MessageList } from '../MessageList/MessageList';
import { WorkingLine } from '../MessageList/WorkingLine';
import { rowsPresentation } from '../rows/rows-presentation';
import { ToolPartRow } from '../rows/ToolPartRow';
import { ThinkingTool } from '../tools/ThinkingTool';
import {
  ToolPresentationProvider,
  useFirstSeen,
  useToolPresentation,
} from '../tools/tool-presentation';
import type { ChatMessage, ToolPart } from '../types';
import { quietPresentation } from './quiet-presentation';
import { QuietToolRow } from './QuietToolRow';

function render(ui: React.ReactElement) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <MantineProvider env="test">{children}</MantineProvider>,
  });
}

const ask = { id: 'u1', role: 'user' as const, parts: [{ type: 'text', text: 'go' }] };

function turn(...parts: ToolPart[]): ChatMessage[] {
  return [ask, { id: 'a1', role: 'assistant', parts }];
}

const deleting: ToolPart = {
  type: 'tool-mcp__tracker__issue_delete',
  toolCallId: 'A',
  state: 'input-available',
  input: { id: 1 },
};
const listed: ToolPart = {
  type: 'tool-mcp__tracker__issue_list',
  toolCallId: 'B',
  state: 'output-available',
  input: { q: 'x' },
  output: [1, 2],
};
const listing: ToolPart = { ...listed, state: 'input-available', output: undefined };
const open: ToolApprovals = { A: { onApprove: () => {}, onReject: () => {} } };

describe('quiet and rows transcript review', () => {
  it('keeps a call that waits for the host outside the folded line, wherever it stands', () => {
    render(
      <ToolApprovalsProvider approvals={open}>
        <MessageList
          messages={turn(deleting, listed)}
          status="streaming"
          presentation={quietPresentation}
        />
      </ToolApprovalsProvider>
    );
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
  });

  it('does not count a call that waits for the host as running', () => {
    const { container } = render(
      <ToolApprovalsProvider approvals={open}>
        <MessageList
          messages={turn(listed, deleting)}
          status="streaming"
          presentation={quietPresentation}
        />
      </ToolApprovalsProvider>
    );
    expect(container.querySelector('[data-tool-run] [data-activity-loader]')).toBeNull();
  });

  it.each([
    ['quiet', quietPresentation],
    ['rows', rowsPresentation],
  ])('shows a call left without a result after Stop as interrupted in %s', (_, presentation) => {
    const { container } = render(
      <MessageList messages={turn(listing)} status="ready" presentation={presentation} />
    );
    expect(container.querySelector('[data-activity-loader]')).toBeNull();
    expect(screen.queryByText('Running…')).toBeNull();
    expect(screen.getByText('Interrupted')).toBeInTheDocument();
  });

  it('keeps a call of an earlier turn from running forever while a new one streams', () => {
    const messages: ChatMessage[] = [
      ...turn(listing),
      { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'again' }] },
      { id: 'a2', role: 'assistant', parts: [{ type: 'text', text: 'On it' }] },
    ];
    render(<MessageList messages={messages} status="streaming" presentation={rowsPresentation} />);
    expect(screen.queryByText('Running…')).toBeNull();
    expect(screen.getByText('Interrupted')).toBeInTheDocument();
  });

  it('shows a row that waits for permission without the running line', () => {
    render(
      <ToolApprovalsProvider approvals={open}>
        <ToolPartRow part={deleting} chatStatus="streaming" showActivity />
      </ToolApprovalsProvider>
    );
    expect(screen.queryByText('Running…')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('treats a call the host refused as skipped before the result arrives', () => {
    const { container } = render(
      <ToolApprovalsProvider approvals={{ A: { outcome: { decision: 'rejected' } } }}>
        <QuietToolRow part={deleting} chatStatus="streaming" />
      </ToolApprovalsProvider>
    );
    expect(container.querySelector('[data-state]')).toHaveAttribute('data-state', 'rejected');
  });

  it('reads the reason of a failure from its message, never as [object Object]', () => {
    const failed = (output: unknown): ToolPart => ({ ...listed, output });
    const { rerender } = render(
      <QuietToolRow part={failed({ success: false, error: { code: 1 } })} chatStatus="ready" />
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText(/object Object/)).toBeNull();

    rerender(
      <QuietToolRow
        part={failed({ success: false, error: { message: 'Quota exceeded' } })}
        chatStatus="ready"
      />
    );
    expect(screen.getByText('Error · Quota exceeded')).toBeInTheDocument();
  });

  it('clips a huge result and never loads the images of a text result', () => {
    const huge: ToolPart = {
      ...listed,
      output: `![pixel](https://tracker.example/pixel.png)\n${'x'.repeat(10_000)}`,
    };
    const { container } = render(<QuietToolRow part={huge} chatStatus="ready" />);
    fireEvent.click(screen.getByRole('button', { name: /issue list/i }));
    expect(container.querySelector('img')).toBeNull();
    const text = container.querySelector('.details')?.textContent ?? '';
    expect(text.length).toBeLessThan(3_300);
    expect(text).toContain('x…');
  });

  it('keeps the time of a live line out of the announcements', () => {
    const { container } = render(<WorkingLine label="Working" since={Date.now() - 5_000} />);
    const live = container.querySelector('[aria-live]')!;
    expect(live).toHaveTextContent('Working');
    const time = Array.from(live.querySelectorAll('[aria-hidden]')).map((node) => node.textContent);
    expect(time.join('')).toMatch(/5s/);
  });

  it('keeps the provider value while its props stay the same', () => {
    const renders = jest.fn();
    const Probe = memo(function Probe() {
      useToolPresentation();
      renders();
      return null;
    });
    const catalog = {};
    const { rerender } = render(
      <ToolPresentationProvider catalog={catalog}>
        <Probe />
      </ToolPresentationProvider>
    );
    rerender(
      <ToolPresentationProvider catalog={catalog}>
        <Probe />
      </ToolPresentationProvider>
    );
    expect(renders).toHaveBeenCalledTimes(1);
  });

  it('times a thinking step from the moment it was first seen, per transcript', () => {
    const now = jest.spyOn(Date, 'now');
    const seen: number[] = [];
    function Seen() {
      seen.push(useFirstSeen()('think'));
      return null;
    }
    const thinking: ToolPart = {
      type: 'tool-Thinking',
      toolCallId: 'think',
      state: 'output-available',
      input: { thought: 'Plan' },
    };
    now.mockReturnValue(1_000);
    const { rerender } = render(
      <ToolPresentationProvider>
        <Seen />
      </ToolPresentationProvider>
    );
    now.mockReturnValue(5_000);
    rerender(
      <ToolPresentationProvider>
        <Seen />
        <ThinkingTool part={thinking} />
      </ToolPresentationProvider>
    );
    expect(screen.getByText(/4s/)).toBeInTheDocument();

    render(
      <ToolPresentationProvider>
        <Seen />
      </ToolPresentationProvider>
    );
    expect(seen.at(-1)).toBe(5_000);
    now.mockRestore();
  });
});

describe('quiet folds of one turn', () => {
  it('times only the first fold of a turn from its start', () => {
    const entries = [
      { part: listed, index: 0 },
      { part: { type: 'text', text: 'Now the second step' }, index: 1 },
      { part: { ...listed, toolCallId: 'C' }, index: 2 },
    ];
    const nodes = quietPresentation.renderParts(entries, () => null, {
      messageId: 'a1',
      chatStatus: 'ready',
      showActivity: false,
      turnStartedAt: 42,
    }) as React.ReactElement<{ turnStartedAt?: number }>[];
    const runs = nodes.filter((node) => node && 'turnStartedAt' in node.props);
    expect(runs.map((node) => node.props.turnStartedAt)).toEqual([42, undefined]);
  });
});
