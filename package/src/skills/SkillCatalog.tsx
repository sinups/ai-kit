import React, { memo, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  EmptyState,
  Group,
  Loader,
  Menu,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCopy,
  IconDots,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSparkles,
  IconTrash,
} from '@tabler/icons-react';
import { usePendingActions } from '../hooks/use-pending-actions';
import { EntityList } from '../primitives/EntityList/EntityList';
import { EntityListItem, type EntityListItemAction } from '../primitives/EntityList/EntityListItem';
import { cx } from '../utils/cx';
import {
  SKILL_SOURCE_LABELS,
  SKILL_SOURCES,
  countSkillsBySource,
  filterSkillsBySource,
  searchSkills,
  type SkillSourceFilter,
} from './skill-utils';
import type { Skill, SkillSource } from './types';
import classes from './Skills.module.css';

export interface SkillCatalogLabels {
  search: string;
  source: string;
  allSources: string;
  newSkill: string;
  actions: string;
  edit: string;
  duplicate: string;
  remove: string;
  enable: string;
  noResults: string;
  emptyTitle: string;
  emptyDescription: string;
  retry: string;
  toggleError: string;
  dismiss: string;
  uses: (count: number) => string;
  sources: Record<SkillSource, string>;
}

export interface SkillCatalogProps {
  /** Skills to show */
  skills: Skill[];
  /** Shows skeletons instead of skills */
  loading?: boolean;
  /** Error message shown instead of skills */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetry?: () => void;
  /** Id of the selected skill */
  selectedId?: string | null;
  /** Called when a skill is clicked or chosen with Enter */
  onSelect?: (skill: Skill) => void;
  /** Enables or disables a skill, the switch shows a loader until the returned promise settles */
  onToggle?: (skill: Skill, enabled: boolean) => Promise<void> | void;
  /** Opens the editor, the Edit action is shown only when set */
  onEdit?: (skill: Skill) => void;
  /** Duplicates a skill, the Duplicate action is shown only when set */
  onDuplicate?: (skill: Skill) => void;
  /** Removes a skill, the Remove action is shown only when set */
  onRemove?: (skill: Skill) => void;
  /** Returns whether Edit and Remove are offered for a skill, all skills by default */
  isEditable?: (skill: Skill) => boolean;
  /** Starts creating a skill, the New skill button is shown only when set */
  onCreate?: () => void;
  /** `list` renders rows, `grid` renders cards whose column count follows the component width, `list` by default */
  variant?: 'list' | 'grid';
  /** Groups rows by source in the `list` variant, `true` by default */
  grouped?: boolean;
  /** Search query, uncontrolled when omitted */
  query?: string;
  /** Called when the search query changes */
  onQueryChange?: (query: string) => void;
  /** Source filter, uncontrolled with `all` by default */
  source?: SkillSourceFilter;
  /** Called when the source filter changes */
  onSourceChange?: (source: SkillSourceFilter) => void;
  /** Overrides of the default English labels */
  labels?: Partial<SkillCatalogLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const DEFAULT_LABELS: SkillCatalogLabels = {
  search: 'Search skills',
  source: 'Source',
  allSources: 'All sources',
  newSkill: 'New skill',
  actions: 'Skill actions',
  edit: 'Edit',
  duplicate: 'Duplicate',
  remove: 'Remove',
  enable: 'Enabled',
  noResults: 'No skills match your search',
  emptyTitle: 'No skills yet',
  emptyDescription: 'Skills teach the agent repeatable workflows with instructions and scripts.',
  retry: 'Retry',
  toggleError: 'Could not change the skill',
  dismiss: 'Dismiss',
  uses: (count) => (count === 1 ? '1 use' : `${count} uses`),
  sources: SKILL_SOURCE_LABELS,
};

const GRID_COLS = { base: 1, '520px': 2, '820px': 3 };

function stop(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export const SkillCatalog = memo(function SkillCatalog({
  skills,
  loading = false,
  error,
  onRetry,
  selectedId,
  onSelect,
  onToggle,
  onEdit,
  onDuplicate,
  onRemove,
  isEditable,
  onCreate,
  variant = 'list',
  grouped = true,
  query: queryProp,
  onQueryChange,
  source: sourceProp,
  onSourceChange,
  labels,
  className,
  style,
}: SkillCatalogProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const [queryState, setQueryState] = useState('');
  const [sourceState, setSourceState] = useState<SkillSourceFilter>('all');
  const toggles = usePendingActions(text.toggleError);

  const query = queryProp ?? queryState;
  const source = sourceProp ?? sourceState;
  const setQuery = (value: string) => {
    setQueryState(value);
    onQueryChange?.(value);
  };
  const setSource = (value: SkillSourceFilter) => {
    setSourceState(value);
    onSourceChange?.(value);
  };

  const counts = useMemo(() => countSkillsBySource(skills), [skills]);
  const bySource = useMemo(() => filterSkillsBySource(skills, source), [skills, source]);
  const visible = useMemo(() => searchSkills(bySource, query), [bySource, query]);

  const actionsFor = (skill: Skill): EntityListItemAction[] => {
    const actions: EntityListItemAction[] = [];
    const editable = isEditable?.(skill) ?? true;
    if (onEdit && editable) {
      actions.push({
        label: text.edit,
        icon: <IconPencil size={14} />,
        onClick: () => onEdit(skill),
      });
    }
    if (onDuplicate) {
      actions.push({
        label: text.duplicate,
        icon: <IconCopy size={14} />,
        onClick: () => onDuplicate(skill),
      });
    }
    if (onRemove && editable) {
      actions.push({
        label: text.remove,
        icon: <IconTrash size={14} />,
        color: 'red',
        onClick: () => onRemove(skill),
      });
    }
    return actions;
  };

  const renderSwitch = (skill: Skill) => {
    if (!onToggle) {
      return null;
    }
    const pending = toggles.isPending(skill.id);
    return (
      <Box component="span" className={classes.switch} onClick={stop} onKeyDown={stop}>
        <Switch
          size="xs"
          checked={skill.enabled}
          disabled={pending}
          thumbIcon={pending ? <Loader size={8} /> : undefined}
          aria-label={`${text.enable}: ${skill.name}`}
          onChange={(event) => {
            const { checked } = event.currentTarget;
            toggles.run(skill.id, () => onToggle(skill, checked));
          }}
        />
      </Box>
    );
  };

  const renderTags = (skill: Skill) =>
    skill.tags?.map((tag) => (
      <Badge key={tag} size="xs" variant="light" color="gray" className={classes.tag}>
        {tag}
      </Badge>
    ));

  const sourceOptions = [
    { value: 'all', label: `${text.allSources} (${counts.all})` },
    ...SKILL_SOURCES.filter((value) => counts[value] > 0 || value === source).map((value) => ({
      value,
      label: `${text.sources[value]} (${counts[value]})`,
    })),
  ];

  const searchInput = (
    <TextInput
      value={query}
      onChange={(event) => setQuery(event.currentTarget.value)}
      placeholder={text.search}
      aria-label={text.search}
      leftSection={<IconSearch size={16} />}
    />
  );
  const sourceSelect = (
    <Select
      aria-label={text.source}
      allowDeselect={false}
      value={source}
      onChange={(value) => value && setSource(value as SkillSourceFilter)}
      data={sourceOptions}
    />
  );
  const createButton = onCreate && (
    <Button variant="light" leftSection={<IconPlus size={14} />} onClick={onCreate}>
      {text.newSkill}
    </Button>
  );

  const header = (
    <Box className={classes.headerContainer}>
      <Box className={classes.header} data-with-create={onCreate ? true : undefined}>
        <Box className={classes.headerSearch}>{searchInput}</Box>
        <Box className={classes.headerSource}>{sourceSelect}</Box>
        {createButton && <Box className={classes.headerCreate}>{createButton}</Box>}
      </Box>
    </Box>
  );

  const empty = {
    title: text.emptyTitle,
    description: text.emptyDescription,
    icon: <IconSparkles size={28} />,
    action: createButton,
  };

  let body: React.ReactNode;
  if (variant === 'list') {
    body = (
      <EntityList<Skill>
        items={visible}
        getId={(skill) => skill.id}
        selectedId={selectedId}
        onSelect={onSelect}
        loading={loading}
        error={error}
        onRetry={onRetry}
        retryLabel={text.retry}
        empty={skills.length === 0 ? empty : undefined}
        noResults={text.noResults}
        groupBy={grouped && !query.trim() ? (skill) => text.sources[skill.source] : undefined}
        groupOrder={SKILL_SOURCES.map((value) => text.sources[value])}
        ariaLabel={text.search}
        renderItem={(skill, { selected }) => (
          <EntityListItem
            title={skill.name}
            description={skill.description}
            icon={<IconSparkles size={18} />}
            badges={renderTags(skill)}
            meta={renderSwitch(skill)}
            actions={actionsFor(skill)}
            actionsLabel={`${text.actions}: ${skill.name}`}
            selected={selected}
          />
        )}
      />
    );
  } else if (loading) {
    body = (
      <SimpleGrid type="container" cols={GRID_COLS} spacing="sm" aria-busy="true">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} height={132} radius="md" />
        ))}
      </SimpleGrid>
    );
  } else if (error) {
    body = (
      <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error}</Text>
          {onRetry && (
            <Button size="xs" variant="default" onClick={onRetry}>
              {text.retry}
            </Button>
          )}
        </Stack>
      </Alert>
    );
  } else if (visible.length === 0) {
    body =
      skills.length === 0 ? (
        <EmptyState
          size="sm"
          py="lg"
          title={empty.title}
          description={empty.description}
          icon={empty.icon}
        >
          {createButton && <EmptyState.Actions>{createButton}</EmptyState.Actions>}
        </EmptyState>
      ) : (
        <Text size="sm" c="dimmed" ta="center" py="lg">
          {text.noResults}
        </Text>
      );
  } else {
    body = (
      <SimpleGrid type="container" cols={GRID_COLS} spacing="sm">
        {visible.map((skill) => {
          const actions = actionsFor(skill);
          return (
            <Paper
              key={skill.id}
              withBorder
              radius="md"
              p="sm"
              data-selected={skill.id === selectedId || undefined}
              className={classes.card}
            >
              <Stack gap="xs" h="100%">
                <Group gap="xs" wrap="nowrap" justify="space-between">
                  <Group gap={6} wrap="nowrap" miw={0}>
                    <IconSparkles size={16} className={classes.cardIcon} />
                    <UnstyledButton
                      aria-pressed={skill.id === selectedId}
                      className={classes.cardTitle}
                      onClick={() => onSelect?.(skill)}
                    >
                      <Text size="sm" fw={500} truncate="end">
                        {skill.name}
                      </Text>
                    </UnstyledButton>
                  </Group>
                  {renderSwitch(skill)}
                </Group>
                <Text size="xs" c="dimmed" lineClamp={3} className={classes.cardDescription}>
                  {skill.description}
                </Text>
                <Group gap={4} mih={18}>
                  {renderTags(skill)}
                </Group>
                <Group gap="xs" justify="space-between" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    <Badge size="xs" variant="light" color="gray">
                      {text.sources[skill.source]}
                    </Badge>
                    {skill.usageCount !== undefined && (
                      <Text size="xs" c="dimmed">
                        {text.uses(skill.usageCount)}
                      </Text>
                    )}
                  </Group>
                  {actions.length > 0 && (
                    <Menu position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          aria-label={`${text.actions}: ${skill.name}`}
                          className={classes.cardControl}
                        >
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        {actions.map((action) => (
                          <Menu.Item
                            key={action.label}
                            leftSection={action.icon}
                            color={action.color}
                            onClick={action.onClick}
                          >
                            {action.label}
                          </Menu.Item>
                        ))}
                      </Menu.Dropdown>
                    </Menu>
                  )}
                </Group>
              </Stack>
            </Paper>
          );
        })}
      </SimpleGrid>
    );
  }

  return (
    <Stack gap="sm" className={cx(classes.root, className)} style={style}>
      {header}
      {toggles.error && (
        <Alert
          color="red"
          variant="light"
          icon={<IconAlertCircle size={18} />}
          withCloseButton
          closeButtonLabel={text.dismiss}
          onClose={() => toggles.clearError()}
        >
          {toggles.error}
        </Alert>
      )}
      {body}
    </Stack>
  );
});
