import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import { AGENT_MODELS, AGENTS, TOOL_CATALOG } from '../fixtures';
import { AgentEditor } from './AgentEditor';

describe('AgentEditor', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('validates on save and creates an agent with a derived name', async () => {
    const user = userEvent.setup({ delay: null });
    const onSave = jest.fn();
    render(<AgentEditor catalog={TOOL_CATALOG} models={AGENT_MODELS} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Create agent' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Fix the highlighted fields')).toBeInTheDocument();
    expect(screen.getByText('Write the system prompt')).toBeInTheDocument();

    const fill = async (field: HTMLElement, text: string) => {
      await user.click(field);
      await user.paste(text);
    };
    await fill(screen.getByLabelText('Display name'), 'SQL Analyst');
    expect(screen.getByRole('textbox', { name: /^Name/ })).toHaveValue('sql-analyst');
    await fill(
      screen.getByRole('textbox', { name: /When to use/ }),
      'Use for questions about the analytics database'
    );
    await fill(screen.getByRole('textbox', { name: 'System prompt' }), 'Answer with SQL.');
    await user.click(screen.getByRole('checkbox', { name: /Run read-only query/ }));
    await user.click(screen.getByRole('button', { name: 'violet' }));

    await user.click(screen.getByRole('button', { name: 'Create agent' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'sql-analyst',
        displayName: 'SQL Analyst',
        systemPrompt: 'Answer with SQL.',
        tools: ['mcp__postgres__query'],
        color: 'violet',
        model: 'inherit',
      })
    );
  });

  it('tracks dirty state, shows a rejected save and confirms cancel', async () => {
    const onSave = jest.fn().mockRejectedValue(new Error('Name already used on the server'));
    const user = userEvent.setup({ delay: null });
    const onCancel = jest.fn();
    const onDirtyChange = jest.fn();
    render(
      <AgentEditor
        agent={AGENTS[1]}
        catalog={TOOL_CATALOG}
        onSave={onSave}
        onCancel={onCancel}
        onDirtyChange={onDirtyChange}
      />
    );

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: /^Name/ })).toBeDisabled();

    await user.click(screen.getByRole('textbox', { name: /When to use/ }));
    await user.paste(' Also lint.');
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Name already used on the server')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(await screen.findByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
  });

  it('treats the saved draft as the new baseline', async () => {
    const user = userEvent.setup({ delay: null });
    const onDirtyChange = jest.fn();
    render(
      <AgentEditor
        agent={AGENTS[1]}
        catalog={TOOL_CATALOG}
        onSave={jest.fn().mockResolvedValue(undefined)}
        onDirtyChange={onDirtyChange}
      />
    );

    await user.click(screen.getByRole('textbox', { name: /When to use/ }));
    await user.paste(' Also lint.');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('cancels without confirmation when nothing changed and locks read-only agents', async () => {
    const user = userEvent.setup({ delay: null });
    const onCancel = jest.fn();
    render(
      <AgentEditor
        agent={AGENTS[4]}
        catalog={TOOL_CATALOG}
        onSave={jest.fn()}
        onCancel={onCancel}
      />
    );

    expect(
      screen.getByText('This agent is read-only. Duplicate it to make changes.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
