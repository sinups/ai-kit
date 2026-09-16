import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { EditTool } from './EditTool';

describe('tools/EditTool', () => {
  it('renders the file name and diff lines', () => {
    render(
      <EditTool
        part={{
          type: 'tool-Edit',
          toolCallId: 'e1',
          state: 'output-available',
          input: {
            file_path: '/project/src/greet.ts',
            old_string: 'const a = 1;\nconst b = 2;',
            new_string: 'const a = 1;\nconst b = 3;',
          },
          output: { success: true },
        }}
      />
    );
    expect(screen.getByText('Edited greet.ts')).toBeInTheDocument();
    expect(screen.getByText('const a = 1;')).toBeInTheDocument();
    const rows = Array.from(document.querySelectorAll('[data-type]'));
    const removed = rows.find((row) => row.textContent?.includes('const b = 2;'));
    const added = rows.find((row) => row.textContent?.includes('const b = 3;'));
    expect(removed).toHaveAttribute('data-type', 'remove');
    expect(added).toHaveAttribute('data-type', 'add');
  });

  it('uses "Created" for tool-Write and shows diff stats', () => {
    render(
      <EditTool
        part={{
          type: 'tool-Write',
          toolCallId: 'w1',
          state: 'output-available',
          input: { file_path: '/project/src/new.ts', content: 'a\nb' },
          output: { success: true },
        }}
      />
    );
    expect(screen.getByText('Created new.ts')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows Generating while streaming without content', () => {
    render(
      <EditTool
        part={{ type: 'tool-Edit', toolCallId: 'e2', state: 'input-streaming', input: {} }}
      />
    );
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  it('renders a Show more toggle when collapsible', () => {
    render(
      <EditTool
        isCollapsible
        part={{
          type: 'tool-Edit',
          toolCallId: 'e3',
          state: 'output-available',
          input: { file_path: '/project/src/x.ts', old_string: 'a', new_string: 'b' },
          output: { success: true },
        }}
      />
    );
    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
  });
});
