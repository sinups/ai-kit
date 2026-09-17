import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { TOOL_CATALOG } from '../fixtures';
import type { AgentToolSelection } from '../types';
import { ToolSelector } from './ToolSelector';

function Harness({
  initial,
  onChange,
}: {
  initial: AgentToolSelection;
  onChange?: (value: AgentToolSelection) => void;
}) {
  const [value, setValue] = useState<AgentToolSelection>(initial);
  return (
    <ToolSelector
      catalog={TOOL_CATALOG}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe('agents/ToolSelector', () => {
  it('toggles tools and shows the counter', async () => {
    const onChange = jest.fn();
    render(<Harness initial={['Read']} onChange={onChange} />);

    expect(screen.getByText('1 of 16 selected')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^Read/ })).toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: /^Grep/ }));
    expect(onChange).toHaveBeenLastCalledWith(['Read', 'Grep']);
    expect(screen.getByText('2 of 16 selected')).toBeInTheDocument();
  });

  it('selects a whole group and marks partial groups as indeterminate', async () => {
    const onChange = jest.fn();
    render(<Harness initial={['mcp__postgres__query']} onChange={onChange} />);

    const group = screen.getByRole('checkbox', { name: 'MCP: postgres' });
    expect(group).toHaveAttribute('data-indeterminate', 'true');

    await userEvent.click(group);
    expect(onChange).toHaveBeenLastCalledWith(['mcp__postgres__query', 'mcp__postgres__execute']);
    expect(screen.getByRole('checkbox', { name: 'MCP: postgres' })).toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: 'MCP: postgres' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('switches between all tools and a selection that is remembered', async () => {
    const onChange = jest.fn();
    render(<Harness initial={['Read', 'Bash']} onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: 'All tools' }));
    expect(onChange).toHaveBeenLastCalledWith('all');
    expect(screen.getByRole('checkbox', { name: /^Grep/ })).toBeDisabled();
    expect(screen.getByText('16 of 16 selected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Selected' }));
    expect(onChange).toHaveBeenLastCalledWith(['Read', 'Bash']);
  });

  it('filters tools with search and marks risky tools', async () => {
    render(<Harness initial={[]} />);

    expect(screen.getAllByText('destructive').length).toBeGreaterThan(0);
    await userEvent.type(screen.getByRole('textbox', { name: 'Search tools' }), 'postgres');
    expect(screen.getByRole('checkbox', { name: /Run read-only query/ })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /^Read/ })).not.toBeInTheDocument();

    await userEvent.clear(screen.getByRole('textbox', { name: 'Search tools' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Search tools' }), 'zzzz');
    expect(screen.getByText('No tools match the search')).toBeInTheDocument();
  });

  it('collapses a group', async () => {
    render(<Harness initial={[]} />);
    const toggle = screen.getAllByRole('button', { name: 'Collapse group' })[0];
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAccessibleName('Expand group');
  });

  it('renders an empty state without tools', () => {
    render(<ToolSelector catalog={[]} value={[]} onChange={jest.fn()} />);
    expect(screen.getByText('No tools available')).toBeInTheDocument();
  });
});
