import type { AgentUiStatus } from '../primitives/StatusBadge/status-meta';
import type {
  BackgroundTask,
  BackgroundTaskGroup,
  BackgroundTaskHiddenSummary,
  BackgroundTaskKind,
  BackgroundTaskLabels,
  BackgroundTaskProgress,
  BackgroundTaskStatus,
  BackgroundTaskSummary,
} from './types';

export const DEFAULT_TASK_LABELS: BackgroundTaskLabels = {
  title: 'Background tasks',
  groupRunning: 'Running',
  groupQueued: 'Queued',
  groupFinished: 'Finished',
  statusQueued: 'Queued',
  statusRunning: 'Running',
  statusCompleted: 'Completed',
  statusFailed: 'Failed',
  statusCancelled: 'Cancelled',
  kindAll: 'All',
  kindShell: 'Shell',
  kindAgent: 'Agent',
  kindRemote: 'Remote',
  kindWorkflow: 'Workflow',
  kindFilter: 'Task kind',
  search: 'Search tasks',
  emptyTitle: 'No background tasks',
  emptyDescription: 'Shell commands and subagents started by the agent appear here',
  noResults: 'No matching tasks',
  stop: 'Stop',
  retry: 'Retry',
  remove: 'Remove',
  actions: 'Task actions',
  output: 'Output',
  subtasks: 'Subtasks',
  noOutput: 'No output yet',
  copy: 'Copy output',
  copied: 'Copied',
  scrollToLatest: 'Scroll to latest',
  tokens: 'tokens',
  toolUses: 'tool uses',
  expand: 'Expand',
  collapse: 'Collapse',
  back: 'All tasks',
  selectTask: 'Select a task',
  selectTaskDescription: 'Its output and subtasks will appear here',
  pillRunning: 'running',
  pillQueued: 'queued',
  pillFailed: 'failed',
  pillCompleted: 'done',
  pillEmpty: 'No tasks',
  loadRetry: 'Retry',
  blockedBy: 'Blocked by',
  hiddenRunning: 'in progress',
  hiddenQueued: 'pending',
  hiddenFinished: 'done',
  showAllTasks: 'Show all',
  showFewerTasks: 'Show fewer',
  messages: 'Messages',
  steerPlaceholder: 'Send instruction to this agent',
  steerSend: 'Send',
  showMessage: 'Show message',
  hideMessage: 'Hide message',
  broadcast: 'everyone',
  dismiss: 'Dismiss',
  closeSearch: 'Close search',
};

export const RECENT_COMPLETION_MS = 30_000;

const GROUP_ORDER: BackgroundTaskGroup[] = ['running', 'queued', 'finished'];

export const BACKGROUND_TASK_KINDS: BackgroundTaskKind[] = ['shell', 'agent', 'remote', 'workflow'];

const STATUS_TO_UI: Record<BackgroundTaskStatus, AgentUiStatus> = {
  queued: 'pending',
  running: 'running',
  completed: 'success',
  failed: 'error',
  cancelled: 'disabled',
};

export function getTaskUiStatus(status: BackgroundTaskStatus): AgentUiStatus {
  return STATUS_TO_UI[status] ?? 'idle';
}

export function getTaskStatusLabel(
  status: BackgroundTaskStatus,
  labels: BackgroundTaskLabels
): string {
  switch (status) {
    case 'queued':
      return labels.statusQueued;
    case 'running':
      return labels.statusRunning;
    case 'completed':
      return labels.statusCompleted;
    case 'failed':
      return labels.statusFailed;
    case 'cancelled':
      return labels.statusCancelled;
  }
}

export function getTaskKindLabel(kind: BackgroundTaskKind, labels: BackgroundTaskLabels): string {
  switch (kind) {
    case 'shell':
      return labels.kindShell;
    case 'agent':
      return labels.kindAgent;
    case 'remote':
      return labels.kindRemote;
    case 'workflow':
      return labels.kindWorkflow;
  }
}

export function isTaskActive(status: BackgroundTaskStatus): boolean {
  return status === 'queued' || status === 'running';
}

export function canStopTask(task: BackgroundTask): boolean {
  return isTaskActive(task.status);
}

export function canRetryTask(task: BackgroundTask): boolean {
  return task.status === 'failed' || task.status === 'cancelled';
}

export function getTaskGroup(status: BackgroundTaskStatus): BackgroundTaskGroup {
  if (status === 'running') {
    return 'running';
  }
  return status === 'queued' ? 'queued' : 'finished';
}

/** Counts tasks by status; pass `flattenTaskTree(tasks)` to include subtasks */
export function summarizeTasks(tasks: BackgroundTask[]): BackgroundTaskSummary {
  const summary: BackgroundTaskSummary = {
    total: 0,
    queued: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  };
  for (const task of tasks) {
    summary.total++;
    summary[task.status]++;
  }
  return summary;
}

/** Depth-first list of every task in the tree, children removed and `parentId` filled in */
export function flattenTaskTree(tasks: BackgroundTask[]): BackgroundTask[] {
  const out: BackgroundTask[] = [];
  const visit = (task: BackgroundTask, parentId: string | undefined) => {
    const { children, ...rest } = task;
    out.push({ ...rest, parentId: rest.parentId ?? parentId });
    children?.forEach((child) => visit(child, task.id));
  };
  tasks.forEach((task) => visit(task, undefined));
  return out;
}

