import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor, within } from '@testing-library/react';
import { CONFIG_WARNINGS, DISCOVERED_SERVERS, IMPORT_CANDIDATES } from './discovery-fixtures';
import { McpConfigWarnings } from './McpConfigWarnings';
import { McpDiscoveredServers } from './McpDiscoveredServers';
import { McpImportDialog } from './McpImportDialog';

describe('McpDiscoveredServers', () => {
  it('approves the selected servers', async () => {
    const onApprove = jest.fn();
    render(<McpDiscoveredServers servers={DISCOVERED_SERVERS} onApprove={onApprove} />);

    expect(screen.getByText('Found 3 new MCP servers in this project')).toBeInTheDocument();
    expect(screen.getByText('npx -y @playwright/mcp@latest')).toBeInTheDocument();
    expect(screen.getByText('packages/api/.mcp.json')).toBeInTheDocument();
    expect(screen.getByText('3 selected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'errors' }));
    await userEvent.click(screen.getByText('analytics-db'));
    expect(screen.getByRole('checkbox', { name: 'Select all' })).toHaveAttribute(
      'data-indeterminate',
      'true'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Approve selected' }));
    expect(onApprove).toHaveBeenCalledWith([DISCOVERED_SERVERS[0]]);
  });

  it('selects servers that arrive after the first render', async () => {
    const onApprove = jest.fn();
    const { rerender } = render(
      <McpDiscoveredServers servers={DISCOVERED_SERVERS.slice(0, 2)} onApprove={onApprove} />
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'errors' }));

    rerender(
      <>
        <McpDiscoveredServers servers={DISCOVERED_SERVERS} onApprove={onApprove} />
      </>
    );
    expect(screen.getByRole('checkbox', { name: 'analytics-db' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Approve selected' }));
    expect(onApprove).toHaveBeenCalledWith([DISCOVERED_SERVERS[0], DISCOVERED_SERVERS[2]]);
  });

  it('disables approve without a selection and rejects every listed server', async () => {
    const onReject = jest.fn();
    render(
      <McpDiscoveredServers
        servers={DISCOVERED_SERVERS}
        onApprove={jest.fn()}
        onReject={onReject}
      />
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(screen.getByRole('button', { name: 'Approve selected' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(onReject).toHaveBeenCalledWith(DISCOVERED_SERVERS);
  });

  it('shows a pending approve and a rejected action', async () => {
    let fail: (error: Error) => void = () => {};
    render(
      <McpDiscoveredServers
        servers={DISCOVERED_SERVERS}
        onApprove={() => new Promise<void>((_, reject) => (fail = reject))}
        onReject={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Approve selected' }));
    expect(screen.getByRole('button', { name: 'Approve selected' })).toHaveAttribute(
      'data-loading',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'errors' })).toBeDisabled();
    fail(new Error('.mcp.json is read-only'));
    expect(await screen.findByText('.mcp.json is read-only')).toBeInTheDocument();
  });

  it('renders nothing without servers', () => {
    const { container } = render(<McpDiscoveredServers servers={[]} onApprove={jest.fn()} />);
    expect(container.querySelector('.mantine-Paper-root')).toBeNull();
  });
});

describe('McpImportDialog', () => {
  it('renames colliding servers and imports the selection with final names', async () => {
    const onImport = jest.fn(() => Promise.resolve());
    const onClose = jest.fn();
    render(
      <McpImportDialog
        opened
        onClose={onClose}
        sourceLabel="Desktop client"
        servers={IMPORT_CANDIDATES}
        existingNames={['git', 'memory']}
        onImport={onImport}
      />
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Import MCP servers from Desktop client',
    });
    expect(within(dialog).getByRole('textbox', { name: 'Server name: git' })).toHaveValue('git_1');
    expect(within(dialog).getAllByText('Renamed')).toHaveLength(2);

    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'notion' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Import 3' }));

    expect(onImport).toHaveBeenCalledWith([
      { ...IMPORT_CANDIDATES[0], name: 'git_1' },
      IMPORT_CANDIDATES[1],
      { ...IMPORT_CANDIDATES[3], name: 'memory_1' },
    ]);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('validates edited names and keeps the dialog open on failure', async () => {
    const onClose = jest.fn();
    render(
      <McpImportDialog
        opened
        onClose={onClose}
        sourceLabel="Desktop client"
        servers={IMPORT_CANDIDATES}
        existingNames={['git']}
        onImport={() => Promise.reject(new Error('Settings file is locked'))}
      />
    );

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByRole('textbox', { name: 'Server name: filesystem' });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'git');
    expect(within(dialog).getByText('A server with this name already exists')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Import 4' })).toBeDisabled();

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'memory');
    expect(within(dialog).getByText('Another imported server uses this name')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'memory' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Import 3' }));
    expect(await within(dialog).findByText('Settings file is locked')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('McpConfigWarnings', () => {
  it('groups warnings by file and opens a file', async () => {
    const onOpenFile = jest.fn();
    render(
      <McpConfigWarnings
        warnings={[...CONFIG_WARNINGS, CONFIG_WARNINGS[0]]}
        onOpenFile={onOpenFile}
      />
    );

    expect(screen.getByText('3 configuration warnings')).toBeInTheDocument();
    const project = screen.getByRole('region', { name: '.mcp.json' });
    expect(within(project).getByText('Duplicate name')).toBeInTheDocument();
    expect(within(project).getByText('mcpServers.errors.timeoutMs')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: '~/.agent/config.json' })).getByText(
        'Invalid value'
      )
    ).toBeInTheDocument();

    await userEvent.click(within(project).getByRole('button', { name: 'Open file' }));
    expect(onOpenFile).toHaveBeenCalledWith('.mcp.json');
  });

  it('renders nothing without warnings', () => {
    render(<McpConfigWarnings warnings={[]} />);
    expect(screen.queryByText(/configuration warnings/)).not.toBeInTheDocument();
  });
});
