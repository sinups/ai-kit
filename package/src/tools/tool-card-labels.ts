/** Titles `ToolRenderer` gives the cards it builds itself: subagent groups and unknown tools */
export interface ToolCardLabels {
  /** Title of a running `Task` call, `Running task` by default */
  taskRunning: string;
  /** Title of a finished `Task` call, `Task completed` by default */
  taskCompleted: string;
  /** Title of a `Task` call stopped before its result, `Task interrupted` by default */
  taskInterrupted: string;
  /** Title of a running `Agent` call, `Running agent` by default */
  agentRunning: string;
  /** Title of a finished `Agent` call, `Agent completed` by default */
  agentCompleted: string;
  /** Title of an `Agent` call stopped before its result, `Agent interrupted` by default */
  agentInterrupted: string;
  /** Title of a running tool the kit has no card for, `{name}` is replaced, `Running {name}` by default */
  running: string;
}

export const DEFAULT_TOOL_CARD_LABELS: ToolCardLabels = {
  taskRunning: 'Running task',
  taskCompleted: 'Task completed',
  taskInterrupted: 'Task interrupted',
  agentRunning: 'Running agent',
  agentCompleted: 'Agent completed',
  agentInterrupted: 'Agent interrupted',
  running: 'Running {name}',
};
