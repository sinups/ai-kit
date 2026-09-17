import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { act, within } from '@testing-library/react';
import { HOOKS_FIXTURE } from './fixtures';
import { HooksPanel } from './HooksPanel';

describe('HooksPanel', () => {
  it('groups hooks by event with counters and expands events that have hooks', () => {
    render(<HooksPanel hooks={HOOKS_FIXTURE} />);

    const preToolUse = screen.getByRole('button', { name: /Before tool use/ });
    expect(within(preToolUse).getByText('2')).toBeInTheDocument();
    expect(preToolUse).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Before compaction/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.getByText('Bash')).toBeInTheDocument();
    expect(screen.getByText('Tools matching Edit|Write')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add hook' })).not.toBeInTheDocument();
  });

  it('uses overridden event, scope and matcher texts', () => {
    render(
      <HooksPanel
        hooks={HOOKS_FIXTURE}
        labels={{
          events: { PreToolUse: { label: 'Avant un outil' } },
          scopes: { project: { label: 'Projet' } },
          messages: { toolsMatching: (pattern) => `Outils ${pattern}` },
        }}
      />
    );

    expect(screen.getByRole('button', { name: /Avant un outil/ })).toBeInTheDocument();
    expect(screen.getByText('Outils Edit|Write')).toBeInTheDocument();
    expect(screen.getAllByText('Projet').length).toBeGreaterThan(0);
  });

  it('toggles and deletes hooks', async () => {
    const onToggle = jest.fn();
    const onDelete = jest.fn(() => Promise.reject(new Error('Policy hooks cannot be removed')));
    render(
      <HooksPanel hooks={HOOKS_FIXTURE.slice(0, 1)} onToggle={onToggle} onDelete={onDelete} />
    );

    await userEvent.click(screen.getByRole('switch', { name: /^Enabled/ }));
    expect(onToggle).toHaveBeenCalledWith(HOOKS_FIXTURE[0], false);

    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog', { name: 'Delete hook' });
    expect(within(dialog).getByText(/will no longer run on/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(HOOKS_FIXTURE[0]);
    expect(await within(dialog).findByText('Policy hooks cannot be removed')).toBeInTheDocument();
  });

  it('disables the switch while a toggle is pending and shows its error', async () => {
    let reject: (error: Error) => void = () => {};
    const onToggle = jest.fn(() => new Promise<void>((_, fail) => (reject = fail)));
    render(<HooksPanel hooks={HOOKS_FIXTURE.slice(0, 1)} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('switch', { name: /^Enabled/ }));
    expect(screen.getByRole('switch', { name: /^Enabled/ })).toBeDisabled();
    expect(screen.getByLabelText('Saving')).toBeInTheDocument();

    await act(async () => reject(new Error('Hooks file is read-only')));
    expect(await screen.findByText('Hooks file is read-only')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /^Enabled/ })).not.toBeDisabled();
  });

  it('opens the wizard to edit a hook and reports the save mode', async () => {
    const onSave = jest.fn();
    render(<HooksPanel hooks={[HOOKS_FIXTURE[4]]} onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
    expect(await screen.findByText('Edit hook', { selector: 'h2' })).toBeInTheDocument();

    for (let step = 0; step < 3; step++) {
      await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    }
    await userEvent.click(screen.getByRole('button', { name: 'Save hook' }));
    expect(onSave).toHaveBeenCalledWith({ ...HOOKS_FIXTURE[4], enabled: true }, 'edit');
  });

  it('shows empty, loading and error states', async () => {
    const onRetry = jest.fn();
    const { container, rerender } = render(<HooksPanel hooks={[]} onSave={jest.fn()} />);
    expect(screen.getByText('No hooks yet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add hook' }));
    expect(await screen.findByText('Add hook', { selector: 'h2' })).toBeInTheDocument();

    rerender(<HooksPanel hooks={[]} loading />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();

    rerender(<HooksPanel hooks={[]} error="Could not read settings" onRetry={onRetry} />);
    expect(screen.getByText('Could not read settings')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });
});
