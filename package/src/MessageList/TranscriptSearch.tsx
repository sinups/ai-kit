import React, { memo } from 'react';
import { ActionIcon, CloseButton, Group, Paper, Text, TextInput } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconSearch } from '@tabler/icons-react';

export interface TranscriptSearchLabels {
  input: string;
  placeholder: string;
  previous: string;
  next: string;
  close: string;
  noResults: string;
}

const DEFAULT_LABELS: TranscriptSearchLabels = {
  input: 'Search conversation',
  placeholder: 'Search conversation',
  previous: 'Previous match',
  next: 'Next match',
  close: 'Close search',
  noResults: '0/0',
};

export interface TranscriptSearchProps {
  /** Search query */
  value: string;
  /** Called with the new query */
  onChange: (value: string) => void;
  /** Index of the active match, `-1` when there is none */
  activeIndex: number;
  /** Number of matches */
  total: number;
  /** Moves to the next match, also on Enter */
  onNext: () => void;
  /** Moves to the previous match, also on Shift+Enter */
  onPrevious: () => void;
  /** Closes the search, also on Escape */
  onClose: () => void;
  /** Ref of the input, for focusing it from a shortcut */
  inputRef?: React.Ref<HTMLInputElement>;
  /** Overrides of the default English labels */
  labels?: Partial<TranscriptSearchLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Find bar for a conversation: query, `3/12` counter, previous and next match */
export const TranscriptSearch = memo(function TranscriptSearch({
  value,
  onChange,
  activeIndex,
  total,
  onNext,
  onPrevious,
  onClose,
  inputRef,
  labels: labelsProp,
  className,
  style,
}: TranscriptSearchProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const hasQuery = value.trim().length > 0;

  return (
    <Paper
      withBorder
      shadow="sm"
      radius="md"
      p={4}
      className={className}
      style={style}
      role="search"
      data-search-ignore
    >
      <Group gap={4} wrap="nowrap">
        <TextInput
          ref={inputRef}
          flex={1}
          miw={0}
          size="xs"
          variant="unstyled"
          aria-label={labels.input}
          placeholder={labels.placeholder}
          value={value}
          autoFocus
          leftSection={<IconSearch size={14} />}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              onClose();
            } else if (event.key === 'Enter') {
              event.preventDefault();
              if (event.shiftKey) {
                onPrevious();
              } else {
                onNext();
              }
            }
          }}
        />
        {hasQuery && (
          <Text size="xs" c="dimmed" aria-live="polite" px={4}>
            {total > 0 ? `${activeIndex + 1}/${total}` : labels.noResults}
          </Text>
        )}
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label={labels.previous}
          disabled={total === 0}
          onClick={onPrevious}
        >
          <IconChevronUp size={14} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label={labels.next}
          disabled={total === 0}
          onClick={onNext}
        >
          <IconChevronDown size={14} />
        </ActionIcon>
        <CloseButton size="sm" aria-label={labels.close} onClick={onClose} />
      </Group>
    </Paper>
  );
});

TranscriptSearch.displayName = 'TranscriptSearch';
