import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import { AGENT_MODELS, TOOL_CATALOG } from '../fixtures';
import type { AgentDraft } from '../types';
import { AgentCreateWizard } from './AgentCreateWizard';

describe('AgentCreateWizard', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('configures an agent manually and creates it', async () => {
    const user = userEvent.setup({ delay: null });
    const onCreate = jest.fn();
    const onClose = jest.fn();
    render(
      <AgentCreateWizard
        opened
        onClose={onClose}
        onCreate={onCreate}
        catalog={TOOL_CATALOG}
        models={AGENT_MODELS}
        existingNames={['researcher']}
      />
    );

    expect(await screen.findByText('Step 1 of 5')).toBeInTheDocument();
    const fill = async (field: HTMLElement, text: string) => {
      await user.click(field);
      await user.paste(text);
    };
    await fill(screen.getByLabelText('Display name'), 'Researcher');
    await fill(
      screen.getByRole('textbox', { name: /When to use/ }),
      'Use for open questions that need reading'
    );
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('An agent with this name already exists')).toBeInTheDocument();
    await user.clear(screen.getByRole('textbox', { name: /^Name/ }));
    await fill(screen.getByRole('textbox', { name: /^Name/ }), 'deep-researcher');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await fill(screen.getByRole('textbox', { name: 'System prompt' }), '# Research');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Select at least one tool')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Built-in' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.getByText('8 tools from Built-in')).toBeInTheDocument();
    expect(
      screen.getByText(/The agent can call destructive tools: Write, Bash/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create agent' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'deep-researcher',
        displayName: 'Researcher',
        systemPrompt: '# Research',
        tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob', 'WebFetch', 'WebSearch'],
      })
    );
    expect(onCreate.mock.calls[0][0]).not.toHaveProperty('method');
  });

  it('generates a draft with AI and requires it before moving on', async () => {
    const user = userEvent.setup({ delay: null });
    const onGenerate = jest
      .fn()
      .mockRejectedValueOnce(new Error('Model is overloaded'))
      .mockResolvedValueOnce({
        displayName: 'Changelog writer',
        description: 'Use before a release to write the changelog from merged PRs',
        systemPrompt: 'Write the changelog.',
        tools: ['Read', 'mcp__git__get_pull_request'],
      });
    render(
      <AgentCreateWizard
        opened
        onClose={jest.fn()}
        onCreate={jest.fn()}
        onGenerate={onGenerate}
        catalog={TOOL_CATALOG}
      />
    );

    expect(await screen.findByText('Step 1 of 6')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByText('Generate a draft or switch to manual configuration')
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: 'What should the agent do?' }),
      'Write changelogs'
    );
    await user.click(screen.getByRole('button', { name: 'Generate draft' }));
    expect(await screen.findByText('Model is overloaded')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generate draft' }));
    expect(await screen.findByText(/Draft generated/)).toBeInTheDocument();
    expect(onGenerate).toHaveBeenLastCalledWith('Write changelogs');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('textbox', { name: /^Name/ })).toHaveValue('changelog-writer');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('textbox', { name: 'System prompt' })).toHaveValue(
      'Write the changelog.'
    );
  });

  it('locks navigation while a draft is generating', async () => {
    const user = userEvent.setup({ delay: null });
    let finish: (draft: Partial<AgentDraft>) => void = () => {};
    const onGenerate = jest.fn(
      () => new Promise<Partial<AgentDraft>>((resolve) => (finish = resolve))
    );
    render(
      <AgentCreateWizard
        opened
        onClose={jest.fn()}
        onCreate={jest.fn()}
        onGenerate={onGenerate}
        catalog={TOOL_CATALOG}
      />
    );

    await user.type(
      await screen.findByRole('textbox', { name: 'What should the agent do?' }),
      'Write changelogs'
    );
    await user.click(screen.getByRole('button', { name: 'Generate draft' }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Configure manually/ })).toBeDisabled();

    finish({ displayName: 'Changelog writer' });
    expect(await screen.findByText(/Draft generated/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();
  });

  it('skips the method step without onGenerate', async () => {
    render(
      <AgentCreateWizard opened onClose={jest.fn()} onCreate={jest.fn()} catalog={TOOL_CATALOG} />
    );
    expect(await screen.findByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.queryByText('Generate with AI')).not.toBeInTheDocument();
  });
});
