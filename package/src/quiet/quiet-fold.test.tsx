import React from 'react';
import { MantineProvider } from '@mantine/core';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentChat } from '../AgentChat/AgentChat';
import type { AgentChatLabels } from '../AgentChat/agent-chat-labels';
import type { ToolApprovals } from '../approvals/tool-approvals';
import type { ChatMessage, ChatStatus, ToolPart } from '../types';
import { quietPresentation } from './quiet-presentation';

const catalog = {
  mcp__deepwiki__read_wiki_structure: { title: 'Посмотреть оглавление вики' },
  mcp__deepwiki__ask_question: { title: 'Спросить про репозиторий' },
  mcp__tracker__tracker_task_create: { title: 'Создать задачу' },
};

const labels: Partial<AgentChatLabels> = {
  mcpTool: { items: (count) => `${count} результатов`, failed: 'Ошибка' },
  thinkingTool: { thinking: 'Думаю', thought: (duration) => `Думал ${duration}`.trim() },
  durationUnits: { seconds: ' с' },
  messageList: {
    toolRuns: { thought: 'думал', otherTools: (count) => `использовал ${count} инструмента` },
  },
};

let counter = 0;

function thought(state: ToolPart['state'] = 'output-available'): ToolPart {
  counter += 1;
  return { type: 'tool-Thinking', toolCallId: `th-${counter}`, state, input: { thought: 'Думаю' } };
}

const toc: ToolPart = {
  type: 'tool-mcp__deepwiki__read_wiki_structure',
  toolCallId: 'toc',
  state: 'output-available',
  input: { repoName: 'mantinedev/mantine' },
  output: { result: '- 1 Overview\n- 2 Core' },
};

const ask: ToolPart = {
  type: 'tool-mcp__deepwiki__ask_question',
  toolCallId: 'ask',
  state: 'output-available',
  input: { repoName: 'mantinedev/mantine', question: 'Как устроен репозиторий?' },
  output: { result: 'Монорепозиторий на Yarn workspaces.' },
};

function Chat({
  parts,
  status = 'ready',
  approvals,
  workingRow = false,
}: {
  parts: ToolPart[];
  status?: ChatStatus;
  approvals?: ToolApprovals;
  workingRow?: boolean;
}) {
  const messages = [
    { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Как устроен mantine?' }] },
    { id: 'a1', role: 'assistant', parts },
  ] as ChatMessage[];
  return (
    <AgentChat
      messages={messages}
      status={status}
      onSend={() => {}}
      onStop={() => {}}
      slots={{ InputBar: () => null }}
      presentation={quietPresentation}
      toolCatalog={catalog}
      approvals={approvals}
      labels={labels}
      workingRow={workingRow}
    />
  );
}

function renderStable(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => <MantineProvider env="test">{children}</MantineProvider>,
  });
}

