import React, { memo, useMemo, useState } from 'react';
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Code,
  EmptyState,
  Group,
  Loader,
  Skeleton,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconEdit,
  IconMessageChatbot,
  IconPlus,
  IconTerminal2,
  IconTrash,
  IconWebhook,
} from '@tabler/icons-react';
import { usePendingActions } from '../hooks/use-pending-actions';
import { ConfirmDialog } from '../primitives/ConfirmDialog/ConfirmDialog';
import { EntityList } from '../primitives/EntityList/EntityList';
import { EntityListItem } from '../primitives/EntityList/EntityListItem';
import { cx } from '../utils/cx';
import {
  DEFAULT_HOOK_MESSAGES,
  countHooksByEvent,
  describeMatcher,
  getHookEventText,
  getHookScopeText,
  getHookSummary,
  type HookMessages,
} from './hook-wizard';
import { HookWizard, type HookWizardLabels } from './HookWizard';
import {
  HOOK_EVENTS,
  HOOK_EVENT_ORDER,
  type HookConfig,
  type HookEvent,
  type HookEventTextOverrides,
  type HookScopeTextOverrides,
} from './types';
import classes from './HooksPanel.module.css';
import { formatTemplate } from '../utils/format-template';

export type HookSaveMode = 'create' | 'edit';

export interface HooksPanelLabels {
  title: string;
  description: string;
  addHook: string;
  edit: string;
  delete: string;
  enabled: string;
  retry: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyEvent: string;
  command: string;
  prompt: string;
  error: string;
  cancel: string;
  pending: string;
  /** Title of the delete confirmation */
  deleteTitle: string;
  /** Delete confirmation text after the hook summary, `{event}` is replaced with the event label */
  deleteMessage: string;
  dismiss: string;
  events: HookEventTextOverrides;
  scopes: HookScopeTextOverrides;
  messages: Partial<HookMessages>;
}

