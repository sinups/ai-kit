import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor, within } from '@testing-library/react';
import { AGENT_MODELS, AGENTS, TOOL_CATALOG } from '../fixtures';
import type { AgentDefinition, AgentDraft } from '../types';
import { AgentsSettingsPanel, type AgentsSettingsPanelProps } from './AgentsSettingsPanel';

/** A long user flow that runs past the default timeout when the whole suite shares the CPU */
const UNDER_LOAD_TIMEOUT = 30_000;

function Harness(props: Partial<AgentsSettingsPanelProps>) {
  const [agents, setAgents] = useState(AGENTS);
  return (
    <AgentsSettingsPanel
      agents={agents}
      catalog={TOOL_CATALOG}
      models={AGENT_MODELS}
      onCreate={(draft: AgentDraft) => {
        const created: AgentDefinition = { ...draft, id: `agent-${draft.name}`, source: 'user' };
        setAgents((prev) => [...prev, created]);
        return created;
      }}
      onUpdate={(agent, draft) =>
        setAgents((prev) =>
          prev.map((item) => (item.id === agent.id ? { ...item, ...draft } : item))
        )
      }
      onDelete={(agent) => setAgents((prev) => prev.filter((item) => item.id !== agent.id))}
      {...props}
    />
  );
}

describe('agents/AgentsSettingsPanel', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('opens the detail, edits and goes back to the list', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    await user.click(screen.getByText('Test runner'));
    expect(screen.getByRole('heading', { name: 'Test runner' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const displayName = screen.getByLabelText('Display name');
    await user.clear(displayName);
    await user.type(displayName, 'Test fixer');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('heading', { name: 'Test fixer' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Agents' }));
    expect(screen.getByText('Test fixer')).toBeInTheDocument();
  });

  it('leaves a clean editor without asking', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    await user.click(screen.getByText('Test runner'));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Agents' }));
    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Test runner' })).toBeInTheDocument();
  });

  it(
    'confirms leaving the editor with unsaved changes',
    async () => {
      const user = userEvent.setup({ delay: null });
      render(<Harness />);

      await user.click(screen.getByText('Test runner'));
      await user.click(screen.getByRole('button', { name: 'Edit' }));
      await user.type(screen.getByLabelText('Display name'), ' v2');
      await user.click(screen.getByRole('button', { name: 'Agents' }));
      expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Keep editing' }));
      await waitFor(() => expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument());
      expect(screen.getByLabelText('Display name')).toHaveValue('Test runner v2');

      await user.click(screen.getByRole('button', { name: 'Agents' }));
      await user.click(await screen.findByRole('button', { name: 'Discard' }));
      expect(await screen.findByRole('heading', { name: 'Test runner' })).toBeInTheDocument();
      expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument();
    },
    UNDER_LOAD_TIMEOUT
  );

  it(
    'confirms selecting another agent while the editor is dirty',
    async () => {
      const user = userEvent.setup({ delay: null });
      render(<Harness defaultSelectedId="agent-test-runner" breakpoint={0} />);

      await user.click(screen.getByRole('button', { name: 'Edit' }));
      await user.type(screen.getByLabelText('Display name'), ' v2');
      await user.click(screen.getByText('Docs writer'));
      expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Discard' }));
      expect(await screen.findByRole('heading', { name: 'Docs writer' })).toBeInTheDocument();
    },
    UNDER_LOAD_TIMEOUT
  );

  it('duplicates a read-only agent into a new one', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);

    await user.click(screen.getByText('General purpose'));
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Duplicate' }));

    expect(screen.getByRole('textbox', { name: /^Name/ })).toHaveValue('general-purpose-copy');
    await user.click(screen.getByRole('button', { name: 'Create agent' }));
    expect(
      await screen.findByRole('heading', { name: 'General purpose copy' })
    ).toBeInTheDocument();
  });

  it('confirms deletion and shows a failure', async () => {
    const user = userEvent.setup({ delay: null });
    const onDelete = jest
      .fn()
      .mockRejectedValueOnce(new Error('Agent is in use'))
      .mockResolvedValueOnce(undefined);
    render(<Harness onDelete={onDelete} />);

    const row = screen.getByRole('option', { name: /Docs writer/ });
    await user.click(within(row).getByRole('button', { name: /^Agent actions/ }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));

    expect(await screen.findByText(/Docs writer will be removed/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Agent is in use')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('Agent is in use')).not.toBeInTheDocument());
  });

  it('opens the creation wizard', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'New agent' }));
    expect(await screen.findByRole('dialog', { name: 'New agent' })).toBeInTheDocument();
  });

  it('reports selection changes and follows a controlled selectedId', async () => {
    const user = userEvent.setup({ delay: null });
    const onSelectedIdChange = jest.fn();
    const { rerender } = render(
      <Harness selectedId={null} onSelectedIdChange={onSelectedIdChange} />
    );

    await user.click(screen.getByText('Test runner'));
    expect(onSelectedIdChange).toHaveBeenCalledWith('agent-test-runner');
    expect(screen.queryByRole('heading', { name: 'Test runner' })).not.toBeInTheDocument();

    rerender(<Harness selectedId="agent-test-runner" onSelectedIdChange={onSelectedIdChange} />);
    expect(screen.getByRole('heading', { name: 'Test runner' })).toBeInTheDocument();
  });
});
