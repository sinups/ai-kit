import React, { memo } from 'react';
import { ActionIcon, TextInput } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';

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
  /** Placeholder and accessible name of the field and the search button */
  label: string;
  /** Accessible name of the close button */
  closeLabel: string;
}

/** Borderless toolbar search behind an icon button, closed with Escape or the close button */
export const CompactSearch = memo(function CompactSearch({
  opened,
  onOpen,
  onClose,
  value,
  onChange,
  label,
  closeLabel,
}: CompactSearchProps) {
  if (!opened) {
    return (
      <ActionIcon variant="subtle" color="gray" size="sm" aria-label={label} onClick={onOpen}>
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
        placeholder={label}
        aria-label={label}
        leftSection={<IconSearch size={14} />}
      />
      <ActionIcon variant="subtle" color="gray" size="sm" aria-label={closeLabel} onClick={onClose}>
        <IconX size={14} />
      </ActionIcon>
    </>
  );
});

CompactSearch.displayName = 'CompactSearch';