/** Nests a flat list by `parentId`; unknown parents and cycles make a task a root, order is kept */
export function buildTaskTree(flat: BackgroundTask[]): BackgroundTask[] {
  const byId = new Map(flat.map((task) => [task.id, task]));
  const hasCycle = (task: BackgroundTask) => {
    const seen = new Set([task.id]);
    let parentId = task.parentId;
    while (parentId !== undefined && byId.has(parentId)) {
      if (seen.has(parentId)) {
        return true;
      }
      seen.add(parentId);
      parentId = byId.get(parentId)!.parentId;
    }
    return false;
  };

  const nodes = new Map<string, BackgroundTask>(
    flat.map((task) => [task.id, { ...task, children: [] }])
  );
  const roots: BackgroundTask[] = [];
  for (const task of flat) {
    const node = nodes.get(task.id)!;
    const parent = task.parentId !== undefined ? nodes.get(task.parentId) : undefined;
    if (parent && parent !== node && !hasCycle(task)) {
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  }
  for (const node of nodes.values()) {
    if (node.children!.length === 0) {
      delete node.children;
    }
  }
  return roots;
}

export function findTask(
  tasks: BackgroundTask[],
  id: string | null | undefined
): BackgroundTask | undefined {
  if (!id) {
    return undefined;
  }
  for (const task of tasks) {
    if (task.id === id) {
      return task;
    }
    const nested = task.children ? findTask(task.children, id) : undefined;
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

export function findParentTask(
  tasks: BackgroundTask[],
  id: string | null | undefined
): BackgroundTask | undefined {
  if (!id) {
    return undefined;
  }
  for (const task of tasks) {
    if (task.children?.some((child) => child.id === id)) {
      return task;
    }
    const nested = task.children ? findParentTask(task.children, id) : undefined;
    if (nested) {
      return nested;
    }
  }
  return undefined;
}

export function toTimestamp(value: number | Date | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value instanceof Date ? value.getTime() : value;
}

export function getTaskElapsedMs(
  task: Pick<BackgroundTask, 'startedAt' | 'endedAt'>,
  now: number
): number | undefined {
  const start = toTimestamp(task.startedAt);
  if (start === undefined) {
    return undefined;
  }
  return Math.max(0, (toTimestamp(task.endedAt) ?? now) - start);
}

/** Progress as a 0–100 percentage */
export function getProgressPercent(progress: BackgroundTaskProgress): number {
  const max = progress.max ?? 100;
  if (max <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (progress.value / max) * 100));
}

export function countTasksByKind(tasks: BackgroundTask[]): Record<BackgroundTaskKind, number> {
  const counts: Record<BackgroundTaskKind, number> = { shell: 0, agent: 0, remote: 0, workflow: 0 };
  for (const task of tasks) {
    counts[task.kind]++;
  }
  return counts;
}

export function matchesTaskQuery(task: BackgroundTask, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return [task.title, task.description, task.lastActivity].some((text) =>
    text?.toLowerCase().includes(needle)
  );
}

/** Parts of the compact status text, for example `['2 running', '1 failed']` */
export function describeTaskSummary(
  summary: BackgroundTaskSummary,
  labels: BackgroundTaskLabels
): string[] {
  const parts: string[] = [];
  if (summary.running > 0) {
    parts.push(`${summary.running} ${labels.pillRunning}`);
  }
  if (summary.queued > 0) {
    parts.push(`${summary.queued} ${labels.pillQueued}`);
  }
  if (summary.failed > 0) {
    parts.push(`${summary.failed} ${labels.pillFailed}`);
  }
  if (parts.length === 0 && summary.completed > 0) {
    parts.push(`${summary.completed} ${labels.pillCompleted}`);
  }
  return parts;
}

/** Completed within the last `windowMs`, `30s` by default */
export function isRecentlyCompleted(
  task: Pick<BackgroundTask, 'status' | 'endedAt'>,
  now: number,
  windowMs = RECENT_COMPLETION_MS
): boolean {
  const ended = toTimestamp(task.endedAt);
  return (
    task.status === 'completed' && ended !== undefined && now - ended <= windowMs && now >= ended
  );
}

/** Titles of unfinished tasks from `blockedBy`, looked up anywhere in the tree; unknown ids are shown as is */
export function getOpenBlockers(task: BackgroundTask, tasks: BackgroundTask[]): string[] {
  return (task.blockedBy ?? []).flatMap((id) => {
    const blocker = findTask(tasks, id);
    if (blocker && getTaskGroup(blocker.status) === 'finished') {
      return [];
    }
    return [blocker?.title ?? id];
  });
}

/** Stable order: running, then queued, then finished */
export function orderTasksByGroup(tasks: BackgroundTask[]): BackgroundTask[] {
  return GROUP_ORDER.flatMap((group) =>
    tasks.filter((task) => getTaskGroup(task.status) === group)
  );
}

/** First `maxVisible` tasks in group order and counts of the rest per group */
export function limitTasks(
  tasks: BackgroundTask[],
  maxVisible: number
): { visible: BackgroundTask[]; hidden: BackgroundTaskHiddenSummary } {
  const ordered = orderTasksByGroup(tasks);
  const visible = maxVisible > 0 ? ordered.slice(0, maxVisible) : ordered;
  const hidden: BackgroundTaskHiddenSummary = { running: 0, queued: 0, finished: 0 };
  for (const task of ordered.slice(visible.length)) {
    hidden[getTaskGroup(task.status)]++;
  }
  return { visible, hidden };
}

/** For example `+2 in progress, 5 pending`, empty when nothing is hidden */
export function describeHiddenTasks(
  hidden: BackgroundTaskHiddenSummary,
  labels: BackgroundTaskLabels
): string {
  const parts = [
    hidden.running > 0 ? `${hidden.running} ${labels.hiddenRunning}` : '',
    hidden.queued > 0 ? `${hidden.queued} ${labels.hiddenQueued}` : '',
    hidden.finished > 0 ? `${hidden.finished} ${labels.hiddenFinished}` : '',
  ].filter(Boolean);
  return parts.length > 0 ? `+${parts.join(', ')}` : '';
}
