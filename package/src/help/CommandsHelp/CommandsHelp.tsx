import React, { memo, useState } from 'react';
import {
  Box,
  CloseButton,
  Code,
  EmptyState,
  Group,
  NavLink,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { IconKeyboard, IconSearch, IconSlash } from '@tabler/icons-react';
import { ShortcutHint } from '../../primitives/ShortcutHint/ShortcutHint';
import { useFuzzySearch } from '../../primitives/CommandPalette/use-fuzzy-search';
import {
  COMMAND_SEARCH_KEYS,
  formatCommandUsage,
  groupHelpItems,
  SHORTCUT_SEARCH_KEYS,
} from '../commands-help';
import type { CommandHelpItem, ShortcutHelpItem } from '../types';

export interface CommandsHelpLabels {
  commands: string;
  shortcuts: string;
  search: string;
  noResults: string;
  noResultsDescription: string;
  clearSearch: string;
}

const DEFAULT_LABELS: CommandsHelpLabels = {
  commands: 'Commands',
  shortcuts: 'Shortcuts',
  search: 'Search commands and shortcuts',
  noResults: 'Nothing found',
  noResultsDescription: 'Try a different word',
  clearSearch: 'Clear search',
};

type HelpTab = 'commands' | 'shortcuts';

export interface CommandsHelpProps {
  /** Slash commands */
  commands: CommandHelpItem[];
  /** Keyboard shortcuts, the tabs are hidden when there are none */
  shortcuts?: ShortcutHelpItem[];
  /** Makes commands clickable, for example to insert `/name ` into the composer */
  onCommandSelect?: (command: CommandHelpItem) => void;
  /** Tab shown first, `commands` by default */
  defaultTab?: HelpTab;
  /** Overrides of the default English labels */
  labels?: Partial<CommandsHelpLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={500} c="dimmed" px="sm">
      {children}
    </Text>
  );
}

function CommandBody({ command }: { command: CommandHelpItem }) {
  return (
    <Stack gap={2} miw={0}>
      <Group gap="xs" wrap="wrap">
        <Code>{formatCommandUsage(command)}</Code>
        {command.shortcut && <ShortcutHint keys={command.shortcut} />}
      </Group>
      <Text size="sm" c="dimmed">
        {command.description}
      </Text>
    </Stack>
  );
}

/** Reference of slash commands and keyboard shortcuts with fuzzy search and groups */
export const CommandsHelp = memo(function CommandsHelp({
  commands,
  shortcuts = [],
  onCommandSelect,
  defaultTab = 'commands',
  labels: labelsProp,
  className,
  style,
}: CommandsHelpProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<HelpTab>(defaultTab);
  const commandResults = useFuzzySearch({ items: commands, keys: COMMAND_SEARCH_KEYS, query });
  const shortcutResults = useFuzzySearch({ items: shortcuts, keys: SHORTCUT_SEARCH_KEYS, query });
  const isSearching = query.trim().length > 0;

  const noResults = (
    <EmptyState
      size="sm"
      py="lg"
      icon={<IconSearch size={24} />}
      title={labels.noResults}
      description={labels.noResultsDescription}
    />
  );

  const commandItems = commandResults.map((result) => result.item);
  const commandList =
    commandItems.length === 0 ? (
      noResults
    ) : (
      <Stack gap="md">
        {(isSearching
          ? [{ group: undefined, items: commandItems }]
          : groupHelpItems(commandItems)
        ).map(({ group, items }) => (
          <Stack key={group ?? ''} gap={0} role="group" aria-label={group}>
            {group && <GroupTitle>{group}</GroupTitle>}
            {items.map((command) =>
              onCommandSelect ? (
                <NavLink
                  key={command.name}
                  component="button"
                  type="button"
                  label={<CommandBody command={command} />}
                  onClick={() => onCommandSelect(command)}
                />
              ) : (
                <Box key={command.name} px="sm" py={6}>
                  <CommandBody command={command} />
                </Box>
              )
            )}
          </Stack>
        ))}
      </Stack>
    );

  const shortcutItems = shortcutResults.map((result) => result.item);
  const shortcutList =
    shortcutItems.length === 0 ? (
      noResults
    ) : (
      <Stack gap="md">
        {(isSearching
          ? [{ group: undefined, items: shortcutItems }]
          : groupHelpItems(shortcutItems)
        ).map(({ group, items }) => (
          <Stack key={group ?? ''} gap={0} role="group" aria-label={group}>
            {group && <GroupTitle>{group}</GroupTitle>}
            {items.map((shortcut, index) => (
              <Group
                key={`${shortcut.description}-${index}`}
                justify="space-between"
                wrap="nowrap"
                gap="sm"
                px="sm"
                py={6}
              >
                <Text size="sm" miw={0}>
                  {shortcut.description}
                </Text>
                <ShortcutHint keys={shortcut.keys} />
              </Group>
            ))}
          </Stack>
        ))}
      </Stack>
    );

  const search = (
    <TextInput
      aria-label={labels.search}
      placeholder={labels.search}
      value={query}
      leftSection={<IconSearch size={16} />}
      rightSection={
        query ? (
          <CloseButton size="sm" aria-label={labels.clearSearch} onClick={() => setQuery('')} />
        ) : undefined
      }
      onChange={(event) => setQuery(event.currentTarget.value)}
    />
  );

  if (shortcuts.length === 0) {
    return (
      <Stack gap="sm" className={className} style={style}>
        {search}
        {commandList}
      </Stack>
    );
  }

  return (
    <Stack gap="sm" className={className} style={style}>
      {search}
      <Tabs value={tab} onChange={(value) => value && setTab(value as HelpTab)}>
        <Tabs.List>
          <Tabs.Tab value="commands" leftSection={<IconSlash size={14} />}>
            {labels.commands} ({commandItems.length})
          </Tabs.Tab>
          <Tabs.Tab value="shortcuts" leftSection={<IconKeyboard size={14} />}>
            {labels.shortcuts} ({shortcutItems.length})
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="commands" pt="xs">
          {commandList}
        </Tabs.Panel>
        <Tabs.Panel value="shortcuts" pt="xs">
          {shortcutList}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
});

CommandsHelp.displayName = 'CommandsHelp';
