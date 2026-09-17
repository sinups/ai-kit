import React, { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Box, Mark, Modal, NavLink, ScrollArea, Stack, Text, TextInput, rem } from '@mantine/core';
import { useHotkeys, useMediaQuery } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { findEdgeEnabledIndex, findNextEnabledIndex } from '../EntityList/entity-list';
import { ShortcutHint } from '../ShortcutHint/ShortcutHint';
import { buildPaletteSections, type PaletteCommand } from './command-palette';
import { splitByIndices } from './fuzzy';
import classes from './CommandPalette.module.css';
import { OVERLAY_INNER_CLASS } from '../../styles/overlay';

export interface CommandPaletteLabels {
  /** Header of the recent commands section */
  recent: string;
  /** Accessible label of the search input */
  search: string;
  /** Accessible label of the results list */
  results: string;
}

export interface CommandPaletteProps {
  /** Whether the palette is open */
  opened: boolean;
  /** Called when the palette should close: Escape, outside click or after running a command */
  onClose: () => void;
  /** Commands to search and run */
  commands: PaletteCommand[];
  /** Called with the command that runs, after its own `onSelect` */
  onSelect?: (command: PaletteCommand) => void;
  /** Search input placeholder, `Search commands...` by default */
  placeholder?: string;
  /** Ids of recently used commands, listed first while the query is empty */
  recentIds?: string[];
  /** Text shown when nothing matches, `No commands found` by default */
  emptyLabel?: React.ReactNode;
  /** Hotkey that toggles the palette, for example `mod+K`; registered whenever set: it calls `onOpen` while closed and `onClose` while open, so without `onOpen` it can only close the palette */
  hotkey?: string;
  /** Called when the hotkey is pressed while the palette is closed; set `opened` to `true` here */
  onOpen?: () => void;
  /** Maximum height of the results list, `400` by default */
  maxHeight?: number | string;
  /** Overrides of the default English labels */
  labels?: Partial<CommandPaletteLabels>;
}

const DEFAULT_LABELS: CommandPaletteLabels = {
  recent: 'Recent',
  search: 'Search commands',
  results: 'Commands',
};

function HighlightedLabel({ text, indices }: { text: string; indices: number[] }) {
  return (
    <>
      {splitByIndices(text, indices).map((part, index) =>
        part.highlighted ? (
          <Mark key={index} className={classes.mark}>
            {part.text}
          </Mark>
        ) : (
          <React.Fragment key={index}>{part.text}</React.Fragment>
        )
      )}
    </>
  );
}

export const CommandPalette = memo(function CommandPalette({
  opened,
  onClose,
  commands,
  onSelect,
  placeholder = 'Search commands...',
  recentIds,
  emptyLabel = 'No commands found',
  hotkey,
  onOpen,
  maxHeight = 400,
  labels,
}: CommandPaletteProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const baseId = useId();
  const listId = `${baseId}-list`;
  const fullScreen = useMediaQuery('(max-width: 36em)') ?? false;
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const viewportRef = useRef<HTMLDivElement>(null);

  const toggleRef = useRef({ opened, onOpen, onClose });
  toggleRef.current = { opened, onOpen, onClose };
  useHotkeys(
    hotkey
      ? [
          [
            hotkey,
            () => {
              const current = toggleRef.current;
              if (current.opened) {
                current.onClose();
              } else {
                current.onOpen?.();
              }
            },
            { preventDefault: true },
          ],
        ]
      : [],
    []
  );

  const sections = useMemo(
    () => buildPaletteSections(commands, query, recentIds, text.recent),
    [commands, query, recentIds, text.recent]
  );
  const entries = useMemo(() => sections.flatMap((section) => section.entries), [sections]);
  const disabled = useMemo(() => entries.map((entry) => !!entry.command.disabled), [entries]);

  useEffect(() => {
    setActiveIndex(findEdgeEnabledIndex(disabled, 'first'));
  }, [disabled]);

  useEffect(() => {
    if (!opened) {
      setQuery('');
    }
  }, [opened]);

  const optionId = (index: number) => `${baseId}-option-${index}`;

  useEffect(() => {
    if (activeIndex === -1) {
      return;
    }
    viewportRef.current
      ?.querySelector(`[id="${optionId(activeIndex)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const run = (command: PaletteCommand) => {
    if (command.disabled) {
      return;
    }
    command.onSelect?.();
    onSelect?.(command);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) =>
          index === -1
            ? findEdgeEnabledIndex(disabled, 'first')
            : findNextEnabledIndex(disabled, index, 1)
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) =>
          index === -1
            ? findEdgeEnabledIndex(disabled, 'last')
            : findNextEnabledIndex(disabled, index, -1)
        );
        break;
      case 'Enter':
        if (!event.nativeEvent.isComposing) {
          event.preventDefault();
          if (activeIndex !== -1 && entries[activeIndex]) {
            run(entries[activeIndex].command);
          }
        }
        break;
    }
  };

  let flatIndex = 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size="lg"
      fullScreen={fullScreen}
      padding={0}
      classNames={{ inner: OVERLAY_INNER_CLASS, body: classes.body, content: classes.content }}
    >
      <TextInput
        data-autofocus
        size="sm"
        variant="unstyled"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        leftSection={<IconSearch size={16} />}
        role="combobox"
        tabIndex={0}
        aria-label={text.search}
        aria-expanded
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex === -1 ? undefined : optionId(activeIndex)}
        classNames={{ root: classes.search, input: classes.searchInput }}
      />
      <ScrollArea.Autosize
        mah={fullScreen ? undefined : maxHeight}
        viewportRef={viewportRef}
        className={classes.scroll}
        type="auto"
      >
        {entries.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl" px="md">
            {emptyLabel}
          </Text>
        ) : (
          <Stack id={listId} role="listbox" aria-label={text.results} gap={2} p={rem(6)}>
            {sections.map((section, sectionIndex) => {
              const labelId = `${baseId}-section-${sectionIndex}`;
              return (
                <Stack
                  key={section.key}
                  gap={2}
                  role="group"
                  aria-labelledby={section.label ? labelId : undefined}
                >
                  {section.label && (
                    <Text id={labelId} size="xs" fw={500} c="dimmed" px="sm" pt="xs" pb={2}>
                      {section.label}
                    </Text>
                  )}
                  {section.entries.map((entry) => {
                    const index = flatIndex++;
                    const { command } = entry;
                    const active = index === activeIndex;
                    return (
                      <NavLink
                        key={entry.key}
                        component="div"
                        id={optionId(index)}
                        role="option"
                        aria-selected={active}
                        aria-disabled={command.disabled || undefined}
                        active={active}
                        disabled={command.disabled}
                        variant="light"
                        className={classes.option}
                        leftSection={command.icon}
                        rightSection={
                          command.shortcut ? (
                            <Box component="span" aria-hidden>
                              <ShortcutHint keys={command.shortcut} />
                            </Box>
                          ) : undefined
                        }
                        disableRightSectionRotation
                        label={
                          <HighlightedLabel text={command.label} indices={entry.labelIndices} />
                        }
                        description={
                          command.description ? (
                            <Text component="span" size="xs" c="dimmed" truncate="end">
                              {command.description}
                            </Text>
                          ) : undefined
                        }
                        onMouseDown={(event: React.MouseEvent) => event.preventDefault()}
                        onMouseMove={() => {
                          if (!active && !command.disabled) {
                            setActiveIndex(index);
                          }
                        }}
                        onClick={() => run(command)}
                      />
                    );
                  })}
                </Stack>
              );
            })}
          </Stack>
        )}
      </ScrollArea.Autosize>
    </Modal>
  );
});
