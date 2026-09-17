import type { MantineColor } from '@mantine/core';

export type BackgroundTaskKind = 'shell' | 'agent' | 'remote' | 'workflow';

export type BackgroundTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BackgroundTaskProgress {
  /** Current progress, a percentage when `max` is omitted */
  value: number;
  /** Value that means done, `100` by default */
  max?: number;
  /** Short text such as `3 of 8 files` */
  label?: string;
}

export interface AgentIdentity {
  /** Agent or teammate name */
  name: string;
  /** Mantine color that identifies the agent across the UI */
  color?: MantineColor;
}

export interface AgentMessageData {
  /** Stable unique id */
  id: string;
  /** Sender */
  from: AgentIdentity;
  /** Recipient, omitted for a broadcast */
  to?: AgentIdentity;
  /** One-line summary shown collapsed */
  summary: string;
  /** Full message text revealed on expand */
  content?: string;
  /** Moment the message was sent */
  timestamp?: number | Date;
}

export interface BackgroundTaskHiddenSummary {
  running: number;
  queued: number;
  finished: number;
}

export interface BackgroundTask {
  /** Stable unique id */
  id: string;
  /** What runs the task */
  kind: BackgroundTaskKind;
  /** Short name shown in lists */
  title: string;
  /** Longer explanation of what the task does */
  description?: string;
  /** Lifecycle status */
  status: BackgroundTaskStatus;
  /** Moment the task started running */
  startedAt?: number | Date;
  /** Moment the task finished, elapsed time stops here */
  endedAt?: number | Date;
  /** Determinate progress, omitted for tasks without a known end */
  progress?: BackgroundTaskProgress;
  /** Tokens used by the task, for agent tasks */
  tokens?: number;
  /** Number of tool calls made by the task, for agent tasks */
  toolUses?: number;
  /** Latest thing the task did, one line */
  lastActivity?: string;
  /** Accumulated output log */
  output?: string;
  /** Failure message */
  error?: string;
  /** Exit code of a finished shell task */
  exitCode?: number;
  /** Ids of tasks that must finish before this one can start */
  blockedBy?: string[];
  /** Agent or teammate that owns the task */
  owner?: AgentIdentity;
  /** Messages exchanged with other agents, shown in the Messages tab */
  messages?: AgentMessageData[];
  /** Id of the parent task, used by `buildTaskTree` */
  parentId?: string;
  /** Nested subtasks, for example subagents started by an agent */
  children?: BackgroundTask[];
}

export interface BackgroundTaskSummary {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export type BackgroundTaskGroup = 'running' | 'queued' | 'finished';

export interface BackgroundTaskLabels {
  title: string;
  groupRunning: string;
  groupQueued: string;
  groupFinished: string;
  statusQueued: string;
  statusRunning: string;
  statusCompleted: string;
  statusFailed: string;
  statusCancelled: string;
  kindAll: string;
  kindShell: string;
  kindAgent: string;
  kindRemote: string;
  kindWorkflow: string;
  kindFilter: string;
  search: string;
  emptyTitle: string;
  emptyDescription: string;
  noResults: string;
  stop: string;
  retry: string;
  remove: string;
  actions: string;
  output: string;
  subtasks: string;
  noOutput: string;
  copy: string;
  copied: string;
  scrollToLatest: string;
  tokens: string;
  toolUses: string;
  expand: string;
  collapse: string;
  back: string;
  selectTask: string;
  selectTaskDescription: string;
  pillRunning: string;
  pillQueued: string;
  pillFailed: string;
  pillCompleted: string;
  pillEmpty: string;
  loadRetry: string;
  blockedBy: string;
  hiddenRunning: string;
  hiddenQueued: string;
  hiddenFinished: string;
  showAllTasks: string;
  showFewerTasks: string;
  messages: string;
  steerPlaceholder: string;
  steerSend: string;
  showMessage: string;
  hideMessage: string;
  broadcast: string;
  dismiss: string;
  closeSearch: string;
}
