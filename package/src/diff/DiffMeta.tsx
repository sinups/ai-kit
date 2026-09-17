import React, { memo } from 'react';
import { Badge, Group, Text, Tooltip, type MantineColor, type MantineSize } from '@mantine/core';
import { IconFile } from '@tabler/icons-react';
import { FileExtIcon } from '../icons/FileExtIcon';
import type { DiffLabels, FileChangeStatus } from './types';

const STATUS_META: Record<FileChangeStatus, { letter: string; color: MantineColor }> = {
  added: { letter: 'A', color: 'green' },
  modified: { letter: 'M', color: 'yellow' },
  deleted: { letter: 'D', color: 'red' },
  renamed: { letter: 'R', color: 'violet' },
};

const UNTRACKED_META = { letter: 'U', color: 'teal' as MantineColor };

const BRAND_EXTENSIONS = new Set(['ts', 'tsx', 'js', 'mjs', 'cjs', 'jsx', 'json', 'jsonc']);

export function getFileStatusLabel(
  status: FileChangeStatus,
  labels: DiffLabels,
  untracked = false
): string {
  if (untracked) {
    return labels.statusUntracked;
  }
  switch (status) {
    case 'added':
      return labels.statusAdded;
    case 'modified':
      return labels.statusModified;
    case 'deleted':
      return labels.statusDeleted;
    case 'renamed':
      return labels.statusRenamed;
  }
}

export interface FileStatusBadgeProps {
  /** Kind of change */
  status: FileChangeStatus;
  /** Full status name shown in the tooltip and read by screen readers */
  label: string;
  /** Shows `U` in teal for an untracked file instead of the status letter */
  untracked?: boolean;
}

/** One-letter A/M/D/R badge colored by change status */
export const FileStatusBadge = memo(function FileStatusBadge({
  status,
  label,
  untracked = false,
}: FileStatusBadgeProps) {
  const meta = untracked ? UNTRACKED_META : STATUS_META[status];
  return (
    <Tooltip label={label} withArrow openDelay={300}>
      <Badge
        size="xs"
        radius="sm"
        variant="light"
        color={meta.color}
        aria-label={label}
        data-status={untracked ? 'untracked' : status}
      >
        {meta.letter}
      </Badge>
    </Tooltip>
  );
});

FileStatusBadge.displayName = 'FileStatusBadge';

export interface FileIconProps {
  /** File path or name */
  path: string;
  /** Icon size in px, `16` by default */
  size?: number;
}

/** Brand icon for known source extensions, a generic file icon otherwise */
export const FileIcon = memo(function FileIcon({ path, size = 16 }: FileIconProps) {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  if (BRAND_EXTENSIONS.has(extension)) {
    return <FileExtIcon filename={path} size={size} />;
  }
  return <IconFile size={size} color="var(--mantine-color-dimmed)" aria-hidden />;
});

FileIcon.displayName = 'FileIcon';

export interface DiffStatsProps {
  /** Added lines */
  additions: number;
  /** Removed lines */
  deletions: number;
  /** Text size, `xs` by default */
  size?: MantineSize;
}

/** `+N −M` line counts colored green and red */
export const DiffStats = memo(function DiffStats({
  additions,
  deletions,
  size = 'xs',
}: DiffStatsProps) {
  return (
    <Group gap={6} wrap="nowrap">
      <Text component="span" size={size} c="var(--ae-diff-added-text)" ff="monospace">
        +{additions}
      </Text>
      <Text component="span" size={size} c="var(--ae-diff-removed-text)" ff="monospace">
        −{deletions}
      </Text>
    </Group>
  );
});

DiffStats.displayName = 'DiffStats';
