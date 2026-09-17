import React, { memo } from 'react';
import { Alert, Badge, Button, Code, DataList, Group, Stack, Text, Title } from '@mantine/core';
import { IconAlertCircle, IconPencil, IconPower, IconSparkles } from '@tabler/icons-react';
import { usePendingActions } from '../hooks/use-pending-actions';
import { Markdown } from '../Markdown/Markdown';
import { StatusBadge } from '../primitives/StatusBadge/StatusBadge';
import { cx } from '../utils/cx';
import { SKILL_SOURCE_LABELS } from './skill-utils';
import type { Skill, SkillSource } from './types';
import classes from './Skills.module.css';

export interface SkillDetailLabels {
  edit: string;
  enable: string;
  disable: string;
  enabled: string;
  disabled: string;
  source: string;
  version: string;
  author: string;
  path: string;
  updated: string;
  usage: string;
  allowedTools: string;
  noAllowedTools: string;
  instructions: string;
  noInstructions: string;
  toggleError: string;
  sources: Record<SkillSource, string>;
}

export interface SkillDetailProps {
  /** Skill to show */
  skill: Skill;
  /** Opens the editor, the Edit button is shown only when set */
  onEdit?: (skill: Skill) => void;
  /** Enables or disables the skill, the button shows a loader until the returned promise settles */
  onToggle?: (skill: Skill, enabled: boolean) => Promise<void> | void;
  /** Extra buttons rendered after Edit and Enable */
  actions?: React.ReactNode;
  /** Locale used to format the update date, the browser locale by default */
  locale?: string;
  /** Overrides of the default English labels */
  labels?: Partial<SkillDetailLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const DEFAULT_SKILL_DETAIL_LABELS: SkillDetailLabels = {
  edit: 'Edit',
  enable: 'Enable',
  disable: 'Disable',
  enabled: 'Enabled',
  disabled: 'Disabled',
  source: 'Source',
  version: 'Version',
  author: 'Author',
  path: 'Path',
  updated: 'Updated',
  usage: 'Uses',
  allowedTools: 'Allowed tools',
  noAllowedTools: 'The skill asks before using any tool.',
  instructions: 'Instructions',
  noInstructions: 'This skill has no instructions yet.',
  toggleError: 'Could not change the skill',
  sources: SKILL_SOURCE_LABELS,
};

function formatDate(value: Skill['updatedAt'], locale?: string): string | null {
  if (value === undefined) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export const SkillDetail = memo(function SkillDetail({
  skill,
  onEdit,
  onToggle,
  actions,
  locale,
  labels,
  className,
  style,
}: SkillDetailProps) {
  const text = { ...DEFAULT_SKILL_DETAIL_LABELS, ...labels };
  const toggles = usePendingActions(text.toggleError);
  const toggleError = toggles.getError(skill.id);

  const updated = formatDate(skill.updatedAt, locale);
  const metadata: { label: string; value: React.ReactNode }[] = [
    { label: text.source, value: text.sources[skill.source] },
    ...(skill.version ? [{ label: text.version, value: skill.version }] : []),
    ...(skill.author ? [{ label: text.author, value: skill.author }] : []),
    ...(updated ? [{ label: text.updated, value: updated }] : []),
    ...(skill.usageCount !== undefined
      ? [{ label: text.usage, value: skill.usageCount.toLocaleString(locale) }]
      : []),
    ...(skill.path
      ? [{ label: text.path, value: <Code className={classes.path}>{skill.path}</Code> }]
      : []),
  ];

  return (
    <Stack gap="lg" p="md" className={cx(classes.content, className)} style={style}>
      <Stack gap="xs">
        <Group gap="sm" wrap="nowrap" align="flex-start" justify="space-between">
          <Group gap="xs" wrap="nowrap" miw={0}>
            <IconSparkles size={16} className={classes.cardIcon} />
            <Text component="h3" size="sm" fw={500} className={classes.title}>
              {skill.name}
            </Text>
          </Group>
          <StatusBadge
            status={skill.enabled ? 'success' : 'disabled'}
            label={skill.enabled ? text.enabled : text.disabled}
            withIcon={false}
          />
        </Group>
        <Text size="sm" c="dimmed">
          {skill.description}
        </Text>
        {skill.tags && skill.tags.length > 0 && (
          <Group gap={4}>
            {skill.tags.map((tag) => (
              <Badge key={tag} size="xs" variant="light" color="gray" className={classes.tag}>
                {tag}
              </Badge>
            ))}
          </Group>
        )}
        {(onEdit || onToggle || actions) && (
          <Group gap="xs">
            {onEdit && (
              <Button
                size="xs"
                leftSection={<IconPencil size={14} />}
                onClick={() => onEdit(skill)}
              >
                {text.edit}
              </Button>
            )}
            {onToggle && (
              <Button
                size="xs"
                variant="default"
                leftSection={<IconPower size={14} />}
                loading={toggles.isPending(skill.id)}
                onClick={() => toggles.run(skill.id, () => onToggle(skill, !skill.enabled))}
              >
                {skill.enabled ? text.disable : text.enable}
              </Button>
            )}
            {actions}
          </Group>
        )}
        {toggleError && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
            {toggleError}
          </Alert>
        )}
      </Stack>

      <DataList size="sm" labelWidth={96}>
        {metadata.map((item) => (
          <DataList.Item key={item.label}>
            <DataList.ItemLabel>{item.label}</DataList.ItemLabel>
            <DataList.ItemValue>{item.value}</DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList>

      <Stack gap={4}>
        <Title order={4}>{text.allowedTools}</Title>
        {skill.allowedTools && skill.allowedTools.length > 0 ? (
          <Group gap={6}>
            {skill.allowedTools.map((tool) => (
              <Badge key={tool} size="xs" variant="light" color="gray" className={classes.tag}>
                {tool}
              </Badge>
            ))}
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            {text.noAllowedTools}
          </Text>
        )}
      </Stack>

      <Stack gap={4}>
        <Title order={4}>{text.instructions}</Title>
        {skill.content?.trim() ? (
          <Markdown content={skill.content} />
        ) : (
          <Text size="sm" c="dimmed">
            {text.noInstructions}
          </Text>
        )}
      </Stack>
    </Stack>
  );
});

SkillDetail.displayName = 'SkillDetail';
