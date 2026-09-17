import React, { memo, useState } from 'react';
import { Box, Button, Collapse, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconBookmark, IconChevronRight } from '@tabler/icons-react';
import { Markdown } from '../../Markdown/Markdown';
import { useAsyncAction } from '../use-async-action';
import { memoryPreview } from './memory-preview';
import classes from './MemoryNotice.module.css';

export interface MemoryNoticeLabels {
  saved: string;
  undone: string;
  open: string;
  undo: string;
  error: string;
}

const DEFAULT_LABELS: MemoryNoticeLabels = {
  saved: 'Saved to memory',
  undone: 'Removed from memory',
  open: 'Open',
  undo: 'Undo',
  error: 'Could not undo',
};

export interface MemoryNoticeProps {
  /** What was remembered, rendered as Markdown when expanded */
  content: string;
  /** Where the memory was saved, for example `AGENTS.md` */
  target?: string;
  /** Adds an open button, for example to show the memory file */
  onOpen?: () => void;
  /** Adds an undo button that removes the memory; the notice switches to the removed state when the promise resolves */
  onUndo?: () => void | Promise<void>;
  /** Initial expanded state, `false` by default */
  defaultExpanded?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<MemoryNoticeLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Feed row telling that the agent saved something to memory, expandable to the saved text */
export const MemoryNotice = memo(function MemoryNotice({
  content,
  target,
  onOpen,
  onUndo,
  defaultExpanded = false,
  labels: labelsProp,
  className,
  style,
}: MemoryNoticeProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [undone, setUndone] = useState(false);
  const { pendingKey, error, run } = useAsyncAction(labels.error);
  const title = undone ? labels.undone : labels.saved;

  return (
    <Stack gap={4} className={className} style={style} data-undone={undone || undefined}>
      <Group gap="xs" wrap="nowrap">
        <UnstyledButton
          className={classes.toggle}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <Group gap={8} wrap="nowrap" miw={0} preventGrowOverflow={false}>
            <IconBookmark size={12} className={classes.icon} aria-hidden />
            <Text component="span" size="sm" fw={500} truncate="end" className={classes.title}>
              {target ? `${title} · ${target}` : title}
            </Text>
            <Text component="span" size="sm" c="dimmed" truncate="end" className={classes.preview}>
              {memoryPreview(content)}
            </Text>
            <IconChevronRight
              size={12}
              className={classes.chevron}
              data-open={expanded || undefined}
              aria-hidden
            />
          </Group>
        </UnstyledButton>
        {!undone && (onOpen || onUndo) && (
          <Group gap={2} wrap="nowrap">
            {onOpen && (
              <Button size="compact-xs" variant="subtle" color="gray" onClick={onOpen}>
                {labels.open}
              </Button>
            )}
            {onUndo && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                loading={pendingKey !== null}
                onClick={async () => {
                  if (await run('undo', onUndo)) {
                    setUndone(true);
                  }
                }}
              >
                {labels.undo}
              </Button>
            )}
          </Group>
        )}
      </Group>
      {error && (
        <Text size="xs" c="var(--ae-danger)" role="alert">
          {error}
        </Text>
      )}
      <Collapse expanded={expanded} transitionDuration={150}>
        <Box className={classes.content}>
          <Markdown content={content} />
        </Box>
      </Collapse>
    </Stack>
  );
});

MemoryNotice.displayName = 'MemoryNotice';
