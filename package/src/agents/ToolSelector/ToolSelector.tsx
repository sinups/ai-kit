import React, { memo, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Checkbox,
  Collapse,
  EmptyState,
  Group,
  Input,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconChevronDown, IconSearch, IconTool } from '@tabler/icons-react';
import {
  getGroupCheckState,
  groupToolCatalog,
  searchToolCatalog,
  toggleTool,
  toggleToolGroup,
  type ToolGroup,
} from '../tool-selection';
import type { AgentToolSelection, ToolCatalogItem } from '../types';
import classes from './ToolSelector.module.css';
import { fillTemplate } from '../../utils/fill-template';

export interface ToolSelectorLabels {
  all: string;
  selected: string;
  allDescription: string;
  search: string;
  /** `{selected}` and `{total}` are replaced */
  counter: string;
  readOnly: string;
  destructive: string;
  expandGroup: string;
  collapseGroup: string;
  noResults: string;
  emptyTitle: string;
  emptyDescription: string;
}

export interface ToolSelectorProps {
  /** Tools that can be picked */
  catalog: ToolCatalogItem[];
  /** `all` or the selected tool names */
  value: AgentToolSelection;
  /** Called with the next selection */
  onChange: (value: AgentToolSelection) => void;
  /** Label above the control */
  label?: React.ReactNode;
  /** Description under the label */
  description?: React.ReactNode;
  /** Validation message */
  error?: React.ReactNode;
  /** Disables every control */
  disabled?: boolean;
  /** Groups collapsed on the first render, all groups are expanded by default */
  defaultCollapsedGroups?: string[];
  /** Overrides of the default English labels */
  labels?: Partial<ToolSelectorLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const DEFAULT_TOOL_SELECTOR_LABELS: ToolSelectorLabels = {
  all: 'All tools',
  selected: 'Selected',
  allDescription: 'The agent can call every tool, including tools connected later',
  search: 'Search tools',
  counter: '{selected} of {total} selected',
  readOnly: 'read-only',
  destructive: 'destructive',
  expandGroup: 'Expand group',
  collapseGroup: 'Collapse group',
  noResults: 'No tools match the search',
  emptyTitle: 'No tools available',
  emptyDescription: 'Connect an MCP server to give agents more tools',
};

interface GroupBlockProps {
  group: ToolGroup;
  selected: string[];
  all: boolean;
  disabled: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onChange: (value: string[]) => void;
  labels: ToolSelectorLabels;
}

const ToolGroupSection = memo(function ToolGroupSection({
  group,
  selected,
  all,
  disabled,
  expanded,
  onToggleExpanded,
  onChange,
  labels,
}: GroupBlockProps) {
  const state = all ? 'checked' : getGroupCheckState(group.tools, selected);
  const count = all
    ? group.tools.length
    : group.tools.filter((tool) => selected.includes(tool.name)).length;

  return (
    <Box data-group={group.name}>
      <Group gap="xs" wrap="nowrap" className={classes.groupHeader}>
        <Checkbox
          flex={1}
          miw={0}
          label={
            <Text component="span" size="sm" fw={500} truncate>
              {group.name}
            </Text>
          }
          checked={state === 'checked'}
          indeterminate={state === 'indeterminate'}
          disabled={disabled || all}
          classNames={{ body: classes.checkboxBody, labelWrapper: classes.labelWrapper }}
          onChange={(event) =>
            onChange(toggleToolGroup(selected, group.tools, event.currentTarget.checked))
          }
        />
        <Badge size="sm" variant="light" color="gray">
          {count}/{group.tools.length}
        </Badge>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label={expanded ? labels.collapseGroup : labels.expandGroup}
          aria-expanded={expanded}
          onClick={onToggleExpanded}
        >
          <IconChevronDown size={16} className={classes.chevron} data-expanded={expanded} />
        </ActionIcon>
      </Group>
      <Collapse expanded={expanded}>
        <Box className={classes.toolsContainer}>
          <Box className={classes.tools}>
            {group.tools.map((tool) => (
              <Checkbox
                key={tool.name}
                value={tool.name}
                checked={all || selected.includes(tool.name)}
                disabled={disabled || all}
                classNames={{ body: classes.checkboxBody, labelWrapper: classes.labelWrapper }}
                onChange={(event) =>
                  onChange(toggleTool(selected, tool.name, event.currentTarget.checked))
                }
                label={
                  <Group component="span" gap={6} wrap="nowrap" miw={0}>
                    <Text
                      component="span"
                      size="sm"
                      truncate
                      className={tool.title ? classes.toolTitle : classes.toolName}
                    >
                      {tool.title ?? tool.name}
                    </Text>
                    {tool.destructive && (
                      <Badge size="xs" variant="light" color="red" className={classes.badge}>
                        {labels.destructive}
                      </Badge>
                    )}
                    {tool.readOnly && (
                      <Badge size="xs" variant="light" color="gray" className={classes.badge}>
                        {labels.readOnly}
                      </Badge>
                    )}
                  </Group>
                }
                description={
                  tool.description ? (
                    <Text component="span" size="xs" c="dimmed" lineClamp={2}>
                      {tool.description}
                    </Text>
                  ) : undefined
                }
              />
            ))}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
});

/** Picks the tools of an agent: every tool or a selection grouped by source, with search */
export const ToolSelector = memo(function ToolSelector({
  catalog,
  value,
  onChange,
  label,
  description,
  error,
  disabled = false,
  defaultCollapsedGroups = [],
  labels: labelsProp,
  className,
  style,
}: ToolSelectorProps) {
  const labels = { ...DEFAULT_TOOL_SELECTOR_LABELS, ...labelsProp };
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<string[]>(defaultCollapsedGroups);
  const lastSelection = useRef<string[] | null>(Array.isArray(value) ? value : null);

  const all = value === 'all';
  const selected = Array.isArray(value) ? value : [];
  if (Array.isArray(value)) {
    lastSelection.current = value;
  }

  const groups = useMemo(
    () => groupToolCatalog(searchToolCatalog(catalog, query)),
    [catalog, query]
  );
  const isSearching = query.trim().length > 0;
  const selectedCount = all
    ? catalog.length
    : catalog.filter((tool) => selected.includes(tool.name)).length;

  const handleModeChange = (mode: string) => {
    if (mode === 'all') {
      onChange('all');
    } else if (all) {
      onChange(lastSelection.current ?? catalog.map((tool) => tool.name));
    }
  };

  let body: React.ReactNode;
  if (catalog.length === 0) {
    body = (
      <EmptyState
        size="sm"
        py="md"
        icon={<IconTool />}
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  } else if (groups.length === 0) {
    body = (
      <Text size="sm" c="dimmed" ta="center" py="md">
        {labels.noResults}
      </Text>
    );
  } else {
    body = (
      <Stack gap="md">
        {groups.map((group) => (
          <ToolGroupSection
            key={group.name}
            group={group}
            selected={selected}
            all={all}
            disabled={disabled}
            expanded={isSearching || !collapsed.includes(group.name)}
            onToggleExpanded={() =>
              setCollapsed((prev) =>
                prev.includes(group.name)
                  ? prev.filter((name) => name !== group.name)
                  : [...prev, group.name]
              )
            }
            onChange={onChange}
            labels={labels}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Input.Wrapper
      label={label}
      description={description}
      error={error}
      labelElement="div"
      className={className}
      classNames={{ root: classes.field }}
      style={style}
    >
      <Stack gap="sm">
        <SegmentedControl
          fullWidth
          size="sm"
          disabled={disabled}
          value={all ? 'all' : 'selected'}
          onChange={handleModeChange}
          data={[
            { value: 'all', label: labels.all },
            { value: 'selected', label: labels.selected },
          ]}
        />
        {all && (
          <Text size="xs" c="dimmed">
            {labels.allDescription}
          </Text>
        )}
        {catalog.length > 0 && (
          <Group gap="xs" wrap="wrap">
            <TextInput
              flex={1}
              miw={160}
              size="sm"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder={labels.search}
              aria-label={labels.search}
              leftSection={<IconSearch size={16} />}
            />
            <Text size="xs" c="dimmed" aria-live="polite">
              {fillTemplate(labels.counter, { selected: selectedCount, total: catalog.length })}
            </Text>
          </Group>
        )}
        {body}
      </Stack>
    </Input.Wrapper>
  );
});

ToolSelector.displayName = 'ToolSelector';
