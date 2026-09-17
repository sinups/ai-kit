import React, { memo, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Group, Progress, Stack, Tabs, Text, Textarea } from '@mantine/core';
import { IconAlertCircle, IconPlayerStop, IconRefresh, IconSend } from '@tabler/icons-react';
import { usePendingActions } from '../../hooks/use-pending-actions';
import { ShellOutput } from '../../tools/ShellOutput';
import { StatusBadge } from '../../primitives/StatusBadge/StatusBadge';
import { cx } from '../../utils/cx';
import { formatTokens } from '../../utils/format-tokens';
import { AgentMessage } from '../AgentMessage/AgentMessage';
import { AgentTree } from '../AgentTree/AgentTree';
import { TaskElapsed, TaskKindIcon } from '../TaskMeta';
import {
  canRetryTask,
  canStopTask,
  DEFAULT_TASK_LABELS,
  getOpenBlockers,
  getProgressPercent,
  getTaskKindLabel,
  getTaskStatusLabel,
  getTaskUiStatus,
} from '../task-utils';
import type { BackgroundTask, BackgroundTaskLabels } from '../types';
import classes from './TaskDetail.module.css';

export interface TaskDetailProps {
  /** Task to show */
  task: BackgroundTask;
  /** Stops the task, the button is shown for queued and running tasks when set */
  onStop?: (task: BackgroundTask) => void | Promise<void>;
  /** Retries the task, the button is shown for failed and cancelled tasks when set */
  onRetry?: (task: BackgroundTask) => void | Promise<void>;
  /** Called when a subtask is chosen in the Subtasks tab */
  onSelectSubtask?: (task: BackgroundTask) => void;
  /** Tab opened first, `output` by default */
  defaultTab?: 'output' | 'subtasks' | 'messages';
  /** Maximum height of the expanded output log, `320` by default */
  outputHeight?: number | string;
  /** Output lines shown from the end before "Show all", `20` by default */
  outputLines?: number;
  /** Every task of the tree, used to name the tasks in `blockedBy` */
  allTasks?: BackgroundTask[];
  /** Sends an instruction to a running agent task, renders the instruction field when set */
  onSteer?: (taskId: string, text: string) => void | Promise<void>;
  /** Overrides of the default English labels */
  labels?: Partial<BackgroundTaskLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Background task header with stats and actions, error, output log and subtask tree */
export const TaskDetail = memo(function TaskDetail({
  task,
  onStop,
  onRetry,
  onSelectSubtask,
  defaultTab = 'output',
  outputHeight = 320,
  outputLines = 20,
  onSteer,
  allTasks,
  labels: labelsProp,
  className,
  style,
}: TaskDetailProps) {
  const labels = useMemo(() => ({ ...DEFAULT_TASK_LABELS, ...labelsProp }), [labelsProp]);
  const actions = usePendingActions();
  const subtasks = task.children ?? [];
  const messages = task.messages ?? [];
  const blockers = task.status === 'queued' ? getOpenBlockers(task, allTasks ?? []) : [];
  const [tab, setTab] = useState<string | null>(defaultTab);
  const [instruction, setInstruction] = useState('');
  const canSteer = Boolean(onSteer) && task.kind === 'agent' && task.status === 'running';
  const stopKey = `stop:${task.id}`;
  const retryKey = `retry:${task.id}`;
  const steerKey = `steer:${task.id}`;

  const sendInstruction = () => {
    const text = instruction.trim();
    if (!onSteer || !text || actions.isPending(steerKey)) {
      return;
    }
    void actions.run(steerKey, async () => {
      await onSteer(task.id, text);
      setInstruction('');
    });
  };

  useEffect(() => {
    actions.clearError();
  }, [task.id, actions.clearError]);

  const activeTab =
    (tab === 'subtasks' && subtasks.length === 0) || (tab === 'messages' && messages.length === 0)
      ? 'output'
      : tab;

  return (
    <Stack gap="md" p="md" className={cx(classes.root, className)} style={style}>
      <Stack gap="xs">
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <TaskKindIcon kind={task.kind} size="lg" />
          <Stack gap={4} flex={1} miw={0}>
            <Group gap="xs" wrap="wrap">
              <Text fw={500} size="sm" className={classes.title}>
                {task.title}
              </Text>
              <StatusBadge
                status={getTaskUiStatus(task.status)}
                label={getTaskStatusLabel(task.status, labels)}
              />
            </Group>
            <Group gap={6} wrap="wrap">
              <Text size="xs" c="dimmed">
                {getTaskKindLabel(task.kind, labels)}
              </Text>
              {task.startedAt !== undefined && (
                <Text size="xs" c="dimmed" className={classes.numeric}>
                  · <TaskElapsed task={task} />
                </Text>
              )}
              {task.tokens !== undefined && (
                <Text size="xs" c="dimmed" className={classes.numeric}>
                  · {formatTokens(task.tokens)} {labels.tokens}
                </Text>
              )}
              {task.toolUses !== undefined && (
                <Text size="xs" c="dimmed" className={classes.numeric}>
                  · {task.toolUses} {labels.toolUses}
                </Text>
              )}
            </Group>
          </Stack>
          <Group gap="xs" wrap="nowrap">
            {onStop && canStopTask(task) && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                leftSection={<IconPlayerStop size={14} />}
                loading={actions.isPending(stopKey)}
                onClick={() => actions.run(stopKey, () => onStop(task))}
              >
                {labels.stop}
              </Button>
            )}
            {onRetry && canRetryTask(task) && (
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<IconRefresh size={14} />}
                loading={actions.isPending(retryKey)}
                onClick={() => actions.run(retryKey, () => onRetry(task))}
              >
                {labels.retry}
              </Button>
            )}
          </Group>
        </Group>
        {task.description && (
          <Text size="sm" c="dimmed">
            {task.description}
          </Text>
        )}
        {task.progress && (
          <Stack gap={4}>
            {task.progress.label && (
              <Text size="xs" c="dimmed">
                {task.progress.label}
              </Text>
            )}
            <Progress
              size="sm"
              value={getProgressPercent(task.progress)}
              color={task.status === 'failed' ? 'red' : undefined}
              animated={task.status === 'running'}
              aria-label={task.progress.label ?? task.title}
            />
          </Stack>
        )}
        {blockers.length > 0 && (
          <Text size="xs" c="dimmed">
            {labels.blockedBy} {blockers.join(', ')}
          </Text>
        )}
        {task.status === 'running' && task.lastActivity && (
          <Text size="xs" c="dimmed">
            {task.lastActivity}
          </Text>
        )}
      </Stack>

      {canSteer && (
        <Group gap="xs" wrap="nowrap" align="flex-end">
          <Textarea
            flex={1}
            miw={0}
            size="xs"
            classNames={{ input: classes.steerInput }}
            autosize
            minRows={1}
            maxRows={4}
            value={instruction}
            placeholder={labels.steerPlaceholder}
            aria-label={labels.steerPlaceholder}
            disabled={actions.isPending(steerKey)}
            onChange={(event) => setInstruction(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                sendInstruction();
              }
            }}
          />
          <Button
            size="md"
            variant="light"
            leftSection={<IconSend size={14} />}
            loading={actions.isPending(steerKey)}
            disabled={!instruction.trim()}
            onClick={sendInstruction}
          >
            {labels.steerSend}
          </Button>
        </Group>
      )}

