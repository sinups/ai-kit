import React from 'react';
import { render, screen } from '@mantine-tests/core';
import type { CustomToolRendererProps } from '../types';
import { ToolRenderer } from './ToolRenderer';

describe('tools/ToolRenderer', () => {
  it('renders tool-Bash as a terminal card', () => {
    render(
      <ToolRenderer
        part={{
          type: 'tool-Bash',
          toolCallId: 'b1',
          state: 'output-available',
          input: { command: 'yarn test' },
          output: { stdout: 'PASS', exitCode: 0 },
        }}
      />
    );
    expect(screen.getByText('Ran command: yarn')).toBeInTheDocument();
    expect(screen.getByText('yarn test')).toBeInTheDocument();
  });

  it('renders tool-Edit as a diff card', () => {
    render(
      <ToolRenderer
        part={{
          type: 'tool-Edit',
          toolCallId: 'e1',
          state: 'output-available',
          input: { file_path: '/project/src/a.ts', old_string: 'a', new_string: 'b' },
          output: { success: true },
        }}
      />
    );
    expect(screen.getByText('Edited a.ts')).toBeInTheDocument();
  });

  it('renders registry tools through GenericTool', () => {
    render(
      <ToolRenderer
        part={{
          type: 'tool-Read',
          toolCallId: 'r1',
          state: 'output-available',
          input: { file_path: '/project/src/index.ts' },
          output: 'content',
        }}
      />
    );
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('index.ts')).toBeInTheDocument();
  });

  it('renders MCP tools with conjugated titles', () => {
    render(
      <ToolRenderer
        part={{
          type: 'tool-mcp__github__list_issues',
          toolCallId: 'm1',
          state: 'output-available',
          input: { repo: 'x/y' },
          output: '[]',
        }}
      />
    );
    expect(screen.getByText('Listed Issues')).toBeInTheDocument();
  });

  it('uses a custom renderer for user-tools', () => {
    function Custom({ name, status }: CustomToolRendererProps) {
      return <div>{`custom:${name}:${status}`}</div>;
    }
    render(
      <ToolRenderer
        part={{
          type: 'tool-mcp__user-tools__weather',
          toolCallId: 'w1',
          state: 'output-available',
          input: {},
          output: '{}',
        }}
        toolRenderers={{ weather: Custom }}
      />
    );
    expect(screen.getByText('custom:weather:success')).toBeInTheDocument();
  });

  it('falls back to the tool name for unknown tools', () => {
    render(
      <ToolRenderer
        part={{ type: 'tool-Custom', toolCallId: 'c1', state: 'input-available' }}
        chatStatus="streaming"
      />
    );
    expect(screen.getByText('Running Custom')).toBeInTheDocument();
  });

  it('dispatches dynamic-tool parts by toolName', () => {
    render(
      <ToolRenderer
        chatStatus="ready"
        part={{
          type: 'dynamic-tool',
          toolName: 'mcp__linear__list_issues',
          toolCallId: 'd1',
          state: 'output-available',
          input: { query: 'bugs' },
          output: '[]',
        }}
      />
    );
    expect(screen.getByText('Listed Issues')).toBeInTheDocument();
  });

  it('does not show a finished tool with output-error as running', () => {
    render(
      <ToolRenderer
        chatStatus="streaming"
        part={{
          type: 'tool-Bash',
          toolCallId: 'b2',
          state: 'output-error',
          input: { command: 'yarn test' },
          errorText: 'failed',
        }}
      />
    );
    expect(screen.getByText('Ran command: yarn')).toBeInTheDocument();
    expect(screen.queryByText('Running command: yarn')).toBeNull();
  });

  it('shows the registry label for finished Grep searches', () => {
    render(
      <ToolRenderer
        part={{
          type: 'tool-Grep',
          toolCallId: 'g1',
          state: 'output-available',
          input: { pattern: 'ToolRowBase' },
          output: { numFiles: 4 },
        }}
      />
    );
    expect(screen.getByText('Grepped 4 files')).toBeInTheDocument();
    expect(screen.queryByText('Found 0 results')).toBeNull();
  });

  it('renders nothing for a finished TodoWrite with an empty list', () => {
    const { container } = render(
      <ToolRenderer
        part={{
          type: 'tool-TodoWrite',
          toolCallId: 't1',
          state: 'output-available',
          input: { todos: [] },
        }}
      />
    );
    expect(container.textContent).not.toContain('Updating to-dos');
  });
});
