import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { AgentChat } from '../AgentChat/AgentChat';
import type { AgentChatLabels } from '../AgentChat/agent-chat-labels';
import type { ToolApprovals } from '../approvals/tool-approvals';
import type { ChatMessage, ChatStatus, ToolPart } from '../types';
import { quietPresentation } from './quiet-presentation';

const catalog = {
  mcp__tracker__tracker_task_list_smart: {
    title: 'Найти задачи по условиям',
    outputSchema: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        required: ['key', 'title'],
        properties: { key: { type: 'string' as const }, title: { type: 'string' as const } },
      },
    },
  },
  mcp__tracker__tracker_task_create: { title: 'Создать задачу' },
  mcp__deepwiki__read_wiki_structure: { title: 'Структура вики' },
};

const labels: Partial<AgentChatLabels> = {
  mcpTool: {
    items: (count) => `${count} пунктов`,
    empty: 'Ничего не найдено',
    more: (count) => `ещё ${count}`,
    failed: 'Ошибка',
    arguments: 'Аргументы',
    result: 'Результат',
  },
  toolCall: { rejected: 'Отклонено', queued: 'В очереди' },
  toolApproval: { approved: 'Разрешено', scopes: { once: 'один раз' } },
  messageList: { toolRuns: { otherTools: (count) => `использовал ${count} инструмента` } },
};

function page(count: number) {
  return {
    content: [{ type: 'text', text: `${count} задач` }],
    structuredContent: Array.from({ length: count }, (_, index) => ({
      key: `TRK-${index + 1}`,
      title: `Задача ${index + 1}`,
    })),
  };
}

const tasks: ToolPart = {
  type: 'tool-mcp__tracker__tracker_task_list_smart',
  toolCallId: 't1',
  state: 'output-available',
  input: { assigneeIds: ['alice'], size: 100 },
  output: page(5),
};

function chat(
  parts: ToolPart[],
  { status = 'ready', approvals }: { status?: ChatStatus; approvals?: ToolApprovals } = {}
) {
  const messages = [
    { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Какие у меня задачи?' }] },
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
      workingRow={false}
    />
  );
}

describe('quiet presentation', () => {
  it('leaves one quiet line with the title and the outcome, the rest behind the chevron', async () => {
    const { container } = render(chat([tasks]));

    expect(screen.getByText('Использовал 1 инструмента')).toBeInTheDocument();
    expect(container.querySelector('[data-framed]')).toBeNull();

    await userEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('Найти задачи по условиям')).toBeInTheDocument();
    expect(screen.getByText('5 пунктов')).toBeInTheDocument();
    expect(screen.queryByText(/assigneeIds/)).toBeNull();

    await userEvent.click(screen.getByText('Найти задачи по условиям').closest('button')!);
    expect(screen.getByText('Аргументы')).toBeInTheDocument();
    expect(screen.getByText(/"TRK-1"/)).toBeInTheDocument();
  });

  it('keeps a running call on the same line, shimmering, without a frame', () => {
    const { container } = render(
      chat([{ ...tasks, state: 'input-available', output: undefined }], { status: 'streaming' })
    );

    expect(screen.getByText('Найти задачи по условиям…')).toBeInTheDocument();
    expect(container.querySelector('.shimmer')).not.toBeNull();
    expect(container.querySelector('[data-framed]')).toBeNull();
  });

  it('frames a call only while it waits for a decision', () => {
    const create: ToolPart = {
      type: 'tool-mcp__tracker__tracker_task_create',
      toolCallId: 'c1',
      state: 'input-available',
      input: { payload: JSON.stringify({ title: 'Проверить отчёт' }) },
    };

    const { container, rerender } = render(
      chat([create], { status: 'streaming', approvals: { c1: { onApprove: () => {} } } })
    );
    expect(container.querySelector('[data-framed]')).not.toBeNull();

    rerender(
      chat([{ ...create, state: 'output-available', output: 'Создана задача TRK-9' }], {
        approvals: {
          c1: { onApprove: () => {}, outcome: { decision: 'approved', scope: 'once' } },
        },
      })
    );
    expect(container.querySelector('[data-framed]')).toBeNull();
    expect(screen.getByText('Использовал 1 инструмента')).toBeInTheDocument();
    expect(screen.queryByText('Разрешено · один раз')).toBeNull();

    rerender(
      chat(
        [
          {
            ...create,
            state: 'output-error',
            errorText: 'The user rejected this tool call.',
          },
        ],
        { approvals: { c1: { onApprove: () => {}, outcome: { decision: 'rejected' } } } }
      )
    );
    expect(screen.getByText('Отклонено')).toBeInTheDocument();
    expect(screen.queryByText('The user rejected this tool call.')).toBeNull();
  });

  it('shows a call that waits for a decision as waiting, not queued behind a running one', () => {
    render(
      chat(
        [
          { ...tasks, state: 'input-available', output: undefined },
          {
            type: 'tool-mcp__tracker__tracker_task_create',
            toolCallId: 'c2',
            state: 'input-available',
            input: { payload: JSON.stringify({ title: 'Проверить отчёт' }) },
          },
        ],
        { status: 'streaming', approvals: { c2: { onApprove: () => {} } } }
      )
    );

    expect(screen.getByText('Создать задачу')).toBeInTheDocument();
    expect(screen.queryByText('В очереди')).toBeNull();
  });

  it('folds finished calls in a row into one line that opens into them', async () => {
    render(
      chat([
        tasks,
        { ...tasks, toolCallId: 't2', output: page(2) },
        { ...tasks, toolCallId: 't3', output: page(3) },
      ])
    );

    expect(screen.getByText('Использовал 3 инструмента')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getAllByText('Найти задачи по условиям')).toHaveLength(3);
  });

  it('shows no summary for a result of text alone and keeps the text for the opened row', async () => {
    const wiki: ToolPart = {
      type: 'tool-mcp__deepwiki__read_wiki_structure',
      toolCallId: 'w1',
      state: 'output-available',
      input: { repoName: 'mantinedev/mantine' },
      output: [
        {
          type: 'text',
          text: ['Available pages for mantinedev/mantine:', '', '- 1 Overview'].join('\n'),
        },
      ],
    };

    render(chat([wiki]));
    await userEvent.click(screen.getByText('Использовал 1 инструмента').closest('button')!);
    expect(screen.queryByText(/Available pages/)).toBeNull();
    await userEvent.click(screen.getByText('Структура вики').closest('button')!);
    expect(screen.getByText(/Available pages/)).toBeInTheDocument();
  });

  it('says a failed call failed and why, in one line', () => {
    render(
      chat([
        {
          ...tasks,
          state: 'output-error',
          output: undefined,
          errorText: 'Проект доступен только для чтения\nтребуется роль редактора',
        },
      ])
    );

    expect(screen.getByText('Ошибка · Проект доступен только для чтения')).toBeInTheDocument();
  });

  it('reads the reason of an MCP error from the first line of its text', () => {
    render(
      chat([
        {
          ...tasks,
          output: {
            content: [{ type: 'text', text: 'Rate limit reached\nretry in 30 seconds' }],
            isError: true,
          },
        },
      ])
    );

    expect(screen.getByText('Ошибка · Rate limit reached')).toBeInTheDocument();
  });
});
