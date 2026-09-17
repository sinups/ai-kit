import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor, within } from '@testing-library/react';
import { MCP_SERVERS } from './fixtures';
import { McpServerList } from './McpServerList';

describe('McpServerList', () => {
  it('renders servers grouped by scope with status and tool counts', () => {
    render(<McpServerList servers={MCP_SERVERS} />);

    expect(screen.getByRole('group', { name: 'Project' })).toHaveTextContent('filesystem');
    expect(screen.getByRole('group', { name: 'User' })).toHaveTextContent('git');
    expect(screen.getByRole('group', { name: 'Local' })).toHaveTextContent('postgres');
    expect(screen.getByText('Needs auth')).toBeInTheDocument();
    expect(screen.getAllByText('4 tools')).toHaveLength(2);
    expect(screen.getByText('16 tools')).toBeInTheDocument();
    expect(screen.getByText(/502 Bad Gateway/)).toBeInTheDocument();
  });

  it('searches by name and command', async () => {
    render(<McpServerList servers={MCP_SERVERS} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Search servers' }), 'uvx');
    expect(screen.getByText('postgres')).toBeInTheDocument();
    expect(screen.queryByText('git')).not.toBeInTheDocument();

    await userEvent.clear(screen.getByRole('textbox', { name: 'Search servers' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search servers' }), 'nothing');
    expect(screen.getByText('No servers match')).toBeInTheDocument();
  });

  it('hides search and filter when turned off', () => {
    render(<McpServerList servers={MCP_SERVERS} withSearch={false} withFilter={false} />);

    expect(screen.queryByRole('textbox', { name: 'Search servers' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Filter servers')).not.toBeInTheDocument();
    expect(screen.getByText('postgres')).toBeInTheDocument();
  });

  it('selects a server and adds a new one', async () => {
    const onSelect = jest.fn();
    const onAdd = jest.fn();
    render(<McpServerList servers={MCP_SERVERS} onSelect={onSelect} onAdd={onAdd} />);

    await userEvent.click(screen.getByText('issues'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'issues' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add server' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('offers actions that match the server status', async () => {
    const onAuthenticate = jest.fn();
    const onEnable = jest.fn();
    render(
      <McpServerList
        servers={MCP_SERVERS}
        onAuthenticate={onAuthenticate}
        onEnable={onEnable}
        onDisable={jest.fn()}
        onReconnect={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Server actions: issues' }));
    expect(await screen.findByRole('menuitem', { name: 'Reconnect' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Disable' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Authenticate' }));
    expect(onAuthenticate).toHaveBeenCalledWith(expect.objectContaining({ id: 'issues' }));

    await userEvent.click(screen.getByRole('button', { name: 'Server actions: postgres' }));
    expect(await screen.findByRole('menuitem', { name: 'Enable' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Reconnect' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Enable' }));
    expect(onEnable).toHaveBeenCalledWith(expect.objectContaining({ id: 'postgres' }));
  });

  it('shows a rejected action in an alert', async () => {
    render(
      <McpServerList
        servers={MCP_SERVERS}
        onDisable={() => Promise.reject(new Error('Server is locked by policy'))}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Server actions: git' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Disable' }));
    expect(await screen.findByText('Server is locked by policy')).toBeInTheDocument();
  });

  it('confirms removal in a dialog', async () => {
    const onRemove = jest
      .fn()
      .mockRejectedValueOnce(new Error('Project servers live in .mcp.json'))
      .mockResolvedValueOnce(undefined);
    render(<McpServerList servers={MCP_SERVERS} onRemove={onRemove} />);

    await userEvent.click(screen.getByRole('button', { name: 'Server actions: git' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove server' });
    expect(dialog).toHaveTextContent('git and its tools will no longer be available');
    expect(onRemove).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
    expect(
      await within(dialog).findByText('Project servers live in .mcp.json')
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onRemove).toHaveBeenCalledTimes(2);
    expect(onRemove).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'git' }));
  });

  it('renders loading, error and empty states', async () => {
    const onRetry = jest.fn();
    const { rerender, container } = render(<McpServerList servers={[]} loading />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();

    rerender(<McpServerList servers={[]} error="Cannot read config" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<McpServerList servers={[]} onAdd={() => {}} />);
    expect(screen.getByText('No MCP servers')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add server' })).toBeInTheDocument();
  });
});