      {task.error && (
        <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
          {task.error}
        </Alert>
      )}
      {actions.error && (
        <Alert
          color="red"
          variant="light"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          closeButtonLabel={labels.dismiss}
          onClose={() => actions.clearError()}
        >
          {actions.error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={setTab} keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="output">{labels.output}</Tabs.Tab>
          {subtasks.length > 0 && (
            <Tabs.Tab
              value="subtasks"
              rightSection={
                <Badge size="xs" variant="light" color="gray" circle={subtasks.length < 10}>
                  {subtasks.length}
                </Badge>
              }
            >
              {labels.subtasks}
            </Tabs.Tab>
          )}
          {messages.length > 0 && (
            <Tabs.Tab
              value="messages"
              rightSection={
                <Badge size="xs" variant="light" color="gray" circle={messages.length < 10}>
                  {messages.length}
                </Badge>
              }
            >
              {labels.messages}
            </Tabs.Tab>
          )}
        </Tabs.List>
        <Tabs.Panel value="output" pt="sm">
          <ShellOutput
            output={task.output ?? ''}
            live={task.status === 'running'}
            exitCode={task.exitCode}
            maxLines={outputLines}
            maxHeight={outputHeight}
            labels={{
              noOutput: labels.noOutput,
              copy: labels.copy,
              copied: labels.copied,
              scrollToLatest: labels.scrollToLatest,
              running: labels.statusRunning,
            }}
          />
        </Tabs.Panel>
        {subtasks.length > 0 && (
          <Tabs.Panel value="subtasks" pt="sm">
            <AgentTree tasks={subtasks} onSelect={onSelectSubtask} labels={labelsProp} />
          </Tabs.Panel>
        )}
        {messages.length > 0 && (
          <Tabs.Panel value="messages" pt="sm">
            <Stack gap="lg">
              {messages.map((message) => (
                <AgentMessage key={message.id} message={message} labels={labelsProp} />
              ))}
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>
    </Stack>
  );
});

TaskDetail.displayName = 'TaskDetail';
