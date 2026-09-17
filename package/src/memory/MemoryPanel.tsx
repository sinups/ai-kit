import React, { memo, useCallback, useMemo, useState } from 'react';
import { Button, EmptyState } from '@mantine/core';
import {
  IconBrain,
  IconFileText,
  IconFolderOpen,
  IconPencil,
  IconPlus,
  IconRobot,
} from '@tabler/icons-react';
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog';
import { EntityList } from '../primitives/EntityList/EntityList';
import { EntityListItem, type EntityListItemAction } from '../primitives/EntityList/EntityListItem';
import { MasterDetail } from '../primitives/MasterDetail/MasterDetail';
import {
  formatMemoryUpdatedAt,
  getMemoryFileName,
  matchesMemoryQuery,
  MEMORY_SCOPE_LABELS,
  MEMORY_SCOPE_ORDER,
  sortMemoryFiles,
} from './memory-files';
import { MemoryFileDetail, type MemoryFileDetailLabels } from './MemoryFileDetail';
import type { MemoryFile, MemoryScope } from './types';
import classes from './Memory.module.css';

export interface MemoryPanelLabels {
  list: string;
  search: string;
  noResults: string;
  emptyTitle: string;
  emptyDescription: string;
  retry: string;
  create: string;
  actions: string;
  edit: string;
  openLocation: string;
  back: string;
  discardTitle: string;
  discardMessage: string;
  discard: string;
  keepEditing: string;
  /** Shown in the detail pane when wide and no file is selected */
  noSelection: string;
  noSelectionDescription: string;
  scopes: Record<MemoryScope, string>;
  /** Labels of the file view */
  detail: Partial<MemoryFileDetailLabels>;
}

export const DEFAULT_MEMORY_PANEL_LABELS: MemoryPanelLabels = {
  list: 'Memory files',
  search: 'Search memory',
  noResults: 'No memory files match',
  emptyTitle: 'No memory files',
  emptyDescription: 'Instructions and facts the agent remembers appear here',
  retry: 'Retry',
  create: 'New file',
  actions: 'File actions',
  edit: 'Edit',
  openLocation: 'Open location',
  back: 'Memory',
  discardTitle: 'Discard changes?',
  discardMessage: 'Your edits to this memory file will be lost.',
  discard: 'Discard',
  noSelection: 'Select a memory file',
  noSelectionDescription: 'Its instructions appear here',
  keepEditing: 'Keep editing',
  scopes: MEMORY_SCOPE_LABELS,
  detail: {},
};

export interface MemoryPanelProps {
  /** Memory files of all scopes */
  files: MemoryFile[];
  /** Shows skeleton rows in the list */
  loading?: boolean;
  /** Error message shown instead of the list */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetry?: () => void;
  /** Selected file id, uncontrolled when omitted; set it to open a file, for example from a "Saved to memory" notice */
  selectedId?: string | null;
  /** Called when the selected file changes */
  onSelectedIdChange?: (id: string | null) => void;
  /** Saves edited content, Edit is available only when set; a rejection keeps the editor open with the message */
  onSave?: (file: MemoryFile, content: string) => void | Promise<void>;
  /** Shows Open location for each file, for example to reveal it in the file manager or editor */
  onOpenLocation?: (file: MemoryFile) => void;
  /** Shows a New file button */
  onCreate?: () => void;
  /** Component width in px from which list and detail sit side by side, `720` by default */
  breakpoint?: number;
  /** List pane width in px when wide, `340` by default */
  listWidth?: number;
  /** Current time used for relative update times, `Date.now()` by default */
  now?: number;
  /** Locale of relative update times, `en` by default */
  locale?: string;
  /** Overrides of the default English labels of the panel */
  labels?: Partial<MemoryPanelLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element, give the panel a height */
  style?: React.CSSProperties;
}