export interface HooksPanelProps {
  /** Configured hooks of all events */
  hooks: HookConfig[];
  /** Shows skeleton rows instead of hooks */
  loading?: boolean;
  /** Error message shown instead of hooks */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetry?: () => void;
  /** Called with a hook created or edited in the wizard, add and edit actions are hidden when omitted */
  onSave?: (hook: HookConfig, mode: HookSaveMode) => void | Promise<void>;
  /** Called by the delete action, the action is hidden when omitted */
  onDelete?: (hook: HookConfig) => void | Promise<void>;
  /** Called by the enabled switch, the switch is read-only when omitted */
  onToggle?: (hook: HookConfig, enabled: boolean) => void | Promise<void>;
  /** Tool names suggested for matchers in the wizard */
  knownTools?: string[];
  /** Events expanded initially, events with hooks by default */
  defaultExpanded?: HookEvent[];
  /** Overrides for the English labels of the panel */
  labels?: Partial<HooksPanelLabels>;
  /** Overrides for the English labels of the wizard */
  wizardLabels?: Partial<HookWizardLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const DEFAULT_LABELS: HooksPanelLabels = {
  title: 'Hooks',
  description: 'Commands and prompts that run automatically on agent events.',
  addHook: 'Add hook',
  edit: 'Edit',
  delete: 'Delete',
  enabled: 'Enabled',
  retry: 'Retry',
  emptyTitle: 'No hooks yet',
  emptyDescription:
    'Run formatters after edits, block risky commands or add context on session start.',
  emptyEvent: 'No hooks for this event',
  command: 'command',
  prompt: 'prompt',
  error: 'Something went wrong',
  cancel: 'Cancel',
  pending: 'Saving',
  deleteTitle: 'Delete hook',
  deleteMessage: 'will no longer run on {event}.',
  dismiss: 'Dismiss',
  events: {},
  scopes: {},
  messages: {},
};

/** Hooks grouped by event with counters, per-hook enable switch, edit and delete, and a wizard to add hooks */
export const HooksPanel = memo(function HooksPanel({
  hooks,
  loading = false,
  error,
  onRetry,
  onSave,
  onDelete,
  onToggle,
  knownTools,
  defaultExpanded,
  labels: labelsProp,
  wizardLabels,
  className,
  style,
}: HooksPanelProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const messages = { ...DEFAULT_HOOK_MESSAGES, ...labels.messages };
  const wizardText = useMemo(
    () => ({
      events: labels.events,
      scopes: labels.scopes,
      messages: labels.messages,
      ...wizardLabels,
    }),
    [labels.events, labels.scopes, labels.messages, wizardLabels]
  );
  const [wizardOpened, setWizardOpened] = useState(false);
  const [draft, setDraft] = useState<Partial<HookConfig> | undefined>(undefined);
  const [expanded, setExpanded] = useState<string[] | null>(defaultExpanded ?? null);
  const [deleteTarget, setDeleteTarget] = useState<HookConfig | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const rowActions = usePendingActions(labels.error);

  const counts = useMemo(() => countHooksByEvent(hooks), [hooks]);
  const expandedEvents = expanded ?? HOOK_EVENT_ORDER.filter((event) => counts[event] > 0);

  const openWizard = (hook?: Partial<HookConfig>) => {
    setDraft(hook);
    setWizardOpened(true);
  };

  const addButton = onSave && (
    <Button
      size="xs"
      leftSection={<IconPlus size={14} />}
      onClick={() => openWizard()}
      className={classes.add}
    >
      {labels.addHook}
    </Button>
  );

  const renderHook = (hook: HookConfig) => {
    const matcher = describeMatcher(hook.matcher, messages);
    const supportsMatcher = HOOK_EVENTS[hook.event].supportsMatcher;
    const enabled = hook.enabled !== false;
    const pending = rowActions.isPending(hook.id);
    const actions = [
      ...(onSave
        ? [
            {
              label: labels.edit,
              icon: <IconEdit size={14} />,
              disabled: pending,
              onClick: () => openWizard(hook),
            },
          ]
        : []),
      ...(onDelete
        ? [
            {
              label: labels.delete,
              icon: <IconTrash size={14} />,
              color: 'red',
              disabled: pending,
              onClick: () => {
                setDeleteTarget(hook);
                setDeleteOpened(true);
              },
            },
          ]
        : []),
    ];
    return (
      <EntityListItem
        title={
          supportsMatcher ? (
            <Code className={classes.matcher}>{matcher}</Code>
          ) : (
            <Text component="span" size="sm" fw={500}>
              {hook.type === 'command' ? labels.command : labels.prompt}
            </Text>
          )
        }
        description={
          <Text
            component="span"
            size="xs"
            c="dimmed"
            className={hook.type === 'command' ? classes.command : undefined}
          >
            {getHookSummary(hook)}
          </Text>
        }
        descriptionLines={1}
        icon={
          hook.type === 'command' ? (
            <IconTerminal2 size={16} aria-label={labels.command} />
          ) : (
            <IconMessageChatbot size={16} aria-label={labels.prompt} />
          )
        }
        badges={
          <Badge size="xs" variant="light" color="gray" className={classes.badge}>
            {getHookScopeText(hook.scope, labels.scopes).label}
          </Badge>
        }
        meta={
          <Group gap={6} wrap="nowrap">
            {pending && <Loader size="xs" aria-label={labels.pending} />}
            <Switch
              size="xs"
              checked={enabled}
              disabled={!onToggle || pending}
              aria-label={`${labels.enabled}: ${supportsMatcher ? matcher : getHookSummary(hook)}`}
              onClick={(clickEvent) => clickEvent.stopPropagation()}
              onChange={(changeEvent) => {
                const checked = changeEvent.currentTarget.checked;
                if (onToggle) {
                  rowActions.run(hook.id, () => onToggle(hook, checked));
                }
              }}
            />
          </Group>
        }
        actions={actions.length > 0 ? actions : undefined}
        className={enabled ? undefined : classes.disabled}
      />
    );
  };

  let body: React.ReactNode;
  if (loading) {
    body = (
      <Stack gap="xs" aria-busy="true">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={44} radius="md" />
        ))}
      </Stack>
    );
  } else if (error) {
    body = (
      <Alert color="red" variant="light" icon={<IconAlertCircle size={18} />}>
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error}</Text>
          {onRetry && (
            <Button size="xs" variant="default" onClick={onRetry}>
              {labels.retry}
            </Button>
          )}
        </Stack>
      </Alert>
    );
  } else if (hooks.length === 0) {
    body = (
      <EmptyState
        size="sm"
        py="xl"
        icon={<IconWebhook size={20} />}
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      >
        {addButton && <EmptyState.Actions>{addButton}</EmptyState.Actions>}
      </EmptyState>
    );
  } else {
    body = (
      <Accordion
        multiple
        variant="default"
        value={expandedEvents}
        onChange={setExpanded}
        classNames={{ control: classes.eventControl, content: classes.eventContent }}
      >
        {HOOK_EVENT_ORDER.map((eventName) => {
          const event = getHookEventText(eventName, labels.events);
          const eventHooks = hooks.filter((hook) => hook.event === eventName);
          return (
            <Accordion.Item key={eventName} value={eventName}>
              <Accordion.Control>
                <Group gap="xs" wrap="nowrap" justify="space-between" pr="xs">
                  <Stack gap={0} miw={0}>
                    <Text size="sm" fw={500} truncate>
                      {event.label}
                    </Text>
                    <Text size="xs" c="dimmed" ff="monospace" truncate>
                      {eventName}
                    </Text>
                  </Stack>
                  <Badge size="sm" variant="light" color="gray" circle>
                    {eventHooks.length}
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                    <Text size="xs" c="dimmed">
                      {event.description}
                    </Text>
                    {onSave && (
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        leftSection={<IconPlus size={12} />}
                        onClick={() => openWizard({ event: eventName })}
                        className={classes.eventAdd}
                      >
                        {labels.addHook}
                      </Button>
                    )}
                  </Group>
                  {eventHooks.length > 0 ? (
                    <EntityList
                      items={eventHooks}
                      getId={(hook) => hook.id}
                      renderItem={renderHook}
                      ariaLabel={event.label}
                    />
                  ) : (
                    <Text size="sm" c="dimmed" ta="center" py="xs">
                      {labels.emptyEvent}
                    </Text>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    );
  }

  return (
    <Stack gap="md" className={cx(classes.root, className)} style={style}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Stack gap={2} miw={0}>
          <Text component="h3" size="sm" fw={500}>
            {labels.title}
          </Text>
          <Text size="xs" c="dimmed">
            {labels.description}
          </Text>
        </Stack>
        {!loading && !error && hooks.length > 0 && addButton}
      </Group>
      {rowActions.error && (
        <Alert
          color="red"
          variant="light"
          icon={<IconAlertCircle size={18} />}
          withCloseButton
          closeButtonLabel={labels.dismiss}
          onClose={rowActions.clearError}
        >
          {rowActions.error}
        </Alert>
      )}
      <Box>{body}</Box>
      <ConfirmDialog
        opened={deleteOpened}
        onClose={() => setDeleteOpened(false)}
        danger
        title={labels.deleteTitle}
        confirmLabel={labels.delete}
        cancelLabel={labels.cancel}
        errorLabel={labels.error}
        message={
          deleteTarget && (
            <>
              <Code>{getHookSummary(deleteTarget)}</Code>{' '}
              {formatTemplate(labels.deleteMessage, {
                event: getHookEventText(deleteTarget.event, labels.events).label,
              })}
            </>
          )
        }
        onConfirm={() =>
          deleteTarget && onDelete
            ? rowActions.run(deleteTarget.id, () => onDelete(deleteTarget), { rethrow: true })
            : undefined
        }
      />
      {onSave && (
        <HookWizard
          opened={wizardOpened}
          onClose={() => setWizardOpened(false)}
          initialHook={draft}
          knownTools={knownTools}
          labels={wizardText}
          onSubmit={(hook) => onSave(hook, draft?.id ? 'edit' : 'create')}
        />
      )}
    </Stack>
  );
});

HooksPanel.displayName = 'HooksPanel';
