import React, { memo, useId, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Code,
  Collapse,
  Group,
  Menu,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconCopy,
  IconDots,
  IconLock,
  IconMessagePlus,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { Markdown } from '../../Markdown/Markdown';
import { SettingRow } from '../../primitives/SettingsLayout/SettingRow';
import type { ModelOption } from '../../types';
import { formatAgentDate, getAgentModelLabel } from '../agent-display';
import { AgentAvatar } from '../AgentAvatar/AgentAvatar';
import type { AgentDefinition, AgentSource, ToolCatalogItem } from '../types';
import { resolveAgentTools, summarizeTools, type AgentToolSummaryLabels } from '../validate-agent';

export interface AgentDetailLabels {
  useInChat: string;
  edit: string;
  duplicate: string;
  delete: string;
  more: string;
  readOnly: string;
  whenToUse: string;
  configuration: string;
  model: string;
  inheritModel: string;
  maxTurns: string;
  noLimit: string;
  tools: string;
  showTools: string;
  hideTools: string;
  disallowedTools: string;
  skills: string;
  none: string;
  updated: string;
  systemPrompt: string;
  sources: Record<AgentSource, string>;
  toolSummary: Partial<AgentToolSummaryLabels>;
}

export const DEFAULT_AGENT_DETAIL_LABELS: AgentDetailLabels = {
  useInChat: 'Use in chat',
  edit: 'Edit',
  duplicate: 'Duplicate',
  delete: 'Delete',
  more: 'More actions',
  readOnly: 'Read-only',
  whenToUse: 'When to use',
  configuration: 'Configuration',
  model: 'Model',
  inheritModel: 'Inherit from the session',
  maxTurns: 'Max turns',
  noLimit: 'No limit',
  tools: 'Tools',
  showTools: 'Show',
  hideTools: 'Hide',
  disallowedTools: 'Disallowed tools',
  skills: 'Skills',
  none: 'None',
  updated: 'Updated',
  systemPrompt: 'System prompt',
  sources: { builtin: 'Built-in', user: 'User', project: 'Project', plugin: 'Plugin' },
  toolSummary: {},
};

export interface AgentDetailProps {
  /** Agent to show */
  agent: AgentDefinition;
  /** Tool catalog used to summarize and list tools */
  catalog?: ToolCatalogItem[];
  /** Models used to show a readable model name */
  models?: ModelOption[];
  /** Called by the Use in chat button, the button is rendered only when set */
  onUseInChat?: (agent: AgentDefinition) => void;
  /** Called by the Edit button, hidden for read-only agents */
  onEdit?: (agent: AgentDefinition) => void;
  /** Called by the Duplicate action */
  onDuplicate?: (agent: AgentDefinition) => void;
  /** Called by the Delete action, hidden for read-only agents */
  onDelete?: (agent: AgentDefinition) => void;
  /** BCP 47 locale for dates, `en` by default so server and client render the same text */
  locale?: string;
  /** Formats `updatedAt`, a medium date in `locale` by default */
  formatDate?: (iso: string) => string;
  /** Overrides of the default English labels */
  labels?: Partial<AgentDetailLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function ToolBadges({ names, color }: { names: string[]; color?: string }) {
  return (
    <Group gap={4}>
      {names.map((name) => (
        <Badge key={name} size="sm" variant="light" color={color ?? 'gray'} tt="none">
          {name}
        </Badge>
      ))}
    </Group>
  );
}

/** Agent overview: header with actions, configuration rows and the system prompt */
export const AgentDetail = memo(function AgentDetail({
  agent,
  catalog = [],
  models = [],
  onUseInChat,
  onEdit,
  onDuplicate,
  onDelete,
  locale = 'en',
  formatDate,
  labels: labelsProp,
  className,
  style,
}: AgentDetailProps) {
  const labels = {
    ...DEFAULT_AGENT_DETAIL_LABELS,
    ...labelsProp,
    sources: { ...DEFAULT_AGENT_DETAIL_LABELS.sources, ...labelsProp?.sources },
  };
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsId = useId();

  const canEdit = !!onEdit && !agent.readOnly;
  const canDelete = !!onDelete && !agent.readOnly;
  const disallowed = agent.disallowedTools ?? [];
  const toolNames =
    agent.tools === 'all' ? resolveAgentTools('all', disallowed, catalog) : agent.tools;
  const menuItems = [
    onDuplicate && (
      <Menu.Item
        key="duplicate"
        leftSection={<IconCopy size={14} />}
        onClick={() => onDuplicate(agent)}
      >
        {labels.duplicate}
      </Menu.Item>
    ),
    canDelete && (
      <Menu.Item
        key="delete"
        color="red"
        leftSection={<IconTrash size={14} />}
        onClick={() => onDelete!(agent)}
      >
        {labels.delete}
      </Menu.Item>
    ),
  ].filter(Boolean);

  return (
    <Stack gap="lg" p="md" className={className} style={style}>
      <Group justify="space-between" align="flex-start" gap="sm">
        <Group gap="sm" wrap="nowrap" miw={0} flex="1 1 auto">
          <AgentAvatar agent={agent} size="lg" />
          <Stack gap={2} miw={0}>
            <Text component="h2" size="sm" fw={500} lineClamp={1}>
              {agent.displayName || agent.name}
            </Text>
            <Group gap={6} wrap="wrap">
              <Code>{agent.name}</Code>
              <Badge size="sm" variant="light" color="gray">
                {labels.sources[agent.source]}
              </Badge>
              {agent.readOnly && (
                <Badge size="sm" variant="light" color="gray" leftSection={<IconLock size={12} />}>
                  {labels.readOnly}
                </Badge>
              )}
            </Group>
          </Stack>
        </Group>
        <Group gap="xs" wrap="nowrap">
          {onUseInChat && (
            <Button
              size="sm"
              leftSection={<IconMessagePlus size={16} />}
              onClick={() => onUseInChat(agent)}
            >
              {labels.useInChat}
            </Button>
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="default"
              leftSection={<IconPencil size={16} />}
              onClick={() => onEdit!(agent)}
            >
              {labels.edit}
            </Button>
          )}
          {menuItems.length > 0 && (
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm" aria-label={labels.more}>
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>{menuItems}</Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>

      <Stack gap={4}>
        <Title order={3}>{labels.whenToUse}</Title>
        <Text size="sm">{agent.description}</Text>
      </Stack>

      <Stack gap={4} component="section" aria-label={labels.configuration}>
        <Title order={3}>{labels.configuration}</Title>
        <Stack gap="sm">
          <SettingRow
            label={labels.model}
            control={
              <Text size="sm">{getAgentModelLabel(agent.model, models, labels.inheritModel)}</Text>
            }
          />
          <SettingRow
            label={labels.maxTurns}
            control={<Text size="sm">{agent.maxTurns ?? labels.noLimit}</Text>}
          />
          <Stack gap={0}>
            <SettingRow
              label={labels.tools}
              description={summarizeTools(agent.tools, catalog, labels.toolSummary)}
              control={
                <Button
                  size="compact-sm"
                  variant="subtle"
                  aria-expanded={toolsOpen}
                  aria-controls={toolsId}
                  onClick={() => setToolsOpen((open) => !open)}
                >
                  {toolsOpen ? labels.hideTools : labels.showTools}
                </Button>
              }
            />
            <Collapse expanded={toolsOpen} id={toolsId}>
              <Stack gap="xs" pt="xs">
                {toolNames.length > 0 ? (
                  <ToolBadges names={toolNames} />
                ) : (
                  <Text size="xs" c="dimmed">
                    {labels.none}
                  </Text>
                )}
              </Stack>
            </Collapse>
          </Stack>
          {disallowed.length > 0 && (
            <SettingRow
              label={labels.disallowedTools}
              layout="stacked"
              control={<ToolBadges names={disallowed} color="red" />}
            />
          )}
          <SettingRow
            label={labels.skills}
            control={
              agent.skills && agent.skills.length > 0 ? (
                <Group gap={4}>
                  {agent.skills.map((skill) => (
                    <Badge key={skill} size="sm" variant="light" tt="none">
                      {skill}
                    </Badge>
                  ))}
                </Group>
              ) : (
                <Text size="sm" c="dimmed">
                  {labels.none}
                </Text>
              )
            }
          />
          {agent.updatedAt && (
            <SettingRow
              label={labels.updated}
              control={
                <Text size="sm">
                  {formatDate
                    ? formatDate(agent.updatedAt)
                    : formatAgentDate(agent.updatedAt, locale)}
                </Text>
              }
            />
          )}
        </Stack>
      </Stack>

      <Stack gap={4}>
        <Title order={3}>{labels.systemPrompt}</Title>
        <Markdown content={agent.systemPrompt} />
      </Stack>
    </Stack>
  );
});

AgentDetail.displayName = 'AgentDetail';
