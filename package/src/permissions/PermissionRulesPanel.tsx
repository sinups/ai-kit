import React, { memo, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Group,
  Loader,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconArrowsExchange,
  IconBan,
  IconCheck,
  IconEdit,
  IconFolder,
  IconHelpCircle,
  IconHistory,
  IconLock,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { usePendingActions } from '../hooks/use-pending-actions';
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog';
import { EntityList } from '../primitives/EntityList/EntityList';
import { EntityListItem, type EntityListItemAction } from '../primitives/EntityList/EntityListItem';
import { cx } from '../utils/cx';
import { getErrorMessage } from '../utils/error-message';
import {
  AddPermissionRuleWizard,
  type AddPermissionRuleWizardLabels,
} from './AddPermissionRuleWizard';
import {
  countRulesByBehavior,
  describeRule,
  formatRule,
  matchesRuleQuery,
  suggestRuleFromDenial,
  validateDirectoryPath,
} from './permission-rule';
import {
  EDITABLE_PERMISSION_SCOPES,
  PERMISSION_BEHAVIORS,
  PERMISSION_BEHAVIOR_ORDER,
  PERMISSION_SCOPES,
  PERMISSION_SCOPE_ORDER,
  type PermissionBehavior,
  type PermissionDenial,
  type PermissionRule,
  type PermissionScope,
  type WorkspaceDirectory,
} from './types';
import classes from './PermissionRulesPanel.module.css';

export type PermissionRulesTab = PermissionBehavior | 'denials' | 'workspace';

export type PermissionRuleSaveMode = 'create' | 'edit';

export interface PermissionRulesPanelLabels {
  title: string;
  description: string;
  denials: string;
  workspace: string;
  tabs: string;
  addRule: string;
  edit: string;
  delete: string;
  moveTo: string;
  readOnly: string;
  search: string;
  allowThis: string;
  addDirectory: string;
  directoryPlaceholder: string;
  directoryScope: string;
  remove: string;
  cancel: string;
  pending: string;
  /** Title of the delete confirmation */
  deleteRuleTitle: string;
  /** Delete confirmation text after the rule, `{scope}` is replaced with the scope label */
  deleteRuleMessage: string;
  /** Title of the remove directory confirmation */
  removeDirectoryTitle: string;
  /** Remove directory confirmation text after the path */
  removeDirectoryMessage: string;
  emptyRulesTitle: string;
  emptyRulesDescription: string;
  emptyDenialsTitle: string;
  emptyDenialsDescription: string;
  emptyDirectoriesTitle: string;
  emptyDirectoriesDescription: string;
  error: string;
}

export interface PermissionRulesPanelProps {
  /** Rules of all behaviors and scopes */
  rules: PermissionRule[];
  /** Recently denied tool calls, the tab is hidden when omitted */
  denials?: PermissionDenial[];
  /** Additional working directories, the tab is hidden when omitted */
  directories?: WorkspaceDirectory[];
  /** Shows skeleton rows instead of the lists */
  loading?: boolean;
  /** Error message shown instead of the lists */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetry?: () => void;
  /** Called with a rule created or edited in the wizard, add and edit actions are hidden when omitted */
  onSaveRule?: (rule: PermissionRule, mode: PermissionRuleSaveMode) => void | Promise<void>;
  /** Called by the delete action, hidden when omitted */
  onDeleteRule?: (rule: PermissionRule) => void | Promise<void>;
  /** Called by the move actions with the new scope, hidden when omitted */
  onChangeScope?: (rule: PermissionRule, scope: PermissionScope) => void | Promise<void>;
  /** Called with a new directory, the add form is hidden when omitted */
  onAddDirectory?: (directory: WorkspaceDirectory) => void | Promise<void>;
  /** Called by the remove action of a directory, hidden when omitted */
  onRemoveDirectory?: (directory: WorkspaceDirectory) => void | Promise<void>;
  /** Tool names suggested in the rule wizard */
  knownTools?: string[];
  /** Controlled active tab */
  tab?: PermissionRulesTab;
  /** Initial tab when `tab` is not controlled, `allow` by default */
  defaultTab?: PermissionRulesTab;
  /** Called with the tab the user picked */
  onTabChange?: (tab: PermissionRulesTab) => void;
  /** Overrides for the English labels of the panel */
  labels?: Partial<PermissionRulesPanelLabels>;
  /** Overrides for the English labels of the rule wizard */
  wizardLabels?: Partial<AddPermissionRuleWizardLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const DEFAULT_LABELS: PermissionRulesPanelLabels = {
  title: 'Permissions',
  description:
    'Rules that decide which tool calls run without asking, need approval or are blocked.',
  denials: 'Recent denials',
  workspace: 'Workspace',
  tabs: 'Permission sections',
  addRule: 'Add rule',
  edit: 'Edit',
  delete: 'Delete',
  moveTo: 'Move to',
  readOnly: 'Managed by policy',
  search: 'Search rules',
  allowThis: 'Allow this',
  addDirectory: 'Add',
  directoryPlaceholder: '/absolute/path/to/directory',
  directoryScope: 'Directory scope',
  remove: 'Remove',
  cancel: 'Cancel',
  pending: 'Saving',
  deleteRuleTitle: 'Delete rule',
  deleteRuleMessage: 'will be removed from the {scope} settings.',
  removeDirectoryTitle: 'Remove directory',
  removeDirectoryMessage: 'will no longer be available to the agent.',
  emptyRulesTitle: 'No rules yet',
  emptyRulesDescription: 'Add a rule to decide what happens with matching tool calls.',
  emptyDenialsTitle: 'No recent denials',
  emptyDenialsDescription: 'Tool calls that were blocked or rejected show up here.',
  emptyDirectoriesTitle: 'No additional directories',
  emptyDirectoriesDescription: 'The agent can work only inside the project directory.',
  error: 'Something went wrong',
};

const BEHAVIOR_ICONS: Record<PermissionBehavior, React.ReactNode> = {
  allow: <IconCheck size={16} />,
  ask: <IconHelpCircle size={16} />,
  deny: <IconBan size={16} />,
};

const NARROW_WIDTH = 560;

function formatTime(at: string): string {
  const date = new Date(at);
  return Number.isNaN(date.getTime())
    ? at
    : date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function ScopeBadge({ scope }: { scope: PermissionScope }) {
  const meta = PERMISSION_SCOPES[scope];
  return (
    <Badge
      size="xs"
      variant="light"
      color={meta.readOnly ? 'violet' : 'gray'}
      leftSection={meta.readOnly ? <IconLock size={10} /> : undefined}
      className={classes.noShrink}
    >
      {meta.label}
    </Badge>
  );
}

const scopeGroupOrder = PERMISSION_SCOPE_ORDER.map((scope) => PERMISSION_SCOPES[scope].label);

/** Permission rules by behavior with scope groups, recent denials and workspace directories, plus a wizard to add rules */
export const PermissionRulesPanel = memo(function PermissionRulesPanel({
  rules,
  denials,
  directories,
  loading = false,
  error,
  onRetry,
  onSaveRule,
  onDeleteRule,
  onChangeScope,
  onAddDirectory,
  onRemoveDirectory,
  knownTools,
  tab: controlledTab,
  defaultTab = 'allow',
  onTabChange,
  labels: labelsProp,
  wizardLabels,
  className,
  style,
}: PermissionRulesPanelProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const { ref, width } = useElementSize();
  const [uncontrolledTab, setUncontrolledTab] = useState<PermissionRulesTab>(defaultTab);
  const [query, setQuery] = useState('');
  const [wizardOpened, setWizardOpened] = useState(false);
  const [draft, setDraft] = useState<Partial<PermissionRule> | undefined>(undefined);
  const [confirmTarget, setConfirmTarget] = useState<
    | { kind: 'rule'; rule: PermissionRule }
    | { kind: 'directory'; directory: WorkspaceDirectory }
    | null
  >(null);
  const [confirmOpened, setConfirmOpened] = useState(false);
  const askConfirm = (
    target:
      | { kind: 'rule'; rule: PermissionRule }
      | { kind: 'directory'; directory: WorkspaceDirectory }
  ) => {
    setConfirmTarget(target);
    setConfirmOpened(true);
  };
  const [directoryPath, setDirectoryPath] = useState('');
  const [directoryScope, setDirectoryScope] = useState<PermissionScope>('local');
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [addingDirectory, setAddingDirectory] = useState(false);

  const tab = controlledTab ?? uncontrolledTab;
  const isNarrow = width > 0 && width < NARROW_WIDTH;
  const counts = useMemo(() => countRulesByBehavior(rules), [rules]);

  const setTab = (next: PermissionRulesTab) => {
    setUncontrolledTab(next);
    onTabChange?.(next);
  };

  const openWizard = (rule?: Partial<PermissionRule>) => {
    setDraft(rule);
    setWizardOpened(true);
  };

  const rowActions = usePendingActions(labels.error);
  const ruleKey = (rule: PermissionRule) => `rule:${rule.id}`;
  const directoryKey = (directory: WorkspaceDirectory) => `directory:${directory.path}`;
  const rowPending = (key: string) =>
    rowActions.isPending(key) ? <Loader size="xs" aria-label={labels.pending} /> : undefined;

  const confirmAction = () => {
    if (confirmTarget?.kind === 'rule' && onDeleteRule) {
      const { rule } = confirmTarget;
      return rowActions.run(ruleKey(rule), () => onDeleteRule(rule), { rethrow: true });
    }
    if (confirmTarget?.kind === 'directory' && onRemoveDirectory) {
      const { directory } = confirmTarget;
      return rowActions.run(directoryKey(directory), () => onRemoveDirectory(directory), {
        rethrow: true,
      });
    }
    return undefined;
  };

  const tabs: {
    value: PermissionRulesTab;
    label: string;
    count?: number;
    icon: React.ReactNode;
  }[] = [
    ...PERMISSION_BEHAVIOR_ORDER.map((behavior) => ({
      value: behavior,
      label: PERMISSION_BEHAVIORS[behavior].label,
      count: counts[behavior],
      icon: BEHAVIOR_ICONS[behavior],
    })),
    ...(denials
      ? [
          {
            value: 'denials' as const,
            label: labels.denials,
            count: denials.length,
            icon: <IconHistory size={16} />,
          },
        ]
      : []),
    ...(directories
      ? [
          {
            value: 'workspace' as const,
            label: labels.workspace,
            count: directories.length,
            icon: <IconFolder size={16} />,
          },
        ]
      : []),
  ];

  const renderRule = (rule: PermissionRule) => {
    const readOnly = PERMISSION_SCOPES[rule.scope].readOnly;
    const pending = rowActions.isPending(ruleKey(rule));
    const actions: EntityListItemAction[] = readOnly
      ? []
      : [
          ...(onSaveRule
            ? [
                {
                  label: labels.edit,
                  icon: <IconEdit size={14} />,
                  disabled: pending,
                  onClick: () => openWizard(rule),
                },
              ]
            : []),
          ...(onChangeScope
            ? EDITABLE_PERMISSION_SCOPES.filter((scope) => scope !== rule.scope).map((scope) => ({
                label: `${labels.moveTo} ${PERMISSION_SCOPES[scope].label}`,
                icon: <IconArrowsExchange size={14} />,
                disabled: pending,
                onClick: () => rowActions.run(ruleKey(rule), () => onChangeScope(rule, scope)),
              }))
            : []),
          ...(onDeleteRule
            ? [
                {
                  label: labels.delete,
                  icon: <IconTrash size={14} />,
                  color: 'red',
                  disabled: pending,
                  onClick: () => askConfirm({ kind: 'rule', rule }),
                },
              ]
            : []),
        ];
    return (
      <EntityListItem
        title={<Code className={classes.rule}>{formatRule(rule)}</Code>}
        description={readOnly ? `${describeRule(rule)} · ${labels.readOnly}` : describeRule(rule)}
        descriptionLines={2}
        badges={PERMISSION_SCOPES[rule.scope].readOnly && <ScopeBadge scope={rule.scope} />}
        meta={rowPending(ruleKey(rule))}
        actions={actions}
      />
    );
  };

  const rulesPanel = (behavior: PermissionBehavior) => (
    <EntityList
      items={rules.filter((rule) => rule.behavior === behavior)}
      getId={(rule) => rule.id}
      renderItem={renderRule}
      loading={loading}
      error={error}
      onRetry={onRetry}
      groupBy={(rule) => PERMISSION_SCOPES[rule.scope].label}
      groupOrder={scopeGroupOrder}
      search={{
        value: query,
        onChange: setQuery,
        placeholder: labels.search,
        filter: matchesRuleQuery,
      }}
      toolbar={
        onSaveRule && (
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => openWizard({ behavior })}
            className={classes.noShrink}
          >
            {labels.addRule}
          </Button>
        )
      }
      empty={{
        title: labels.emptyRulesTitle,
        description: labels.emptyRulesDescription,
        icon: BEHAVIOR_ICONS[behavior],
        action: onSaveRule && (
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={14} />}
            onClick={() => openWizard({ behavior })}
          >
            {labels.addRule}
          </Button>
        ),
      }}
      ariaLabel={PERMISSION_BEHAVIORS[behavior].label}
    />
  );

  const denialsPanel = denials && (
    <EntityList
      items={denials}
      getId={(denial) => denial.id}
      loading={loading}
      error={error}
      onRetry={onRetry}
      ariaLabel={labels.denials}
      empty={{
        title: labels.emptyDenialsTitle,
        description: labels.emptyDenialsDescription,
        icon: <IconHistory size={20} />,
      }}
      renderItem={(denial) => (
        <EntityListItem
          title={
            <Group component="span" gap={6} wrap="nowrap" className={classes.denialTitle}>
              <Text component="span" size="sm" fw={500} className={classes.noShrink}>
                {denial.toolName}
              </Text>
              <Code className={classes.input}>{denial.input}</Code>
            </Group>
          }
          description={[denial.reason, formatTime(denial.at)].filter(Boolean).join(' · ')}
          descriptionLines={1}
          meta={
            onSaveRule && (
              <Button
                size="compact-xs"
                variant="light"
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  openWizard({ behavior: 'allow', ...suggestRuleFromDenial(denial) });
                }}
              >
                {labels.allowThis}
              </Button>
            )
          }
        />
      )}
    />
  );

  const handleAddDirectory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onAddDirectory || addingDirectory) {
      return;
    }
    const problem = validateDirectoryPath(directoryPath, directories);
    setDirectoryError(problem);
    if (problem) {
      return;
    }
    setAddingDirectory(true);
    try {
      await onAddDirectory({ path: directoryPath.trim(), scope: directoryScope });
      setDirectoryPath('');
    } catch (reason) {
      setDirectoryError(getErrorMessage(reason, labels.error));
    } finally {
      setAddingDirectory(false);
    }
  };

  const workspacePanel = directories && (
    <Stack gap="sm">
      {onAddDirectory && (
        <Box component="form" onSubmit={handleAddDirectory} noValidate>
          <Group gap="xs" align="flex-start" wrap={isNarrow ? 'wrap' : 'nowrap'}>
            <TextInput
              flex={1}
              miw={isNarrow ? '100%' : 0}
              value={directoryPath}
              placeholder={labels.directoryPlaceholder}
              aria-label={labels.directoryPlaceholder}
              error={directoryError}
              classNames={{ input: classes.pathInput }}
              onChange={(event) => {
                setDirectoryPath(event.currentTarget.value);
                if (directoryError) {
                  setDirectoryError(null);
                }
              }}
            />
            <Select
              flex={isNarrow ? 1 : undefined}
              className={isNarrow ? undefined : classes.scopeSelect}
              aria-label={labels.directoryScope}
              data={EDITABLE_PERMISSION_SCOPES.map((scope) => ({
                value: scope,
                label: PERMISSION_SCOPES[scope].label,
              }))}
              value={directoryScope}
              allowDeselect={false}
              onChange={(value) => value && setDirectoryScope(value as PermissionScope)}
            />
            <Button type="submit" loading={addingDirectory} leftSection={<IconPlus size={14} />}>
              {labels.addDirectory}
            </Button>
          </Group>
        </Box>
      )}
      <EntityList
        items={directories}
        getId={(directory) => directory.path}
        loading={loading}
        error={error}
        onRetry={onRetry}
        ariaLabel={labels.workspace}
        empty={{
          title: labels.emptyDirectoriesTitle,
          description: labels.emptyDirectoriesDescription,
          icon: <IconFolder size={20} />,
        }}
        renderItem={(directory) => {
          const readOnly = PERMISSION_SCOPES[directory.scope].readOnly;
          return (
            <EntityListItem
              icon={<IconFolder size={16} />}
              title={
                <Text component="span" size="sm" ff="monospace" className={classes.path}>
                  {directory.path}
                </Text>
              }
              description={readOnly ? labels.readOnly : undefined}
              badges={<ScopeBadge scope={directory.scope} />}
              meta={rowPending(directoryKey(directory))}
              actions={
                onRemoveDirectory && !readOnly
                  ? [
                      {
                        label: labels.remove,
                        icon: <IconTrash size={14} />,
                        color: 'red',
                        disabled: rowActions.isPending(directoryKey(directory)),
                        onClick: () => askConfirm({ kind: 'directory', directory }),
                      },
                    ]
                  : []
              }
            />
          );
        }}
      />
    </Stack>
  );

  const panelContent = (value: PermissionRulesTab) => {
    if (value === 'denials') {
      return denialsPanel;
    }
    return value === 'workspace' ? workspacePanel : rulesPanel(value);
  };

  return (
    <Stack ref={ref} gap="md" className={cx(classes.root, className)} style={style}>
      <Stack gap={4}>
        <Title order={2} size="h4">
          {labels.title}
        </Title>
        <Text size="sm" c="dimmed">
          {labels.description}
        </Text>
      </Stack>

      {rowActions.error && (
        <Alert
          color="red"
          variant="light"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          onClose={rowActions.clearError}
        >
          {rowActions.error}
        </Alert>
      )}

      {isNarrow ? (
        <Stack gap="md">
          <Select
            className={classes.measured}
            data-measuring={width === 0 || undefined}
            aria-label={labels.tabs}
            data={tabs.map((item) => ({
              value: item.value,
              label: item.count === undefined ? item.label : `${item.label} (${item.count})`,
            }))}
            value={tab}
            allowDeselect={false}
            onChange={(value) => value && setTab(value as PermissionRulesTab)}
          />
          {panelContent(tab)}
        </Stack>
      ) : (
        <Tabs
          value={tab}
          onChange={(value) => value && setTab(value as PermissionRulesTab)}
          keepMounted={false}
        >
          <Tabs.List
            aria-label={labels.tabs}
            className={classes.measured}
            data-measuring={width === 0 || undefined}
          >
            {tabs.map((item) => (
              <Tabs.Tab
                key={item.value}
                value={item.value}
                leftSection={item.icon}
                rightSection={
                  item.count !== undefined && (
                    <Badge size="xs" variant="light" color="gray" circle={item.count < 10}>
                      {item.count}
                    </Badge>
                  )
                }
              >
                {item.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          {tabs.map((item) => (
            <Tabs.Panel key={item.value} value={item.value} pt="md">
              {panelContent(item.value)}
            </Tabs.Panel>
          ))}
        </Tabs>
      )}

      <ConfirmDialog
        opened={confirmOpened}
        onClose={() => setConfirmOpened(false)}
        danger
        title={
          confirmTarget?.kind === 'directory' ? labels.removeDirectoryTitle : labels.deleteRuleTitle
        }
        confirmLabel={confirmTarget?.kind === 'directory' ? labels.remove : labels.delete}
        cancelLabel={labels.cancel}
        errorLabel={labels.error}
        message={
          confirmTarget?.kind === 'rule' ? (
            <>
              <Code>{formatRule(confirmTarget.rule)}</Code>{' '}
              {labels.deleteRuleMessage.replace(
                '{scope}',
                PERMISSION_SCOPES[confirmTarget.rule.scope].label
              )}
            </>
          ) : confirmTarget?.kind === 'directory' ? (
            <>
              <Code>{confirmTarget.directory.path}</Code> {labels.removeDirectoryMessage}
            </>
          ) : null
        }
        onConfirm={confirmAction}
      />

      {onSaveRule && (
        <AddPermissionRuleWizard
          opened={wizardOpened}
          onClose={() => setWizardOpened(false)}
          initialRule={draft}
          knownTools={knownTools}
          labels={wizardLabels}
          onSubmit={(rule) => onSaveRule(rule, draft?.id ? 'edit' : 'create')}
        />
      )}
    </Stack>
  );
});

PermissionRulesPanel.displayName = 'PermissionRulesPanel';