describe('quiet presentation, folded turn', () => {
  it('folds thinking and calls in any order into one line that opens into the steps', async () => {
    const first = thought();
    const second = thought();
    renderStable(<Chat parts={[toc, first, ask, second]} />);

    expect(screen.getByText('Думал · использовал 2 инструмента')).toBeInTheDocument();
    expect(screen.queryByText('Посмотреть оглавление вики')).toBeNull();

    await userEvent.click(screen.getByRole('button', { expanded: false }));
    const steps = screen
      .getAllByText(/Посмотреть оглавление вики|Спросить про репозиторий|Думал/)
      .map((node) => node.textContent);
    expect(steps.slice(1)).toEqual([
      'Посмотреть оглавление вики',
      'Думал',
      'Спросить про репозиторий',
      'Думал',
    ]);
  });

  it('keeps the line alive with the running step and adds the time once the turn is done', () => {
    jest.useFakeTimers();
    const first = thought();
    const running = { ...ask, state: 'input-available', output: undefined } as ToolPart;
    const { rerender } = renderStable(<Chat parts={[toc, first, running]} status="streaming" />);

    expect(screen.getByText('Спросить про репозиторий…')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(26_000);
    });
    rerender(<Chat parts={[toc, first, ask]} />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Думал · использовал 2 инструмента · 26 с')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('keeps the shape of the line from the first step to the last', async () => {
    const running = { ...toc, state: 'input-available', output: undefined } as ToolPart;
    const { rerender } = renderStable(<Chat parts={[running]} status="streaming" />);
    expect(screen.getByText('Посмотреть оглавление вики…')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-tool-run]')).toHaveLength(1);

    rerender(<Chat parts={[toc]} status="streaming" />);
    expect(document.querySelectorAll('[data-tool-run]')).toHaveLength(1);
    expect(await screen.findByText('Working...')).toBeInTheDocument();

    rerender(<Chat parts={[toc, thought('input-streaming')]} status="streaming" />);
    expect(document.querySelectorAll('[data-tool-run]')).toHaveLength(1);
    expect(await screen.findByText('Думаю')).toBeInTheDocument();

    rerender(<Chat parts={[toc, thought()]} />);
    expect(await screen.findByText(/^Думал · использовал 1 инструмента/)).toBeInTheDocument();
  });

  it('counts the whole turn, from the working row to the end of the last step', () => {
    jest.useFakeTimers();
    const answer = { type: 'text', text: 'Монорепозиторий.' } as unknown as ToolPart;
    const running = { ...toc, state: 'input-available', output: undefined } as ToolPart;
    const { rerender } = renderStable(<Chat parts={[]} status="streaming" workingRow />);

    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(screen.getByText(/^[23] с$/)).toBeInTheDocument();

    rerender(<Chat parts={[running]} status="streaming" workingRow />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/^[3-5] с$/)).toBeInTheDocument();
    expect(screen.queryByText('Working')).toBeNull();

    rerender(<Chat parts={[toc, ask, answer]} status="streaming" workingRow />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Использовал 2 инструмента · 4 с')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('shows the spiral while the turn works and drops it once the turn is done', async () => {
    const running = { ...toc, state: 'input-available', output: undefined } as ToolPart;
    const answer = { type: 'text', text: 'Монорепозиторий.' } as unknown as ToolPart;
    const { container, rerender } = renderStable(<Chat parts={[]} status="streaming" workingRow />);
    expect(container.querySelector('[data-working-row] [data-activity-loader]')).not.toBeNull();

    rerender(<Chat parts={[running]} status="streaming" workingRow />);
    expect(container.querySelector('[data-working-row]')).toBeNull();
    expect(container.querySelector('[data-tool-run] [data-activity-loader]')).not.toBeNull();

    rerender(<Chat parts={[toc, answer]} status="ready" workingRow />);
    expect(await screen.findByText(/^Использовал 1 инструмента/)).toBeInTheDocument();
    expect(container.querySelector('[data-activity-loader]')).toBeNull();
  });

  it('leaves the working row to the pause before the first step', () => {
    const { rerender } = renderStable(<Chat parts={[toc]} status="streaming" workingRow />);
    expect(screen.queryByText('Working')).toBeNull();

    rerender(
      <Chat
        parts={[
          {
            ...ask,
            toolCallId: 'broken',
            state: 'output-error',
            output: undefined,
            errorText: 'Репозиторий не найден',
          } as ToolPart,
        ]}
        status="streaming"
        workingRow
      />
    );
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('leaves a failed call and a call that waits for a decision outside the line', () => {
    const failed = {
      ...ask,
      toolCallId: 'failed',
      state: 'output-error',
      output: undefined,
      errorText: 'Репозиторий не найден',
    } as ToolPart;
    const create: ToolPart = {
      type: 'tool-mcp__tracker__tracker_task_create',
      toolCallId: 'create',
      state: 'input-available',
      input: { payload: JSON.stringify({ title: 'Проверить' }) },
    };

    const { container } = renderStable(
      <Chat
        parts={[toc, thought(), failed, toc && { ...toc, toolCallId: 'toc2' }, thought(), create]}
        status="streaming"
        approvals={{ create: { onApprove: () => {} } }}
      />
    );

    expect(screen.getByText('Ошибка · Репозиторий не найден')).toBeInTheDocument();
    expect(screen.getAllByText(/^Думал · использовал 1 инструмента/)).toHaveLength(2);
    expect(screen.getByText('Создать задачу')).toBeInTheDocument();
    expect(container.querySelector('[data-framed]')).not.toBeNull();
  });
});
