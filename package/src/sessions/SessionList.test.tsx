import React from 'react';
import { act, waitFor, within } from '@testing-library/react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { SessionList } from './SessionList';
import type { SessionSummary } from './types';

const NOW = new Date(2026, 8, 17, 12, 0);

const SESSIONS: SessionSummary[] = [
  {
    id: 'today',
    title: 'Fix login retry',
    preview: 'Retry three times',
    createdAt: new Date(2026, 8, 17, 9),
    updatedAt: new Date(2026, 8, 17, 11, 30),
    messageCount: 4,
  },
  {
    id: 'pinned',
    title: 'Release notes',
    createdAt: new Date(2026, 7, 1),
    updatedAt: new Date(2026, 7, 1),
    messageCount: 10,
    pinned: true,
  },
  {
    id: 'yesterday',
    title: 'Database index',
    tags: ['postgres'],
    createdAt: new Date(2026, 8, 16, 10),
    updatedAt: new Date(2026, 8, 16, 10),
    messageCount: 2,
  },
  {
    id: 'archived',
    title: 'Old spike',
    createdAt: new Date(2026, 1, 1),
    updatedAt: new Date(2026, 1, 1),
    messageCount: 1,
    archived: true,
  },
];

function option(title: string) {
  return screen.getByText(title).closest('[role="option"]') as HTMLElement;
}

