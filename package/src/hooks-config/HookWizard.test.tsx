import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { HookWizard } from './HookWizard';

const next = () => userEvent.click(screen.getByRole('button', { name: 'Next' }));

describe('hooks-config/HookWizard', () => {
  it('creates a tool hook step by step', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    render(<HookWizard opened onClose={onClose} onSubmit={onSubmit} createId={() => 'new-hook'} />);

    expect(await screen.findByText('Add hook', { selector: 'h2' })).toBeInTheDocument();
    await next();
    expect(screen.getByText('Choose an event')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: /Before tool use/ }));
    await next();
    await userEvent.type(screen.getByRole('combobox', { name: 'Tool matcher' }), 'Bash');
    await next();

    await next();
    expect(screen.getByText('Enter a command')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Command' }), './check.sh');
    await next();

    await userEvent.click(screen.getByRole('radio', { name: /Local/ }));
    await next();
    expect(screen.getByText(/"tool_name": "Bash"/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add hook' }));
    expect(onSubmit).toHaveBeenCalledWith({
      id: 'new-hook',
      event: 'PreToolUse',
      matcher: 'Bash',
      type: 'command',
      command: './check.sh',
      scope: 'local',
      enabled: true,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('edits a hook without a matcher step and keeps the wizard open on failure', async () => {
    const onSubmit = jest.fn(() => Promise.reject(new Error('Settings file is read-only')));
    const onClose = jest.fn();
    render(
      <HookWizard
        opened
        onClose={onClose}
        onSubmit={onSubmit}
        initialHook={{
          id: 'stop',
          event: 'Stop',
          type: 'prompt',
          prompt: 'Are tests green?',
          scope: 'user',
        }}
      />
    );

    expect(await screen.findByText('Edit hook', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Agent stopped/ })).toBeChecked();
    expect(screen.queryByText('Matcher')).not.toBeInTheDocument();

    await next();
    expect(screen.getByRole('textbox', { name: 'Prompt' })).toHaveValue('Are tests green?');
    await next();
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Save hook' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'stop', event: 'Stop', prompt: 'Are tests green?' })
    );
    expect(await screen.findByText('Settings file is read-only')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
