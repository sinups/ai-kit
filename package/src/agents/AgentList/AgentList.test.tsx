import React from 'react';
import { within } from '@testing-library/react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { AGENT_MODELS, AGENTS } from '../fixtures';
import { AgentList } from './AgentList';

describe('agents/AgentList', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('groups agents by source and shows the model', () => {
    render(<AgentList agents={AGENTS} models={AGENT_MODELS} />);

    const groupLabels = screen
      .getAllByRole('group')
      .map(
        (group) => document.getElementById(group.getAttribute('aria-labelledby') ?? '')?.textContent
      );
    expect(groupLabels).toEqual(['Project', 'User', 'Plugin', 'Built-in']);
    const reviewer = screen.getByRole('option', { name: /Code reviewer/ });
    expect(within(reviewer).getByText('Qwen 2.5 Coder 32B')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Read-only' })).toHaveLength(2);
  });

  it('selects an agent and filters with search', async () => {
    const onSelect = jest.fn();
    render(<AgentList agents={AGENTS} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('Test runner'));
    expect(onSelect).toHaveBeenCalledWith(AGENTS[1]);

    await userEvent.type(screen.getByRole('textbox', { name: 'Search agents' }), 'docs');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText('Docs writer')).toBeInTheDocument();

    await userEvent.clear(screen.getByRole('textbox', { name: 'Search agents' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search agents' }), 'nothing-here');
    expect(screen.getByText('No agents match the search')).toBeInTheDocument();
  });

  it('filters agents by source', async () => {
    render(<AgentList agents={AGENTS} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Source' }));
    await userEvent.click(await screen.findByRole('option', { name: 'User (1)' }));
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: /Docs writer/ })).toBeInTheDocument();
  });

  it('hides search and source filter when turned off', () => {
    render(<AgentList agents={AGENTS} withSearch={false} withSourceFilter={false} />);

    expect(screen.queryByRole('textbox', { name: 'Search agents' })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Source' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(AGENTS.length);
  });

  it('hides the source filter when all agents share one source', () => {
    render(<AgentList agents={AGENTS.filter((agent) => agent.source === 'project')} />);

    expect(screen.queryByRole('combobox', { name: 'Source' })).not.toBeInTheDocument();
  });

  it('disables edit and delete for read-only agents', async () => {
    const onEdit = jest.fn();
    const onDuplicate = jest.fn();
    const onDelete = jest.fn();
    render(
      <AgentList agents={AGENTS} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
    );

    const builtin = screen.getByRole('option', { name: /General purpose/ });
    await userEvent.click(within(builtin).getByRole('button', { name: /^Agent actions/ }));
    expect(await screen.findByRole('menuitem', { name: 'Edit' })).toBeDisabled();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(onDuplicate).toHaveBeenCalledWith(AGENTS[4]);

    const reviewer = screen.getByRole('option', { name: /Code reviewer/ });
    await userEvent.click(within(reviewer).getByRole('button', { name: /^Agent actions/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(AGENTS[0]);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('renders loading, error and empty states', async () => {
    const onRetry = jest.fn();
    const onCreate = jest.fn();
    const { rerender } = render(<AgentList agents={[]} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();

    rerender(<AgentList agents={[]} error="Could not load agents" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<AgentList agents={[]} onCreate={onCreate} />);
    expect(screen.getByText('No agents yet')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'New agent' })[0]);
    expect(onCreate).toHaveBeenCalled();
  });
});