describe('sessions/SessionList', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('groups sessions by date with pinned first and hides archived ones', () => {
    render(<SessionList sessions={SESSIONS} now={NOW} />);

    const groups = screen.getAllByRole('group');
    expect(groups.map((group) => group.firstChild?.textContent)).toEqual([
      'Pinned',
      'Today',
      'Yesterday',
    ]);
    expect(within(groups[1]).getByText('30 minutes ago')).toBeInTheDocument();
    expect(screen.queryByText('Old spike')).not.toBeInTheDocument();
  });

  it('filters archived sessions and searches with fuzzy matching', async () => {
    const onFilterChange = jest.fn();
    render(<SessionList sessions={SESSIONS} now={NOW} onFilterChange={onFilterChange} />);

    await userEvent.type(screen.getByPlaceholderText('Search sessions'), 'pstgr');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText('Database index')).toBeInTheDocument();

    await userEvent.clear(screen.getByPlaceholderText('Search sessions'));
    await userEvent.click(screen.getByRole('button', { name: 'Filter sessions: All' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Archived/ }));
    expect(onFilterChange).toHaveBeenCalledWith('archived');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText('Old spike')).toBeInTheDocument();
  });

  it('renames inline with Enter and cancels with Escape without selecting the row', async () => {
    let resolve: () => void = () => {};
    const onRename = jest.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        })
    );
    const onSelect = jest.fn();
    render(<SessionList sessions={SESSIONS} now={NOW} onRename={onRename} onSelect={onSelect} />);

    await userEvent.click(
      within(option('Database index')).getByRole('button', { name: 'Session actions' })
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const input = screen.getByRole('textbox', { name: 'Session title' });
    await userEvent.click(input);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('textbox', { name: 'Session title' })).not.toBeInTheDocument();

    await userEvent.click(
      within(option('Database index')).getByRole('button', { name: 'Session actions' })
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const second = screen.getByRole('textbox', { name: 'Session title' });
    await userEvent.clear(second);
    await userEvent.type(second, 'Add report index{Enter}');

    expect(onRename).toHaveBeenCalledWith(SESSIONS[2], 'Add report index');
    expect(second).toBeDisabled();
    resolve();
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Session title' })).not.toBeInTheDocument()
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('confirms deletion in a modal and shows a rejection', async () => {
    const onDelete = jest
      .fn()
      .mockRejectedValueOnce(new Error('Server unavailable'))
      .mockResolvedValueOnce(undefined);
    render(<SessionList sessions={SESSIONS} now={NOW} onDelete={onDelete} />);

    await userEvent.click(
      within(option('Fix login retry')).getByRole('button', { name: 'Session actions' })
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete session?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByText('Server unavailable')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Delete session?' })).not.toBeInTheDocument()
    );
  });

  it('reports pin, archive and export actions', async () => {
    const onPin = jest.fn();
    const onArchive = jest.fn();
    const onExport = jest.fn();
    const onSelect = jest.fn();
    render(
      <SessionList
        sessions={SESSIONS}
        now={NOW}
        onPin={onPin}
        onArchive={onArchive}
        onExport={onExport}
        onSelect={onSelect}
      />
    );

    const menu = () =>
      within(option('Release notes')).getByRole('button', { name: 'Session actions' });
    await userEvent.click(menu());
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Unpin' }));
    await userEvent.click(menu());
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Archive' }));
    await userEvent.click(menu());
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Export' }));

    expect(onPin).toHaveBeenCalledWith(SESSIONS[1], false);
    expect(onArchive).toHaveBeenCalledWith(SESSIONS[1], true);
    expect(onExport).toHaveBeenCalledWith(SESSIONS[1]);
    expect(onSelect).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText('Release notes'));
    expect(onSelect).toHaveBeenCalledWith(SESSIONS[1]);
  });

  it('saves the title on blur and does not save after Escape', async () => {
    const onRename = jest.fn();
    render(
      <>
        <SessionList sessions={SESSIONS} now={NOW} onRename={onRename} />
        <button type="button">Elsewhere</button>
      </>
    );

    const openRename = async () => {
      await userEvent.click(
        within(option('Database index')).getByRole('button', { name: 'Session actions' })
      );
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
      return screen.getByRole('textbox', { name: 'Session title' });
    };

    const input = await openRename();
    await userEvent.clear(input);
    await userEvent.type(input, 'Skipped title{Escape}');
    expect(onRename).not.toHaveBeenCalled();

    const again = await openRename();
    await userEvent.clear(again);
    await userEvent.type(again, 'Blurred title');
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onRename).toHaveBeenCalledWith(SESSIONS[2], 'Blurred title');
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Session title' })).not.toBeInTheDocument()
    );
  });

  it('refreshes relative times every minute without now', () => {
    jest.useFakeTimers({ now: NOW });
    try {
      render(
        <SessionList sessions={[{ ...SESSIONS[0], updatedAt: new Date(NOW.getTime() - 10_000) }]} />
      );
      expect(screen.getByText('now')).toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(3 * 60_000);
      });
      expect(screen.getByText('3 minutes ago')).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps a newer rename open when an earlier save finishes', async () => {
    const saves = new Map<string, () => void>();
    const onRename = jest.fn(
      (session: SessionSummary) =>
        new Promise<void>((resolve) => {
          saves.set(session.id, resolve);
        })
    );
    render(<SessionList sessions={SESSIONS} now={NOW} onRename={onRename} />);

    const openRename = async (title: string) => {
      await userEvent.click(within(option(title)).getByRole('button', { name: 'Session actions' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
      return screen.getByRole('textbox', { name: 'Session title' });
    };

    const first = await openRename('Fix login retry');
    await userEvent.clear(first);
    await userEvent.type(first, 'First title{Enter}');
    expect(onRename).toHaveBeenCalledTimes(1);

    const second = await openRename('Database index');
    await userEvent.clear(second);
    await userEvent.type(second, 'Second');
    await act(async () => {
      saves.get('today')?.();
    });
    expect(screen.getByRole('textbox', { name: 'Session title' })).toHaveValue('Second');

    await userEvent.type(screen.getByRole('textbox', { name: 'Session title' }), ' title{Enter}');
    expect(onRename).toHaveBeenLastCalledWith(SESSIONS[2], 'Second title');
  });

  it('opens an on-demand search field, filters and closes it with Escape', async () => {
    render(<SessionList sessions={SESSIONS} now={NOW} withSearch="on-demand" />);

    expect(screen.queryByRole('textbox', { name: 'Search sessions' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter sessions: All' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    const search = screen.getByRole('textbox', { name: 'Search sessions' });
    expect(search).toHaveFocus();
    expect(search).toHaveAttribute('data-autofocus');
    await userEvent.type(search, 'database');
    expect(screen.getAllByRole('option')).toHaveLength(1);

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('textbox', { name: 'Search sessions' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('hides search and filter when disabled', () => {
    render(<SessionList sessions={SESSIONS} now={NOW} withSearch={false} withFilter={false} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Filter sessions/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('shows the empty state without sessions', () => {
    render(<SessionList sessions={[]} now={NOW} />);
    expect(screen.getByText('No sessions yet')).toBeInTheDocument();
  });
});
