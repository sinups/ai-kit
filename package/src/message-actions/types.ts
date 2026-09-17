import type React from 'react';

export type MessageFeedbackValue = 'up' | 'down';

export type FeedbackReason = {
  /** Value reported in `FeedbackDetails.reasons` */
  value: string;
  /** Chip label */
  label: string;
};

export type FeedbackDetails = {
  /** Values of the selected reasons */
  reasons: string[];
  /** Free-form comment, trimmed; empty when the user wrote nothing */
  comment: string;
};

export type RewindMode = 'conversation' | 'conversation-and-code';

export type RewindRequest = {
  /** Id of the user message the conversation returns to; that message and everything after it is removed */
  messageId: string;
  /** Whether only the conversation or also file changes made after the point are restored */
  mode: RewindMode;
};

export type SummarizeDirection = 'from' | 'up-to';

export type SummarizeRequest = {
  /** Id of the user message the summary starts from or ends at */
  messageId: string;
  /** `from` summarizes the message and everything after it, `up-to` everything before it */
  direction: SummarizeDirection;
  /** What the summary should keep, omitted when the user wrote nothing */
  context?: string;
};

export type RewindPoint = {
  /** Id of the user message */
  messageId: string;
  /** Position of the message in the conversation, starting at 0 */
  index: number;
  /** Single-line preview of the message text */
  preview: string;
  /** Message creation time, when known */
  createdAt?: Date;
  /** Number of messages that follow the point and would be removed */
  messagesAfter: number;
};

export type SlashCommandInfo = {
  /** Command name without the leading slash, for example `review` */
  name: string;
  /** Shown in the chip tooltip */
  description?: string;
  /** Icon rendered in the chip instead of the default one */
  icon?: React.ReactNode;
};

export type ToolResultNoticeVariant = 'rejected' | 'cancelled' | 'error' | 'interrupted';

export type PlanDecision =
  | { kind: 'approved'; mode?: string }
  | { kind: 'approved-with-edits'; edits: string; mode?: string }
  | { kind: 'rejected'; feedback: string };

/** Callbacks that turn on message actions in `MessageList`; each action is shown only when its callback is set */
export type MessageListActions = {
  /** Saves an edited user message and resends it; the composer stays open until the promise settles */
  onEdit?: (messageId: string, text: string) => void | Promise<void>;
  /** Regenerates an assistant turn; assistant actions receive the id of the first assistant message of the turn */
  onRetry?: (messageId: string) => void | Promise<void>;
  /** Returns the conversation to the point before a user message, usually by opening `RewindDialog` */
  onRewind?: (messageId: string) => void | Promise<void>;
  /** Starts a new conversation branch from an assistant turn */
  onBranch?: (messageId: string) => void | Promise<void>;
  /** Rates an assistant turn; `details` is passed when the user fills in the negative feedback form */
  onFeedback?: (
    messageId: string,
    value: MessageFeedbackValue,
    details?: FeedbackDetails
  ) => void | Promise<void>;
  /** Controlled ratings keyed by the first assistant message id of a turn, when omitted the rating is kept inside the list */
  feedback?: Record<string, MessageFeedbackValue | undefined>;
  /** Reasons offered in the negative feedback form */
  feedbackReasons?: FeedbackReason[];
};
