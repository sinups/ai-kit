import React, { memo, useEffect, useState } from 'react';
import { Alert, Badge, Button, Divider, Group, Stack, Text, Textarea, Title } from '@mantine/core';
import {
  IconAlertCircle,
  IconDeviceFloppy,
  IconFileText,
  IconFolderOpen,
  IconPencil,
  IconRobot,
} from '@tabler/icons-react';
import { usePendingActions } from '../hooks/use-pending-actions';
import { Markdown } from '../Markdown/Markdown';
import { cx } from '../utils/cx';
import { formatMemoryUpdatedAt, getMemoryFileName, MEMORY_SCOPE_LABELS } from './memory-files';
import type { MemoryFile, MemoryScope } from './types';
import classes from './Memory.module.css';

export interface MemoryFileDetailLabels {
  edit: string;
  save: string;
  cancel: string;
  openLocation: string;
  updated: string;
  content: string;
  emptyContent: string;
  saveError: string;
  scopes: Record<MemoryScope, string>;
}

export const DEFAULT_MEMORY_FILE_DETAIL_LABELS: MemoryFileDetailLabels = {
  edit: 'Edit',
  save: 'Save',
  cancel: 'Cancel',
  openLocation: 'Open location',
  updated: 'Updated',
  content: 'Content',
  emptyContent: 'This file is empty.',
  saveError: 'Could not save the file',
  scopes: MEMORY_SCOPE_LABELS,
};

export interface MemoryFileDetailProps {
  /** File to show */
  file: MemoryFile;
  /** Renders the editor instead of the rendered Markdown; the editor starts from `file.content` when it mounts */
  editing?: boolean;
  /** Opens the editor, the Edit button is shown only when set together with `onSave` */
  onEdit?: (file: MemoryFile) => void;
  /** Closes the editor without saving */
  onCancelEdit?: () => void;
  /** Saves the edited content; the editor stays open and shows the rejection message when the promise rejects */
  onSave?: (file: MemoryFile, content: string) => void | Promise<void>;
  /** Called after a successful save */
  onSaved?: () => void;
  /** Reports whether the editor holds unsaved changes */
  onDirtyChange?: (dirty: boolean) => void;
  /** Shows the Open location button */
  onOpenLocation?: (file: MemoryFile) => void;
  /** Current time used for the relative update time, `Date.now()` by default */
  now?: number;
  /** Locale of the relative update time, `en` by default */
  locale?: string;
  /** Overrides of the default English labels */
  labels?: Partial<MemoryFileDetailLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** One memory file: name, scope, path and Markdown content, with an inline editor */
export const MemoryFileDetail = memo(function MemoryFileDetail({
  file,
  editing = false,
  onEdit,
  onCancelEdit,
  onSave,
  onSaved,
  onDirtyChange,
  onOpenLocation,
  now,
  locale = 'en',
  labels,
  className,
  style,
}: MemoryFileDetailProps) {
  const text = { ...DEFAULT_MEMORY_FILE_DETAIL_LABELS, ...labels };
  const [draft, setDraft] = useState(file.content);
  const actions = usePendingActions(text.saveError);
  const saving = actions.isPending('save');
  const dirty = editing && draft !== file.content;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const save = () =>
    actions.run('save', async () => {
      await onSave?.(file, draft);
      onSaved?.();
    });

  const updated = formatMemoryUpdatedAt(file.updatedAt, now ?? Date.now(), locale);
  const FileIcon = file.scope === 'agent' ? IconRobot : IconFileText;

  return (
    <Stack gap="md" p="md" className={cx(classes.content, className)} style={style}>
      <Stack gap="xs">
        <Group gap="sm" wrap="nowrap" align="flex-start" justify="space-between">
          <Group gap="xs" wrap="nowrap" miw={0}>
            <FileIcon size={20} className={classes.icon} />
            <Title order={3} size="h4" className={classes.title}>
              {getMemoryFileName(file.path)}
            </Title>
          </Group>
          <Badge variant="light" color="gray" className={classes.badge}>
            {file.agentName
              ? `${text.scopes[file.scope]} · ${file.agentName}`
              : text.scopes[file.scope]}
          </Badge>
        </Group>
        <Text size="xs" ff="monospace" c="dimmed" className={classes.path}>
          {file.path}
        </Text>
        {updated && (
          <Text size="xs" c="dimmed">
            {text.updated} {updated}
          </Text>
        )}
        {!editing && ((onEdit && onSave) || onOpenLocation) && (
          <Group gap="xs">
            {onEdit && onSave && (
              <Button size="xs" leftSection={<IconPencil size={14} />} onClick={() => onEdit(file)}>
                {text.edit}
              </Button>
            )}
            {onOpenLocation && (
              <Button
                size="xs"
                variant="default"
                leftSection={<IconFolderOpen size={14} />}
                onClick={() => onOpenLocation(file)}
              >
                {text.openLocation}
              </Button>
            )}
          </Group>
        )}
      </Stack>

      <Divider />

      {editing ? (
        <Stack gap="sm">
          <Textarea
            label={text.content}
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            autosize
            minRows={10}
            disabled={saving}
            classNames={{ input: classes.editorInput }}
          />
          {actions.error && (
            <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
              {actions.error}
            </Alert>
          )}
          <Group gap="xs" justify="flex-end">
            <Button size="xs" variant="default" onClick={onCancelEdit} disabled={saving}>
              {text.cancel}
            </Button>
            <Button
              size="xs"
              leftSection={<IconDeviceFloppy size={14} />}
              loading={saving}
              disabled={!dirty}
              onClick={save}
            >
              {text.save}
            </Button>
          </Group>
        </Stack>
      ) : file.content.trim() ? (
        <Markdown content={file.content} />
      ) : (
        <Text size="sm" c="dimmed">
          {text.emptyContent}
        </Text>
      )}
    </Stack>
  );
});

MemoryFileDetail.displayName = 'MemoryFileDetail';
