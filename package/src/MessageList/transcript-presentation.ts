import type React from 'react';
import type { ToolApprovals } from '../approvals/approval-context';
import type { ToolOutputFormatters } from '../rows/tool-output';
import type { ToolCallLookups } from '../tools/tool-call-state';
import type { SyntaxHighlighter } from '../utils/highlighter';
import type { ToolRunLabels } from './tool-runs';

/** One visible part of an assistant message and its position in `parts` */
export type PresentationEntry = { part: unknown; index: number };

/** What a presentation needs to render the parts of one assistant message */
export type PresentationContext = {
  /** Id of the message, for stable keys */
  messageId: string;
  /** `streaming` while the message grows */
  chatStatus?: string;
  /** Transcript lookups of the calls that still wait for a result */
  lookups?: ToolCallLookups;
  /** Approval requests of the host by call id */
  approvals?: ToolApprovals;
  /** Whether running calls show their time and progress */
  showActivity: boolean;
  highlighter?: SyntaxHighlighter;
  wrapLines?: boolean;
  toolOutputs?: ToolOutputFormatters;
  /** Labels of folded runs of calls */
  runLabels?: Partial<ToolRunLabels>;
  /** Moment the latest turn began, set for the messages of that turn; its activity is timed from it */
  turnStartedAt?: number;
};

/**
 * A layout of the transcript other than the cards: it renders the parts of each assistant message
 * and hands the ones it leaves alone back to `renderDefault`.
 */
export interface TranscriptPresentation {
  kind: string;
  renderParts: (
    entries: PresentationEntry[],
    renderDefault: (entry: PresentationEntry) => React.ReactNode,
    context: PresentationContext
  ) => React.ReactNode[];
  /** Whether the parts of the latest message already show that the agent works, so the working row stays hidden */
  showsActivity?: (parts: unknown[]) => boolean;
}