/** Memory files by scope with a Markdown preview and an inline editor, side by side when wide */
export const MemoryPanel = memo(function MemoryPanel({
  files,
  loading,
  error,
  onRetry,
  selectedId: selectedIdProp,
  onSelectedIdChange,
  onSave,
  onOpenLocation,
  onCreate,
  breakpoint,
  listWidth = 340,
  now,
  locale = 'en',
  labels,
  className,
  style,
}: MemoryPanelProps) {
  const text = { ...DEFAULT_MEMORY_PANEL_LABELS, ...labels };
  const [selectedIdState, setSelectedIdState] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [query, setQuery] = useState('');

  const selectedId = selectedIdProp !== undefined ? selectedIdProp : selectedIdState;
  const sorted = useMemo(() => sortMemoryFiles(files), [files]);
  const selected = files.find((file) => file.id === selectedId) ?? null;
  const editing = selected !== null && editingId === selected.id;
  const currentTime = now ?? Date.now();

  const select = (id: string | null) => {
    setSelectedIdState(id);
    onSelectedIdChange?.(id);
  };

  const closeEditor = () => {
    setDirty(false);
    setEditingId(null);
  };

  const leaveEditor = (action: () => void) => {
    if (editingId !== null && dirty) {
      setPendingLeave(() => action);
      return;
    }
    action();
  };

  const handleDirtyChange = useCallback((value: boolean) => setDirty(value), []);

  const startEdit = (file: MemoryFile) =>
    leaveEditor(() => {
      closeEditor();
      select(file.id);
      setEditingId(file.id);
    });

  const actionsFor = (file: MemoryFile): EntityListItemAction[] => [
    ...(onSave
      ? [{ label: text.edit, icon: <IconPencil size={14} />, onClick: () => startEdit(file) }]
      : []),
    ...(onOpenLocation
      ? [
          {
            label: text.openLocation,
            icon: <IconFolderOpen size={14} />,
            onClick: () => onOpenLocation(file),
          },
        ]
      : []),
  ];

  const scopeGroup = (file: MemoryFile) => text.scopes[file.scope];

  return (
    <>
      <MasterDetail
        className={className}
        style={style}
        breakpoint={breakpoint}
        listWidth={listWidth}
        labels={{ back: text.back }}
        emptyDetail={
          <EmptyState
            h="100%"
            p="xl"
            icon={<IconBrain />}
            title={text.noSelection}
            description={text.noSelectionDescription}
          />
        }
        onBack={() =>
          leaveEditor(() => {
            closeEditor();
            select(null);
          })
        }
        detail={
          selected ? (
            <MemoryFileDetail
              key={`${selected.id}:${editing ? 'edit' : 'view'}`}
              file={selected}
              editing={editing}
              onEdit={onSave ? startEdit : undefined}
              onCancelEdit={closeEditor}
              onSave={onSave}
              onSaved={closeEditor}
              onDirtyChange={handleDirtyChange}
              onOpenLocation={onOpenLocation}
              now={currentTime}
              locale={locale}
              labels={text.detail}
            />
          ) : null
        }
        list={
          <EntityList<MemoryFile>
            className={classes.list}
            items={sorted}
            getId={(file) => file.id}
            loading={loading}
            error={error}
            onRetry={onRetry}
            labels={{ retry: text.retry, noResults: text.noResults }}
            ariaLabel={text.list}
            selectedId={selectedId}
            onSelect={(file) => {
              if (file.id === editingId) {
                return;
              }
              leaveEditor(() => {
                closeEditor();
                select(file.id);
              });
            }}
            search={
              files.length > 0
                ? {
                    value: query,
                    onChange: setQuery,
                    placeholder: text.search,
                    filter: matchesMemoryQuery,
                  }
                : undefined
            }
            groupBy={scopeGroup}
            groupOrder={MEMORY_SCOPE_ORDER.map((scope) => text.scopes[scope])}
            empty={{
              title: text.emptyTitle,
              description: text.emptyDescription,
              icon: <IconBrain />,
              action: onCreate ? (
                <Button size="xs" leftSection={<IconPlus size={14} />} onClick={onCreate}>
                  {text.create}
                </Button>
              ) : undefined,
            }}
            toolbar={
              onCreate && files.length > 0 ? (
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconPlus size={14} />}
                  onClick={onCreate}
                >
                  {text.create}
                </Button>
              ) : undefined
            }
            renderItem={(file, { selected: isSelected }) => (
              <EntityListItem
                title={getMemoryFileName(file.path)}
                description={file.agentName ? `${file.agentName} · ${file.path}` : file.path}
                descriptionLines={1}
                icon={file.scope === 'agent' ? <IconRobot size={18} /> : <IconFileText size={18} />}
                meta={formatMemoryUpdatedAt(file.updatedAt, currentTime, locale) ?? undefined}
                actions={actionsFor(file)}
                labels={{ actions: `${text.actions}: ${file.path}` }}
                selected={isSelected}
              />
            )}
          />
        }
      />
      <ConfirmDialog
        opened={pendingLeave !== null}
        title={text.discardTitle}
        message={text.discardMessage}
        labels={{ confirm: text.discard, cancel: text.keepEditing }}
        danger
        onConfirm={() => {
          closeEditor();
          pendingLeave?.();
        }}
        onClose={() => setPendingLeave(null)}
      />
    </>
  );
});

MemoryPanel.displayName = 'MemoryPanel';
