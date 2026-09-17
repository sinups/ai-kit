import React, { memo, useMemo, useRef, useState } from 'react';
import { ActionIcon, Button, Group, Loader, Menu, Stack, Text, TextInput } from '@mantine/core';
import { useInterval } from '@mantine/hooks';
import {
  IconArchive,
  IconArchiveOff,
  IconCheck,
  IconChevronDown,
  IconDownload,
  IconMessages,
  IconPencil,
  IconPin,
  IconPinnedOff,
  IconPinFilled,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { usePendingActions } from '../hooks/use-pending-actions';
import { useFuzzySearch } from '../primitives/CommandPalette/use-fuzzy-search';
import type { FuzzyKey } from '../primitives/CommandPalette/fuzzy';
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog';
import { EntityList } from '../primitives/EntityList/EntityList';
import { EntityListItem, type EntityListItemAction } from '../primitives/EntityList/EntityListItem';
import { getErrorMessage } from '../utils/error-message';
import { formatRelativeTime } from './format-relative-time';
import {
  groupSessionsByDate,
  matchesSessionFilter,
  type SessionDateGroupLabels,
} from './group-sessions';
import type { SessionFilter, SessionSummary } from './types';
import classes from './SessionList.module.css';

export interface SessionListLabels {
  list: string;
  search: string;
  openSearch: string;
  closeSearch: string;
  filter: string;
  filterAll: string;
  filterPinned: string;
  filterArchived: string;
  actions: string;
  pin: string;
  unpin: string;
  rename: string;
  renameInput: string;
  renameError: string;
  export: string;
  archive: string;
  unarchive: string;
  delete: string;
  noResults: string;
  emptyTitle: string;
  emptyDescription: string;
  retry: string;
  deleteTitle: string;
  deleteMessage: (title: string) => React.ReactNode;
  deleteConfirm: string;
  cancel: string;
  /** Date group headers */
  groups: Partial<SessionDateGroupLabels>;
}

export interface SessionListProps {
  /** Sessions to list, archived ones included */
  sessions: SessionSummary[];
  /** Shows skeleton rows */
  loading?: boolean;
  /** Error message shown instead of the list */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetry?: () => void;
  /** Id of the selected session */
  selectedId?: string | null;
  /** Called when a session is clicked or chosen with Enter */
  onSelect?: (session: SessionSummary) => void;
  /** Saves a new title, the Rename action is shown only when set */
  onRename?: (session: SessionSummary, title: string) => Promise<void> | void;
  /** Pins or unpins a session, the Pin action is shown only when set */
  onPin?: (session: SessionSummary, pinned: boolean) => void;
  /** Archives or restores a session, the Archive action is shown only when set */
  onArchive?: (session: SessionSummary, archived: boolean) => void;
  /** Deletes a session after confirmation, the Delete action is shown only when set */
  onDelete?: (session: SessionSummary) => Promise<void> | void;
  /** Opens the export flow for a session, the Export action is shown only when set */
  onExport?: (session: SessionSummary) => void;
  /** Selected filter, uncontrolled with `all` by default */
  filter?: SessionFilter;
  /** Called when the filter changes */
  onFilterChange?: (filter: SessionFilter) => void;
  /** Content rendered next to the search input, for example a new chat button */
  toolbar?: React.ReactNode;
  /** Search field: `true` shows it above the list, `on-demand` shows a search button that opens a borderless field, `true` by default */
  withSearch?: boolean | 'on-demand';
  /** Shows the compact All / Pinned / Archived filter, `true` by default */
  withFilter?: boolean;
  /** Reference time for date groups and relative times, the current time by default */
  now?: Date;
  /** Locale of relative times and month names, `en` by default */
  locale?: string;
  /** Overrides of the default English labels */
  labels?: Partial<SessionListLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const DEFAULT_SESSION_LIST_LABELS: SessionListLabels = {
  list: 'Sessions',
  search: 'Search sessions',
  openSearch: 'Search',
  closeSearch: 'Close search',
  filter: 'Filter sessions',
  filterAll: 'All',
  filterPinned: 'Pinned',
  filterArchived: 'Archived',
  actions: 'Session actions',
  pin: 'Pin',
  unpin: 'Unpin',
  rename: 'Rename',
  renameInput: 'Session title',
  renameError: 'Could not rename the session',
  export: 'Export',
  archive: 'Archive',
  unarchive: 'Unarchive',
  delete: 'Delete',
  noResults: 'No sessions found',
  emptyTitle: 'No sessions yet',
  emptyDescription: 'Conversations you start will appear here.',
  retry: 'Retry',
  deleteTitle: 'Delete session?',
  deleteMessage: (title) => (
    <>
      <Text span fw={500} inherit>
        {title}
      </Text>{' '}
      will be deleted permanently. This cannot be undone.
    </>
  ),
  deleteConfirm: 'Delete',
  cancel: 'Cancel',
  groups: {},
};

const SEARCH_KEYS: FuzzyKey<SessionSummary>[] = ['title', 'preview', 'tags'];

function stop(event: React.SyntheticEvent) {
  event.stopPropagation();
}

interface RenameState {
  id: string;
  value: string;
  pending: boolean;
  error?: string;
}

/** Session history grouped by date with fuzzy search, a pinned and archived filter and per-session actions */
export const SessionList = memo(function SessionList({
  sessions,
  loading,
  error,
  onRetry,
  selectedId,
  onSelect,
  onRename,
  onPin,
  onArchive,
  onDelete,
  onExport,
  filter: filterProp,
  onFilterChange,
  toolbar,
  withSearch = true,
  withFilter = true,
  now: nowProp,
  locale = 'en',
  labels,
  className,
  style,
}: SessionListProps) {
  const text = { ...DEFAULT_SESSION_LIST_LABELS, ...labels };
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [innerFilter, setInnerFilter] = useState<SessionFilter>('all');
  const [rename, setRename] = useState<RenameState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SessionSummary | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [tick, setTick] = useState(0);
  const renameCancelled = useRef<string | null>(null);
  const renameActions = usePendingActions();

  useInterval(() => setTick((value) => value + 1), 60_000, { autoInvoke: nowProp === undefined });

  const filter = filterProp ?? innerFilter;
  const now = useMemo(() => nowProp ?? new Date(), [nowProp, sessions, tick]);

  const setFilter = (value: SessionFilter) => {
    setInnerFilter(value);
    onFilterChange?.(value);
  };

  const filtered = useMemo(
    () => sessions.filter((session) => matchesSessionFilter(session, filter)),
    [sessions, filter]
  );
  const results = useFuzzySearch({ items: filtered, keys: SEARCH_KEYS, query });

  const { items, groupOf, groupOrder } = useMemo(() => {
    const ordered = results.map((result) => result.item);
    const groups = groupSessionsByDate(ordered, now, text.groups, locale);
    const byId = new Map<string, string>();
    for (const group of groups) {
      for (const session of group.sessions) {
        byId.set(session.id, group.label);
      }
    }
    return {
      items: query.trim() ? ordered : groups.flatMap((group) => group.sessions),
      groupOf: byId,
      groupOrder: groups.map((group) => group.label),
    };
  }, [results, now, text.groups, locale, query]);

  const counts = useMemo(
    () => ({
      all: sessions.filter((session) => matchesSessionFilter(session, 'all')).length,
      pinned: sessions.filter((session) => matchesSessionFilter(session, 'pinned')).length,
      archived: sessions.filter((session) => matchesSessionFilter(session, 'archived')).length,
    }),
    [sessions]
  );

  const startRename = (session: SessionSummary) => {
    renameCancelled.current = null;
    setRename({ id: session.id, value: session.title, pending: false });
  };

  const commitRename = async (session: SessionSummary) => {
    if (rename?.id !== session.id || !onRename || renameCancelled.current === session.id) {
      return;
    }
    const title = rename.value.trim();
    if (!title || title === session.title) {
      setRename(null);
      return;
    }
    const sameSession = (current: RenameState | null) => current?.id === session.id;
    await renameActions.run(`rename:${session.id}`, async () => {
      setRename({ ...rename, pending: true, error: undefined });
      try {
        await onRename(session, title);
        setRename((current) => (sameSession(current) ? null : current));
      } catch (reason) {
        setRename((current) =>
          sameSession(current) && current
            ? { ...current, pending: false, error: getErrorMessage(reason, text.renameError) }
            : current
        );
      }
    });
  };

  const actionsFor = (session: SessionSummary): EntityListItemAction[] => {
    const actions: EntityListItemAction[] = [];
    if (onPin && !session.archived) {
      actions.push({
        label: session.pinned ? text.unpin : text.pin,
        icon: session.pinned ? <IconPinnedOff size={14} /> : <IconPin size={14} />,
        onClick: () => onPin(session, !session.pinned),
      });
    }
    if (onRename) {
      actions.push({
        label: text.rename,
        icon: <IconPencil size={14} />,
        onClick: () => startRename(session),
      });
    }
    if (onExport) {
      actions.push({
        label: text.export,
        icon: <IconDownload size={14} />,
        onClick: () => onExport(session),
      });
    }
    if (onArchive) {
      actions.push({
        label: session.archived ? text.unarchive : text.archive,
        icon: session.archived ? <IconArchiveOff size={14} /> : <IconArchive size={14} />,
        onClick: () => onArchive(session, !session.archived),
      });
    }
    if (onDelete) {
      actions.push({
        label: text.delete,
        icon: <IconTrash size={14} />,
        color: 'red',
        onClick: () => {
          setDeleteTarget(session);
          setDeleteOpened(true);
        },
      });
    }
    return actions;
  };

  const renderItem = (session: SessionSummary, { selected }: { selected: boolean }) => {
    if (rename?.id === session.id) {
      const renaming = rename;
      return (
        <Group px="sm" py="xs">
          <TextInput
            flex={1}
            size="sm"
            autoFocus
            aria-label={text.renameInput}
            value={renaming.value}
            disabled={renaming.pending}
            error={renaming.error}
            rightSection={renaming.pending ? <Loader size={14} /> : undefined}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              const value = event.currentTarget.value;
              setRename((current) => (current ? { ...current, value, error: undefined } : current));
            }}
            onClick={stop}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Enter') {
                event.preventDefault();
                void commitRename(session);
              } else if (event.key === 'Escape') {
                event.preventDefault();
                renameCancelled.current = renaming.id;
                setRename(null);
              }
            }}
            onBlur={() => void commitRename(session)}
          />
        </Group>
      );
    }

    return (
      <EntityListItem
        className={classes.item}
        title={session.title}
        description={session.preview}
        descriptionLines={1}
        status={
          session.pinned && !session.archived ? (
            <IconPinFilled
              size={12}
              aria-label={text.filterPinned}
              color="var(--mantine-color-dimmed)"
            />
          ) : undefined
        }
        meta={formatRelativeTime(session.updatedAt, now, locale)}
        actions={actionsFor(session)}
        labels={{ actions: text.actions }}
        selected={selected}
      />
    );
  };

  const filterOptions: { value: SessionFilter; label: string; count: number }[] = [
    { value: 'all', label: text.filterAll, count: counts.all },
    { value: 'pinned', label: text.filterPinned, count: counts.pinned },
    { value: 'archived', label: text.filterArchived, count: counts.archived },
  ];
  const activeFilter = filterOptions.find((option) => option.value === filter) ?? filterOptions[0];

  const filterControl = withFilter && (
    <Menu position="bottom-start" withinPortal>
      <Menu.Target>
        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          fw={500}
          rightSection={<IconChevronDown size={12} />}
          aria-label={`${text.filter}: ${activeFilter.label}`}
        >
          {activeFilter.label}
          <Text span inherit c="dimmed" fw={400} ml={4}>
            {activeFilter.count}
          </Text>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {filterOptions.map((option) => (
          <Menu.Item
            key={option.value}
            leftSection={
              <IconCheck
                size={14}
                className={classes.filterCheck}
                data-visible={option.value === filter || undefined}
              />
            }
            rightSection={
              <Text size="xs" c="dimmed">
                {option.count}
              </Text>
            }
            aria-current={option.value === filter || undefined}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );

  const closeSearch = () => {
    setQuery('');
    setSearchOpen(false);
  };

  const searchField =
    withSearch === 'on-demand' ? (
      <TextInput
        variant="unstyled"
        flex={1}
        miw={0}
        size="sm"
        data-autofocus
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeSearch();
          }
        }}
        placeholder={text.search}
        aria-label={text.search}
        leftSection={<IconSearch size={14} />}
        rightSection={
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label={text.closeSearch}
            onClick={closeSearch}
          >
            <IconX size={14} />
          </ActionIcon>
        }
        classNames={{ input: classes.ghostInput }}
      />
    ) : (
      <TextInput
        flex={1}
        miw={0}
        data-autofocus
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder={text.search}
        aria-label={text.search}
        leftSection={<IconSearch size={16} />}
      />
    );

  let header: React.ReactNode = null;
  if (withSearch === true) {
    header = (
      <Stack gap={6}>
        <Group gap="xs" wrap="nowrap">
          {searchField}
          {toolbar}
        </Group>
        {filterControl && <Group gap={4}>{filterControl}</Group>}
      </Stack>
    );
  } else if (withSearch === 'on-demand' && (searchOpen || query)) {
    header = (
      <Group gap={4} wrap="nowrap" className={classes.headerRow}>
        {searchField}
      </Group>
    );
  } else if (withSearch === 'on-demand' || filterControl || toolbar) {
    header = (
      <Group gap={4} wrap="nowrap" justify="space-between" className={classes.headerRow}>
        {filterControl || <span />}
        <Group gap={4} wrap="nowrap">
          {toolbar}
          {withSearch === 'on-demand' && (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label={text.openSearch}
              onClick={() => setSearchOpen(true)}
            >
              <IconSearch size={16} />
            </ActionIcon>
          )}
        </Group>
      </Group>
    );
  }

  return (
    <Stack gap="sm" className={className} style={style}>
      {header}
      <EntityList<SessionSummary>
        items={items}
        getId={(session) => session.id}
        renderItem={renderItem}
        selectedId={selectedId}
        onSelect={(session) => {
          if (rename?.id !== session.id) {
            onSelect?.(session);
          }
        }}
        loading={loading}
        error={error}
        onRetry={onRetry}
        labels={{ retry: text.retry, noResults: text.noResults }}
        ariaLabel={text.list}
        groupBy={query.trim() ? undefined : (session) => groupOf.get(session.id) ?? ''}
        groupOrder={groupOrder}
        empty={
          sessions.length === 0
            ? {
                title: text.emptyTitle,
                description: text.emptyDescription,
                icon: <IconMessages size={28} />,
              }
            : undefined
        }
      />

      <ConfirmDialog
        opened={deleteOpened}
        title={text.deleteTitle}
        message={deleteTarget && text.deleteMessage(deleteTarget.title)}
        labels={{ confirm: text.deleteConfirm, cancel: text.cancel }}
        danger
        onConfirm={async () => {
          if (deleteTarget && onDelete) {
            await onDelete(deleteTarget);
          }
        }}
        onClose={() => setDeleteOpened(false)}
      />
    </Stack>
  );
});

SessionList.displayName = 'SessionList';
