import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { BashTool } from './BashTool';

describe('tools/BashTool', () => {
  it('renders the command and output when finished', () => {
    render(
      <BashTool
        part={{
          type: 'tool-Bash',
          toolCallId: 'b1',
          state: 'output-available',
          input: { command: 'ls -la | grep src' },
          output: { stdout: 'src/', exitCode: 0 },
        }}
      />
    );
    expect(screen.getByText('Ran command: ls, grep')).toBeInTheDocument();
    expect(screen.getByText('ls -la | grep src')).toBeInTheDocument();
    expect(screen.getByText('src/')).toBeInTheDocument();
  });

  it('shows the running label while pending and hides output', () => {
    render(
      <BashTool
        part={{
          type: 'tool-Bash',
          toolCallId: 'b2',
          state: 'input-available',
          input: { command: 'yarn build' },
        }}
      />
    );
    expect(screen.getByText('Running command: yarn')).toBeInTheDocument();
  });

  it('renders the approval footer when approval is provided', () => {
    render(
      <BashTool
        part={{
          type: 'tool-Bash',
          toolCallId: 'b3',
          state: 'input-available',
          input: { command: 'rm -rf dist', approval: { approveLabel: 'Run' } },
        }}
      />
    );
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
  });
});
