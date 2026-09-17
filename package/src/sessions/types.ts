export type SessionDate = Date | string | number;

export interface SessionSummary {
  /** Unique session id */
  id: string;
  /** Session title */
  title: string;
  /** When the session started */
  createdAt: SessionDate;
  /** When the session last changed, used for date groups and relative time */
  updatedAt: SessionDate;
  /** Number of messages in the session */
  messageCount: number;
  /** Short excerpt of the conversation */
  preview?: string;
  /** Model used in the session */
  model?: string;
  /** Free-form tags, matched by the search */
  tags?: string[];
  /** Pinned sessions are listed first */
  pinned?: boolean;
  /** Archived sessions are only shown by the `archived` filter */
  archived?: boolean;
  /** Git branch the session worked on */
  branch?: string;
  /** Total tokens spent in the session */
  tokenCount?: number;
  /** Total cost in US dollars */
  cost?: number;
}

/** `all` shows sessions that are not archived, `pinned` pinned ones that are not archived, `archived` archived ones */
export type SessionFilter = 'all' | 'pinned' | 'archived';

export type ExportFormat = 'markdown' | 'json' | 'text';

export interface ExportOptions {
  /** Output format */
  format: ExportFormat;
  /** Includes tool calls with their input and output */
  includeToolCalls: boolean;
  /** Includes reasoning parts */
  includeThinking: boolean;
  /** Includes message timestamps */
  includeTimestamps: boolean;
  /** Conversation title written at the top */
  title?: string;
}

export interface ExportResult {
  content: string;
  mimeType: string;
  extension: string;
}
