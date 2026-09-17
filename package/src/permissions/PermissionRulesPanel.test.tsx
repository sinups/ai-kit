import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { act, within } from '@testing-library/react';
import {
  PERMISSION_DENIALS_FIXTURE,
  PERMISSION_RULES_FIXTURE,
  WORKSPACE_DIRECTORIES_FIXTURE,
} from './fixtures';
import { setElementWidth } from '../primitives/_testing/element-width';
import { PermissionRulesPanel } from './PermissionRulesPanel';

describe('permissions/PermissionRulesPanel', () => {
  it('lists rules of the active behavior grouped by scope', async () => {
    render(<PermissionRulesPanel rules={PERMISSION_RULES_FIXTURE} onSaveRule={jest.fn()} />);

    expect(screen.getByRole('tab', { name: /Allow/ })).toHaveTextContent('5');
    expect(screen.getByText('Bash(npm run test:*)')).toBeInTheDocument();
    expect(screen.getByText('Allow Bash commands starting with npm run test')).toBeInTheDocument();
    expect(screen.queryByText('Bash(rm -rf *)')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Deny/ }));
    expect(screen.getByText('Bash(rm -rf *)')).toBeInTheDocument();
    expect(screen.getByText(/Managed by policy/)).toBeInTheDocument();
  });

  it('hides actions for policy rules and deletes editable ones', async () => {
    const onDeleteRule = jest.fn();
    render(
      <PermissionRulesPanel
        rules={PERMISSION_RULES_FIXTURE.filter((rule) => rule.behavior === 'deny')}
        defaultTab="deny"
        onDeleteRule={onDeleteRule}
      />
    );

    expect(screen.getAllByRole('button', { name: 'Actions' })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(onDeleteRule).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('dialog', { name: 'Delete rule' });
    expect(within(dialog).getByText('Bash(rm -rf *)')).toBeInTheDocument();
    expect(within(dialog).getByText(/removed from the User settings/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(onDeleteRule).toHaveBeenCalledWith(expect.objectContaining({ id: 'deny-rm' }));
  });

  it('shows pending on the row and an alert when an async action fails', async () => {
    let reject: (error: Error) => void = () => {};
    const onMoveRule = jest.fn(() => new Promise<void>((_, fail) => (reject = fail)));
    render(
      <PermissionRulesPanel
        rules={PERMISSION_RULES_FIXTURE.filter((rule) => rule.id === 'deny-rm')}
        defaultTab="deny"
        onMoveRule={onMoveRule}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Move to Project' }));
    expect(onMoveRule).toHaveBeenCalledWith(expect.objectContaining({ id: 'deny-rm' }), 'project');
    expect(screen.getByLabelText('Saving')).toBeInTheDocument();

    await act(async () => reject(new Error('settings.json is read-only')));
    expect(await screen.findByText('settings.json is read-only')).toBeInTheDocument();
    expect(screen.queryByLabelText('Saving')).not.toBeInTheDocument();
  });

  it('keeps the confirmation open when removing a directory fails', async () => {
    const onRemoveDirectory = jest.fn(() => Promise.reject(new Error('Directory is locked')));
    render(
      <PermissionRulesPanel
        rules={[]}
        directories={WORKSPACE_DIRECTORIES_FIXTURE}
        defaultTab="workspace"
        onRemoveDirectory={onRemoveDirectory}
      />
    );

    await userEvent.click(screen.getAllByRole('button', { name: 'Actions' })[0]);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove directory' });
    expect(within(dialog).getByText('/Users/me/projects/api')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));
    expect(await within(dialog).findByText('Directory is locked')).toBeInTheDocument();
    expect(onRemoveDirectory).toHaveBeenCalledTimes(1);
  });

  it('opens the wizard prefilled from a denial', async () => {
    const onSaveRule = jest.fn();
    render(
      <PermissionRulesPanel
        rules={[]}
        denials={PERMISSION_DENIALS_FIXTURE}
        defaultTab="denials"
        onSaveRule={onSaveRule}
      />
    );

    const allowButtons = screen.getAllByRole('button', { name: 'Allow this' });
    await userEvent.click(allowButtons[0]);
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    expect(within(dialog).getByRole('textbox', { name: 'Rule' })).toHaveValue(
      'Bash(npm run build:*)'
    );
  });

  it('validates and adds workspace directories', async () => {
    const onAddDirectory = jest.fn();
    render(
      <PermissionRulesPanel
        rules={[]}
        directories={WORKSPACE_DIRECTORIES_FIXTURE}
        defaultTab="workspace"
        onAddDirectory={onAddDirectory}
        onRemoveDirectory={jest.fn()}
      />
    );

    expect(screen.getAllByRole('button', { name: 'Actions' })).toHaveLength(2);
    const input = screen.getByLabelText('/absolute/path/to/directory');
    await userEvent.type(input, 'relative/path');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText(/Use an absolute path/)).toBeInTheDocument();
    expect(onAddDirectory).not.toHaveBeenCalled();

    await userEvent.clear(input);
    await userEvent.type(input, '/srv/data{enter}');
    expect(onAddDirectory).toHaveBeenCalledWith({ path: '/srv/data', scope: 'local' });
    expect(input).toHaveValue('');
  });

  it('shows an error with retry', async () => {
    const onRetry = jest.fn();
    render(<PermissionRulesPanel rules={[]} error="Could not load settings" onRetry={onRetry} />);
    expect(screen.getByText('Could not load settings')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('switches sections with a select and no tab panels when narrow', async () => {
    const restore = setElementWidth(400);
    render(<PermissionRulesPanel rules={PERMISSION_RULES_FIXTURE} />);

    expect(
      await screen.findByRole('combobox', { name: 'Permission sections' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.getByText('Bash(npm run test:*)')).toBeInTheDocument();
    restore();
  });
});
