import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { within } from '@testing-library/react';
import { setElementWidth } from '../primitives/_testing/element-width';
import { MCP_SERVERS } from './fixtures';
import { McpSettingsPanel } from './McpSettingsPanel';

describe('mcp/McpSettingsPanel', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('drills from the list to a server and a tool when narrow', async () => {
    render(<McpSettingsPanel servers={MCP_SERVERS} />);

    await userEvent.click(screen.getByText('git'));
    expect(screen.getByRole('heading', { name: 'git' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Search servers' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Create issue'));
    expect(screen.getByRole('heading', { name: 'Create issue' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Servers' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back: git' }));
    expect(screen.getByRole('tab', { name: /Tools/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Servers' }));
    expect(screen.getByRole('textbox', { name: 'Search servers' })).toBeInTheDocument();
  });

  it('adds a server through the wizard modal', async () => {
    const onAdd = jest.fn(() => Promise.resolve());
    render(<McpSettingsPanel servers={MCP_SERVERS} onAdd={onAdd} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add server' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add MCP server' });
    expect(dialog).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: /Name/ }), 'memory');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.type(screen.getByRole('textbox', { name: /Command/ }), 'npx');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add server' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'memory', command: 'npx' }));
  });

  it('keeps list and detail side by side when wide and edits the selected server', async () => {
    const restore = setElementWidth(1200);
    const onUpdate = jest.fn();
    try {
      render(<McpSettingsPanel servers={MCP_SERVERS} selectedId="postgres" onUpdate={onUpdate} />);

      expect(await screen.findByRole('textbox', { name: 'Search servers' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'postgres' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: 'Configuration' }));
      await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
      expect(await screen.findByRole('dialog', { name: 'Edit MCP server' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('postgres');
    } finally {
      restore();
    }
  });
});
