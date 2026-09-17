import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { StatusPanel } from './StatusPanel';

describe('model-settings/StatusPanel', () => {
  it('summarizes the environment and counts MCP servers per status', () => {
    render(
      <StatusPanel
        version="2.1.0"
        model="Qwen 2.5 Coder 32B"
        account={{ email: 'dev@example.com', plan: 'Max' }}
        cwd="/home/dev/project"
        mcpServers={[
          { name: 'git', status: 'success' },
          { name: 'issues', status: 'success' },
          { name: 'errors', status: 'error' },
        ]}
        memoryFiles={[{ path: 'AGENTS.md', tokens: 1200 }]}
        context={{ used: 45_000, total: 200_000 }}
      />
    );

    expect(screen.getByText('2.1.0')).toBeInTheDocument();
    expect(screen.getByText('dev@example.com')).toBeInTheDocument();
    expect(screen.getByText('2 connected')).toBeInTheDocument();
    expect(screen.getByText('1 failed')).toBeInTheDocument();
    expect(screen.getByText('1.2k tokens')).toBeInTheDocument();
    expect(screen.getByText('45k / 200k tokens')).toBeInTheDocument();
  });

  it('runs actions and shows their errors', async () => {
    const onClick = jest.fn().mockRejectedValue(new Error('Doctor crashed'));
    render(<StatusPanel version="1" actions={[{ label: 'Run doctor', onClick }]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Run doctor' }));
    expect(onClick).toHaveBeenCalled();
    expect(await screen.findByText('Doctor crashed')).toBeInTheDocument();
  });
});
