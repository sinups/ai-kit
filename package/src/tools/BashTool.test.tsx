import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
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

  it('shows the whole command on one line with commandSummary full', () => {
    render(
      <BashTool
        part={{
          type: 'tool-Bash',
          toolCallId: 'b8',
          state: 'input-available',
          input: { command: 'yarn build\n  --filter web | tee log' },
        }}
        commandSummary="full"
      />
    );
    expect(
      screen.getByText('Running command: yarn build --filter web | tee log')
    ).toBeInTheDocument();
  });

  it('keeps the decided approval footer under a finished command by default', () => {
    render(
      <BashTool
        part={{
          type: 'tool-Bash',
          toolCallId: 'b9',
          state: 'output-available',
          input: { command: 'rm -rf dist', approval: { approveLabel: 'Run' } },
          output: { stdout: '', exitCode: 0 },
        }}
      />
    );
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
  });

  it('removes the approval footer once the approved command finishes with hideWhenComplete', async () => {
    const approval = {
      approveLabel: 'Run',
      reason: 'Deletes the build output',
      hideWhenComplete: true,
    };
    const input = { command: 'rm -rf dist', approval };
    const { rerender } = render(
      <BashTool part={{ type: 'tool-Bash', toolCallId: 'b4', state: 'input-available', input }} />
    );
    expect(screen.getByText('Deletes the build output')).toBeInTheDocument();
    expect(screen.queryByText('Starting')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(screen.getByText('Starting')).toBeInTheDocument();

    rerender(
      <BashTool
        part={{
          type: 'tool-Bash',
          toolCallId: 'b4',
          state: 'output-available',
          input,
          output: { stdout: '', exitCode: 0 },
        }}
      />
    );
    expect(screen.getByText('Ran command: rm')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Waiting|Starting/)).not.toBeInTheDocument();
  });

  it('streams the output tail while running and shows the exit code when done', () => {
    const tail = Array.from({ length: 20 }, (_, index) => `step ${index + 1}`).join('\n');
    render(
      <BashTool
        part={{
          type: 'tool-Bash',
          toolCallId: 'b5',
          state: 'input-available',
          input: { command: 'yarn build', timeout: 60000 },
          output: { outputTail: tail },
        }}
        showOutputMeta
        formatOutput
      />
    );
    expect(screen.getByText('step 20')).toBeInTheDocument();
    expect(screen.getByText('+12 more lines')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('timeout 1m')).toBeInTheDocument();
  });

  it('shows exit code and duration of a finished command', () => {
    render(
      <BashTool
        part={{
          type: 'tool-Bash',
          toolCallId: 'b6',
          state: 'output-available',
          input: { command: 'yarn test' },
          output: { stdout: 'FAIL src/a.test.ts', exitCode: 1, durationMs: 4500 },
        }}
        showOutputMeta
      />
    );
    expect(screen.getByText('exit 1')).toBeInTheDocument();
    expect(screen.getByText('4s')).toBeInTheDocument();
    expect(screen.queryByText('Running')).not.toBeInTheDocument();
  });

  it('hides the streamed output by default until the command finishes', () => {
    const tail = Array.from({ length: 12 }, (_, index) => `step ${index + 1}`).join('\n');
    const { rerender } = render(
      <BashTool
        part={{
          type: 'tool-Bash',
          toolCallId: 'b7',
          state: 'input-available',
          input: { command: 'yarn build' },
          output: { outputTail: tail },
        }}
      />
    );
    expect(screen.queryByText(/step 12/)).not.toBeInTheDocument();

    rerender(
      <BashTool
        part={{
          type: 'tool-Bash',
          toolCallId: 'b7',
          state: 'output-available',
          input: { command: 'yarn build' },
          output: { stdout: 'Built in 2.1s', exitCode: 0 },
        }}
      />
    );
    expect(screen.getByText('Built in 2.1s')).toBeInTheDocument();
    expect(screen.queryByText('exit 0')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy output' })).not.toBeInTheDocument();
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
