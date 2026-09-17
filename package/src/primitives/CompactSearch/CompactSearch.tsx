import React, { memo } from 'react';
import { ActionIcon, TextInput } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';

export interface CompactSearchLabels {
  /** Placeholder and accessible name of the field and the search button, `Search` by default */
  search: string;
  /** Accessible name of the close button, `Close search` by default */
  close: string;
}

export const DEFAULT_COMPACT_SEARCH_LABELS: CompactSearchLabels = {
  search: 'Search',
  close: 'Close search',
};

export interface CompactSearchProps {
  /** Whether the field is shown instead of the search button */
  opened: boolean;
  /** Called by the search button */
  onOpen: () => void;
  /** Called by the close button and Escape, the query should be cleared by the caller */
  onClose: () => void;
  /** Search query */
  value: string;
  /** Called when the query changes */
  onChange: (value: string) => void;
  /** Overrides of the default English labels */
  labels?: Partial<CompactSearchLabels>;
}

/** Borderless toolbar search behind an icon button, closed with Escape or the close button */
export const CompactSearch = memo(function CompactSearch({
  opened,
  onOpen,
  onClose,
  value,
  onChange,
  labels: labelsProp,
}: CompactSearchProps) {
  const labels = { ...DEFAULT_COMPACT_SEARCH_LABELS, ...labelsProp };
  if (!opened) {
    return (
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        aria-label={labels.search}
        onClick={onOpen}
      >
        <IconSearch size={14} />
      </ActionIcon>
    );
  }
  return (
    <>
      <TextInput
        flex={1}
        miw={0}
        size="xs"
        variant="unstyled"
        autoFocus
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onClose();
          }
        }}
        placeholder={labels.search}
        aria-label={labels.search}
        leftSection={<IconSearch size={14} />}
      />
      <ActionIcon
        variant="subtle"
        color="gray"
        size="sm"
        aria-label={labels.close}
        onClick={onClose}
      >
        <IconX size={14} />
      </ActionIcon>
    </>
  );
});

CompactSearch.displayName = 'CompactSearch';
