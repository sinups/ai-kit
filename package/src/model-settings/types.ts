import type React from 'react';
import type { AgentUiStatus } from '../primitives/StatusBadge/status-meta';

export type EffortLevelValue = 'low' | 'medium' | 'high' | 'max' | (string & {});

export type EffortLevel = {
  /** Value passed to `onChange` */
  value: EffortLevelValue;
  /** Short label, for example `High` */
  label: string;
  /** What the level trades off, shown under the control */
  description?: string;
};

export type OutputStyle = {
  /** Value passed to `onChange` */
  id: string;
  /** Style name */
  name: string;
  /** What the style changes about the answers */
  description: string;
  /** Short sample answer in this style */
  example?: string;
};

export type UsagePeriod = 'day' | 'week' | 'month';

export type UsageSummary = {
  /** Tokens used in the period */
  tokens: number;
  /** Cost of the period in `currency` */
  cost?: number;
  /** ISO 4217 currency code, `USD` by default */
  currency?: string;
  /** Number of requests in the period */
  requests?: number;
};

export type UsageLimit = {
  /** Unique limit id */
  id: string;
  /** Limit name, for example `5-hour limit` or `Weekly limit` */
  label: string;
  /** Amount used */
  used: number;
  /** Amount allowed until the reset */
  limit: number;
  /** Unit of `used` and `limit`, `tokens` by default */
  unit?: 'tokens' | 'requests' | 'cost';
  /** When the limit resets */
  resetsAt?: Date | string;
};

export type ModelUsage = {
  /** Model name */
  model: string;
  /** Tokens used by the model */
  tokens: number;
  /** Cost of the model usage */
  cost?: number;
};

export type DailyUsage = {
  /** Day as a date or an ISO date string */
  date: Date | string;
  /** Tokens used on the day */
  tokens: number;
  /** Cost of the day */
  cost?: number;
};

export type StatusMcpServer = {
  /** Server name */
  name: string;
  /** Connection status */
  status: AgentUiStatus;
};

export type StatusMemoryFile = {
  /** File path, for example `~/.agent/AGENTS.md` */
  path: string;
  /** Tokens the file adds to the context */
  tokens?: number;
};

export type StatusAction = {
  /** Button label */
  label: string;
  /** Icon rendered before the label */
  icon?: React.ReactNode;
  /** Runs the action; the button shows a loader until the promise settles */
  onClick: () => void | Promise<void>;
};
