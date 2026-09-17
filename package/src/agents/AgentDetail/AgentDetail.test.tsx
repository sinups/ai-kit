import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { AGENT_MODELS, AGENTS, TOOL_CATALOG } from '../fixtures';
import { AgentDetail } from './AgentDetail';

describe('AgentDetail', () => {
  it('shows the configuration and expands the tool list', async () => {
    render(<AgentDetail agent={AGENTS[0]} catalog={TOOL_CATALOG} models={AGENT_MODELS} />);

    expect(screen.getByRole('heading', { name: 'Code reviewer' })).toBeInTheDocument();
    expect(screen.getByText('code-reviewer')).toBeInTheDocument();
    expect(screen.getByText('Qwen 2.5 Coder 32B')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Sep 12, 2026')).toBeInTheDocument();
    expect(screen.getByText('6 tools from 2 groups')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Rules' })).toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Show' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('mcp__git__get_pull_request')).toBeInTheDocument();
  });

  it('calls the actions', async () => {
    const onUseInChat = jest.fn();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <AgentDetail
        agent={AGENTS[1]}
        onUseInChat={onUseInChat}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Use in chat' }));
    expect(onUseInChat).toHaveBeenCalledWith(AGENTS[1]);
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(AGENTS[1]);
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(AGENTS[1]);
  });

  it('hides edit and delete for read-only agents and lists disallowed tools', () => {
    render(
      <AgentDetail
        agent={AGENTS[3]}
        catalog={TOOL_CATALOG}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        labels={{ readOnly: 'Locked' }}
      />
    );

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('All tools')).toBeInTheDocument();
    expect(screen.getByText('Disallowed tools')).toBeInTheDocument();
  });
});
