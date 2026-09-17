import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { within } from '@testing-library/react';
import {
  FILESYSTEM_SERVER,
  GIT_SERVER,
  ISSUES_SERVER,
  POSTGRES_SERVER,
  ERRORS_SERVER,
} from './fixtures';
import { McpServerDetail } from './McpServerDetail';
import { McpToolDetail } from './McpToolDetail';

describe('mcp/McpServerDetail', () => {
  it('lists tools with annotations and opens a tool', async () => {
    const onSelectTool = jest.fn();
    render(<McpServerDetail server={GIT_SERVER} onSelectTool={onSelectTool} />);

    expect(screen.getByRole('heading', { name: 'git' })).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Version 0.13.0')).toBeInTheDocument();
    expect(screen.getAllByText('read-only')).toHaveLength(2);
    expect(screen.getByText('destructive')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Merge pull request'));
    expect(onSelectTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'merge_pull_request' })
    );
  });

  it('does not claim a connected server has no tools before they load', () => {
    render(<McpServerDetail server={{ ...GIT_SERVER, tools: undefined, toolCount: 3 }} />);
    expect(screen.getByRole('tab', { name: /Tools/ })).toHaveTextContent('3');
    expect(screen.queryByText('No tools')).not.toBeInTheDocument();
  });

  it('shows resources and prompts with arguments', async () => {
    render(<McpServerDetail server={GIT_SERVER} />);

    await userEvent.click(screen.getByRole('tab', { name: /Resources/ }));
    expect(screen.getByText('README.md')).toBeInTheDocument();
    expect(screen.getByText('text/markdown')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Prompts/ }));
    expect(screen.getByText('review_pull_request')).toBeInTheDocument();
    expect(screen.getByText(/owner\*, repo\*, pullNumber\*, focus/)).toBeInTheDocument();
  });

  it('masks secrets in the configuration until revealed and edits the server', async () => {
    const onEdit = jest.fn();
    render(<McpServerDetail server={POSTGRES_SERVER} tab="configuration" onEdit={onEdit} />);

    expect(screen.getByText('uvx')).toBeInTheDocument();
    expect(screen.getByText('--access-mode=restricted')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.queryByText(/postgresql:\/\//)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show value: DATABASE_URI' }));
    expect(screen.getByText(/postgresql:\/\//)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(POSTGRES_SERVER);
  });

  it('shows the connection error and a pending reconnect', async () => {
    let resolve: () => void = () => {};
    const onReconnect = jest.fn(() => new Promise<void>((done) => (resolve = done)));
    render(
      <McpServerDetail server={ERRORS_SERVER} onReconnect={onReconnect} onDisable={jest.fn()} />
    );

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText(/502 Bad Gateway/)).toBeInTheDocument();
    expect(screen.getByText('Connect the server to load what it provides')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reconnect' }));
    expect(screen.getByRole('button', { name: 'Reconnect' })).toHaveAttribute(
      'data-loading',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Disable' })).toBeDisabled();
    resolve();
    expect(await screen.findByRole('button', { name: 'Disable' })).toBeEnabled();
  });

  it('asks for authentication and reports a rejected action', async () => {
    render(
      <McpServerDetail
        server={ISSUES_SERVER}
        onAuthenticate={() => Promise.reject(new Error('OAuth window was closed'))}
      />
    );

    expect(screen.getByText('Sign in to this server to use its tools')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Authenticate' }));
    expect(await screen.findByText('OAuth window was closed')).toBeInTheDocument();
  });

  it('removes the server after confirmation', async () => {
    const onRemove = jest.fn();
    render(<McpServerDetail server={POSTGRES_SERVER} tab="configuration" onRemove={onRemove} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove server' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onRemove).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Remove server' })).getByRole('button', {
        name: 'Remove',
      })
    );
    expect(onRemove).toHaveBeenCalledWith(POSTGRES_SERVER);
  });

  it('offers Enable for a disabled server', () => {
    render(
      <McpServerDetail server={POSTGRES_SERVER} onEnable={jest.fn()} onReconnect={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: 'Enable' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reconnect' })).not.toBeInTheDocument();
  });
});

describe('mcp/McpToolDetail', () => {
  it('renders annotations and schemas and calls back', async () => {
    const onBack = jest.fn();
    const onTry = jest.fn();
    const tool = FILESYSTEM_SERVER.tools![2];
    render(<McpToolDetail tool={tool} serverName="filesystem" onBack={onBack} onTry={onTry} />);

    expect(screen.getByRole('heading', { name: 'edit_file' })).toBeInTheDocument();
    expect(screen.getByText('destructive')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Input' })).toBeInTheDocument();
    expect(screen.getByText('dryRun')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Output' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try tool' }));
    expect(onTry).toHaveBeenCalledWith(tool);
    await userEvent.click(screen.getByRole('button', { name: 'Back: filesystem' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows the output schema and an empty input', () => {
    render(
      <McpToolDetail
        tool={{
          name: 'ping',
          outputSchema: { type: 'object', properties: { ok: { type: 'boolean' } } },
        }}
      />
    );
    expect(screen.getByText('This tool takes no arguments')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Output' })).toBeInTheDocument();
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
