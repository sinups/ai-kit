import React, { memo, useCallback, useState } from 'react';
import { Badge, Button, Group, Text } from '@mantine/core';
import {
  IconCopy,
  IconLock,
  IconPencil,
  IconPlus,
  IconRobot,
  IconTrash,
} from '@tabler/icons-react';
import { EntityList, type EntityListItemState } from '../../primitives/EntityList/EntityList';
import {
  EntityListItem,
  type EntityListItemAction,
} from '../../primitives/EntityList/EntityListItem';
import type { ModelOption } from '../../types';
import { getAgentModelLabel } from '../agent-display';
import { AgentAvatar } from '../AgentAvatar/AgentAvatar';
import type { AgentDefinition, AgentSource } from '../types';
import { AGENT_SOURCE_ORDER, matchesAgentQuery } from '../validate-agent';

export interface AgentListLabels {
  list: string;
  search: string;
  source: string;
  allSources: string;
  newAgent: string;
  edit: string;
  duplicate: string;
  delete: string;
  actions: string;
  readOnly: string;
  inheritModel: string;
  noResults: string;
  emptyTitle: string;
  emptyDescription: string;
  retry: string;
  sources: Record<AgentSource, string>;
}

export const DEFAULT_AGENT_LIST_LABELS: AgentListLabels = {
  list: 'Agents',
  search: 'Search agents',
  source: 'Source',
  allSources: 'All sources',
  newAgent: 'New agent',
  edit: 'Edit',
  duplicate: 'Duplicate',
  delete: 'Delete',
  actions: 'Agent actions',
  readOnly: 'Read-only',
  inheritModel: 'Inherit',
  noResults: 'No agents match the search',
  emptyTitle: 'No agents yet',
  emptyDescription: 'Create an agent to delegate focused tasks with its own prompt and tools',
  retry: 'Retry',
  sources: { builtin: 'Built-in', user: 'User', project: 'Project', plugin: 'Plugin' },
};

export interface AgentListProps {
  /** Agents to list */
  agents: AgentDefinition[];
  /** Id of the selected agent */
  selectedId?: string | null;
  /** Called when an agent row is chosen */
  onSelect?: (agent: AgentDefinition) => void;
  /** Called by the New agent button, the button is rendered only when set */
  onCreate?: () => void;
  /** Called by the Edit action, disabled for read-only agents */
  onEdit?: (agent: AgentDefinition) => void;
  /** Called by the Duplicate action */
  onDuplicate?: (agent: AgentDefinition) => void;
  /** Called by the Delete action, disabled for read-only agents */
  onDelete?: (agent: AgentDefinition) => void;
  /** Models used to show a readable model name */
  models?: ModelOption[];
  /** Groups agents under source headers, `true` by default */
  groupBySource?: boolean;
  /** Shows the search input, `true` by default */
  withSearch?: boolean;
  /** Shows the source filter when agents come from more than one source, `true` by default */
  withSourceFilter?: boolean;
  /** Shows skeleton rows */
  loading?: boolean;
  /** Error message shown instead of the list */
  error?: React.ReactNode;
  /** Called by the retry button of the error */
  onRetry?: () => void;
  /** Overrides for the English labels */
  labels?: Partial<AgentListLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Searchable list of agents grouped by source, with edit, duplicate and delete actions */
export const AgentList = memo(function AgentList({
  agents,
  selectedId,
  onSelect,
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
  models = [],
  groupBySource = true,
  withSearch = true,
  withSourceFilter = true,
  loading,
  error,
  onRetry,
  labels: labelsProp,
  className,
  style,
}: AgentListProps) {
  const labels = {
    ...DEFAULT_AGENT_LIST_LABELS,
    ...labelsProp,
    sources: { ...DEFAULT_AGENT_LIST_LABELS.sources, ...labelsProp?.sources },
  };
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<string>('all');

  const getActions = (agent: AgentDefinition): EntityListItemAction[] => {
    const actions: EntityListItemAction[] = [];
    if (onEdit) {
      actions.push({
        label: labels.edit,
        icon: <IconPencil size={14} />,
        disabled: agent.readOnly,
        onClick: () => onEdit(agent),
      });
    }
    if (onDuplicate) {
      actions.push({
        label: labels.duplicate,
        icon: <IconCopy size={14} />,
        onClick: () => onDuplicate(agent),
      });
    }
    if (onDelete) {
      actions.push({
        label: labels.delete,
        icon: <IconTrash size={14} />,
        color: 'red',
        disabled: agent.readOnly,
        onClick: () => onDelete(agent),
      });
    }
    return actions;
  };

  const getId = useCallback((agent: AgentDefinition) => agent.id, []);
  const sourceLabels = labels.sources;
  const groupBy = useCallback(
    (agent: AgentDefinition) => sourceLabels[agent.source],
    [sourceLabels]
  );

  const sourceOptions = AGENT_SOURCE_ORDER.map((value) => ({
    value,
    label: sourceLabels[value],
    count: agents.filter((agent) => agent.source === value).length,
  })).filter((option) => option.count > 0);
  const showSourceFilter = withSourceFilter && sourceOptions.length > 1;
  const activeSource = sourceOptions.some((option) => option.value === source) ? source : 'all';

  return (
    <EntityList<AgentDefinition>
      items={agents}
      getId={getId}
      selectedId={selectedId}
      onSelect={onSelect}
      loading={loading}
      error={error}
      onRetry={onRetry}
      retryLabel={labels.retry}
      ariaLabel={labels.list}
      groupBy={groupBySource ? groupBy : undefined}
      groupOrder={AGENT_SOURCE_ORDER.map((source) => labels.sources[source])}
      search={
        withSearch
          ? {
              value: query,
              onChange: setQuery,
              placeholder: labels.search,
              filter: matchesAgentQuery,
            }
          : undefined
      }
      filters={
        showSourceFilter
          ? {
              value: activeSource,
              onChange: setSource,
              label: labels.source,
              filter: (agent, value) => value === 'all' || agent.source === value,
              options: [
                { value: 'all', label: labels.allSources, count: agents.length },
                ...sourceOptions,
              ],
            }
          : undefined
      }
      noResults={labels.noResults}
      empty={{
        icon: <IconRobot />,
        title: labels.emptyTitle,
        description: labels.emptyDescription,
        action: onCreate && (
          <Button size="xs" leftSection={<IconPlus size={14} />} onClick={onCreate}>
            {labels.newAgent}
          </Button>
        ),
      }}
      toolbar={
        onCreate && (
          <Button size="sm" leftSection={<IconPlus size={16} />} onClick={onCreate}>
            {labels.newAgent}
          </Button>
        )
      }
      className={className}
      style={style}
      renderItem={(agent: AgentDefinition, { selected }: EntityListItemState) => (
        <EntityListItem
          selected={selected}
          icon={<AgentAvatar agent={agent} size="md" />}
          title={agent.displayName || agent.name}
          description={agent.description}
          actions={getActions(agent)}
          actionsLabel={`${labels.actions}: ${agent.displayName || agent.name}`}
          badges={
            <Group gap={4} wrap="nowrap">
              {!groupBySource && (
                <Badge size="xs" variant="light" color="gray">
                  {labels.sources[agent.source]}
                </Badge>
              )}
              {agent.readOnly && <IconLock size={12} aria-label={labels.readOnly} role="img" />}
            </Group>
          }
          meta={
            <Text component="span" size="xs" c="dimmed">
              {getAgentModelLabel(agent.model, models, labels.inheritModel)}
            </Text>
          }
        />
      )}
    />
  );
});

AgentList.displayName = 'AgentList';
