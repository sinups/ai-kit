import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { DEFAULT_ERROR_MESSAGE_LABELS, ErrorMessage } from '../ErrorMessage/ErrorMessage';
import { BashTool, DEFAULT_BASH_TOOL_LABELS } from '../tools/BashTool';
import { DEFAULT_EDIT_TOOL_LABELS, EditTool } from '../tools/EditTool';
import { DEFAULT_MCP_TOOL_LABELS, McpTool } from '../tools/McpTool';
import { DEFAULT_TOOL_CARD_LABELS } from '../tools/tool-card-labels';
import {
  DEFAULT_TOOL_TITLE_LABELS,
  parseMcpToolType,
  resolveToolTitleLabels,
  toolRegistry,
} from '../tools/tool-registry';
import { TurnSummary } from '../TurnSummary/TurnSummary';
import type { ToolPart } from '../types';
import { ChatLabelsProvider } from './chat-labels';

const listPart: ToolPart = {
  type: 'tool-mcp__tracker__list_issues',
  toolCallId: 'call-1',
  state: 'output-available',
  input: { query: 'upload' },
  output: [{ type: 'text', text: '[]' }],
};
const mcpInfo = parseMcpToolType(listPart.type)!;

describe('labels/ChatLabelsProvider', () => {
  it('keeps the English defaults', () => {
    expect(DEFAULT_ERROR_MESSAGE_LABELS.title).toBe('Something went wrong');
    expect(DEFAULT_MCP_TOOL_LABELS.completedVerbs.List).toBe('Listed');
    expect(DEFAULT_MCP_TOOL_LABELS.preparing).toBe('Preparing {name}');
    render(<ErrorMessage message="Timeout" onRetry={() => {}} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('translates the error card, the turn summary and MCP rows from the provider', () => {
    render(
      <ChatLabelsProvider
        labels={{
          errorMessage: { title: 'Что-то пошло не так', retry: 'Повторить' },
          turnSummary: { worked: (duration) => `Заняло ${duration}` },
          mcpTool: { completedVerbs: { List: 'Получены' } },
        }}
      >
        <ErrorMessage message="Timeout" onRetry={() => {}} />
        <TurnSummary durationMs={3_000} />
        <McpTool part={listPart} mcpInfo={mcpInfo} />
      </ChatLabelsProvider>
    );
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
    expect(screen.getByText(/^Заняло/)).toBeInTheDocument();
    expect(screen.getByText(/^Получены/)).toBeInTheDocument();
  });

  it('lets the labels prop of a component win over the provider', () => {
    render(
      <ChatLabelsProvider labels={{ errorMessage: { retry: 'Повторить' } }}>
        <ErrorMessage message="Timeout" onRetry={() => {}} labels={{ retry: 'Ещё раз' }} />
      </ChatLabelsProvider>
    );
    expect(screen.getByRole('button', { name: 'Ещё раз' })).toBeInTheDocument();
  });
});

describe('tools/McpTool labels', () => {
  it('conjugates with the given verbs and keeps the defaults for the rest', () => {
    const { rerender } = render(
      <McpTool
        part={listPart}
        mcpInfo={mcpInfo}
        labels={{ completedVerbs: { List: 'Получены' } }}
      />
    );
    expect(screen.getByText(/^Получены/)).toBeInTheDocument();

    rerender(
      <McpTool
        part={{ ...listPart, type: 'tool-mcp__tracker__get_issue' }}
        mcpInfo={parseMcpToolType('tool-mcp__tracker__get_issue')!}
        labels={{ completedVerbs: { List: 'Получены' } }}
      />
    );
    expect(screen.getByText(/^Got/)).toBeInTheDocument();
  });

  it('labels the preparing and interrupted titles', () => {
    const { rerender } = render(
      <McpTool
        part={{ ...listPart, state: 'input-streaming', output: undefined }}
        mcpInfo={mcpInfo}
        labels={{ preparing: 'Готовим: {name}' }}
      />
    );
    expect(screen.getByText(/^Готовим:/)).toBeInTheDocument();

    rerender(
      <McpTool
        part={{ ...listPart, state: 'input-available', output: undefined }}
        mcpInfo={mcpInfo}
        chatStatus="ready"
        labels={{ interrupted: '{name}: прервано' }}
      />
    );
    expect(screen.getByText(/: прервано$/)).toBeInTheDocument();
  });
});

describe('tool card labels', () => {
  const bashPart: ToolPart = {
    type: 'tool-Bash',
    toolCallId: 'bash',
    state: 'output-available',
    input: { command: 'npm test' },
    output: 'ok',
  };
  const editPart: ToolPart = {
    type: 'tool-Edit',
    toolCallId: 'edit',
    state: 'output-available',
    input: { file_path: 'src/upload.ts', old_string: 'a', new_string: 'b' },
    output: 'ok',
  };

  it('keeps the English defaults', () => {
    expect(DEFAULT_BASH_TOOL_LABELS.ran).toBe('Ran command: {command}');
    expect(DEFAULT_EDIT_TOOL_LABELS.edited).toBe('Edited {file}');
    expect(DEFAULT_TOOL_CARD_LABELS.taskCompleted).toBe('Task completed');
    expect(DEFAULT_TOOL_TITLE_LABELS.read).toBe('Read');
    expect(toolRegistry['tool-Read']!.title({ state: 'output-available' })).toBe('Read');
    render(
      <>
        <BashTool part={bashPart} />
        <EditTool part={editPart} />
      </>
    );
    expect(screen.getByText('Ran command: npm')).toBeInTheDocument();
    expect(screen.getByText('Edited upload.ts')).toBeInTheDocument();
  });

  it('labels the Bash and Edit headers by prop and by provider', () => {
    render(
      <ChatLabelsProvider labels={{ editTool: { edited: 'Изменён {file}' } }}>
        <BashTool part={bashPart} labels={{ ran: 'Выполнена команда: {command}' }} />
        <EditTool part={editPart} />
      </ChatLabelsProvider>
    );
    expect(screen.getByText('Выполнена команда: npm')).toBeInTheDocument();
    expect(screen.getByText('Изменён upload.ts')).toBeInTheDocument();
  });

  it('builds registry titles from the given labels', () => {
    const labels = resolveToolTitleLabels({ grepped: 'Найдено в {count} файлах' });
    expect(
      toolRegistry['tool-Grep']!.title(
        { state: 'output-available', output: { numFiles: 3 } },
        labels
      )
    ).toBe('Найдено в 3 файлах');
    expect(toolRegistry['tool-Read']!.title({ state: 'output-available' }, labels)).toBe('Read');
  });
});
