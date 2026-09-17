import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor } from '@testing-library/react';
import { AddPermissionRuleWizard } from './AddPermissionRuleWizard';

describe('permissions/AddPermissionRuleWizard', () => {
  it('creates a rule through behavior, rule, scope and review', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    render(
      <AddPermissionRuleWizard
        opened
        onClose={onClose}
        onSubmit={onSubmit}
        createId={() => 'new-rule'}
      />
    );

    await userEvent.click(await screen.findByRole('radio', { name: /Ask/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/Enter a rule/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Bash(npm run test:*)' }));
    expect(screen.getByRole('textbox', { name: 'Rule' })).toHaveValue('Bash(npm run test:*)');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    await userEvent.click(screen.getByRole('radio', { name: /Project/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(
      screen.getByText('Ask before Bash commands starting with npm run test')
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }));

    expect(onSubmit).toHaveBeenCalledWith({
      id: 'new-rule',
      behavior: 'ask',
      toolName: 'Bash',
      specifier: 'npm run test:*',
      scope: 'project',
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('warns about broad allow rules and keeps the id when editing', async () => {
    const onSubmit = jest.fn();
    render(
      <AddPermissionRuleWizard
        opened
        onClose={jest.fn()}
        onSubmit={onSubmit}
        initialRule={{ id: 'r1', behavior: 'allow', toolName: 'Bash', scope: 'user' }}
      />
    );

    expect(await screen.findByText('Edit permission rule')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('textbox', { name: 'Rule' })).toHaveValue('Bash');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText(/allows every Bash call/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save rule' }));
    expect(onSubmit).toHaveBeenCalledWith({
      id: 'r1',
      behavior: 'allow',
      toolName: 'Bash',
      scope: 'user',
    });
  });
});
