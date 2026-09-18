import type React from 'react';
import type { QuestionAnswer, QuestionConfig } from './question/QuestionPrompt';
import type { SuggestionItem } from './input/Suggestions';
import type { MessageListActions, SlashCommandInfo } from './message-actions/types';
import type { InputBarProps } from './input/InputBar';
import type { ChatWelcomeAction, ChatWelcomeLabels } from './AgentChat/ChatWelcome';
import type { SyntaxHighlighter } from './utils/highlighter';
import type { LongTextThreshold } from './UserMessage/long-text';
import type { MarkdownTailGranularity } from './Markdown/Markdown';
import type { ToolCallLookups, ToolCallState } from './tools/tool-call-state';
import type { ToolOutputFormatters } from './rows/tool-output';
import type { TranscriptPresentation } from './MessageList/transcript-presentation';
import type { ToolArgsFormatters } from './tools/tool-args';
import type { ToolCatalog } from './tools/tool-presentation';
import type { ToolApprovals } from './approvals/tool-approvals';
import type { AgentChatLabels } from './AgentChat/agent-chat-labels';

/** Chat status, structurally compatible with `ChatStatus` from the Vercel AI SDK */
export type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';

/** Tool part state, structurally compatible with AI SDK v5 tool parts */
export type ToolPartState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error'
  | (string & {});

/** Latest MCP `notifications/progress` of a long call */
export type ToolCallProgress = {
  /** Work done so far, in the units the server chose */
  progress: number;
  /** Work expected in total; without it the card shows the raw count and no bar */
  total?: number;
  /** Short status the server sent with the notification */
  message?: string;
  /** Token the request was started with, `progressToken` of the MCP request */
  progressToken?: string | number;
};

/** Minimal shape of a tool invocation part (`tool-<Name>` or `dynamic-tool`) */
export type ToolPart = {
  type: string;
  toolCallId?: string;
  toolName?: string;
  state?: ToolPartState;
  input?: unknown;
  output?: unknown;
  result?: unknown;
  errorText?: string;
  /** Latest progress notification of the call, see `getToolProgress` */
  progress?: ToolCallProgress;
  [key: string]: unknown;
};

export type TextPart = { type: 'text'; text: string; state?: string };
export type ErrorPart = { type: 'error'; title?: string; message: string };
/** Marks where earlier history was replaced with a summary */
export type CompactionPart = {
  type: 'compaction';
  summary?: string;
  tokensBefore?: number;
  tokensAfter?: number;
  /** Which side of the boundary was summarized */
  direction?: 'from' | 'up-to';
  /** What the user asked the summary to keep */
  userContext?: string;
};

/** End-of-turn summary: how long the agent worked and what is still running */
export type TurnSummaryPart = {
  type: 'turn-summary';
  /** Time the turn took in ms */
  durationMs: number;
  /** Tokens used by the turn */
  tokens?: number;
  /** Token budget of the turn or session */
  tokenBudget?: number;
  /** Background tasks still running after the turn ended */
  backgroundTasks?: number;
};

export type ContextEventKind =
  | 'file'
  | 'directory'
  | 'memory'
  | 'mcp-resource'
  | 'skill'
  | 'diagnostics';

/** Something the agent pulled into its context: a file, a memory, a skill, diagnostics */
export type ContextEventPart = {
  type: 'context-event';
  kind: ContextEventKind;
  /** Object of the event, for example a file path or a skill name */
  label: string;
  /** Extra detail after the label, for example `120 lines` */
  detail?: string;
  /** Entries shown when the row is expanded, for example files of a directory */
  items?: string[];
};

export type HookActivityStatus = 'running' | 'done' | 'blocked' | 'error';

export type HookRun = {
  /** Hook name or command */
  name: string;
  /** Time the hook took in ms */
  durationMs?: number;
  /** Error or block reason reported by the hook */
  error?: string;
};

/** Lifecycle hooks that ran for an event such as `PreToolUse` */
export type HookActivityPart = {
  type: 'hook-activity';
  /** Hook event name, for example `PreToolUse` */
  event: string;
  status: HookActivityStatus;
  hooks?: HookRun[];
  /** Why the hooks blocked the action or failed */
  reason?: string;
};

/** Options for collapsing consecutive tool calls into one summary row */
export type CollapseToolRunsOptions = {
  /** Minimum number of consecutive matching tool calls that form a group, `3` by default */
  minRun?: number;
  /** Tool part types that can be collapsed, read and search tools by default */
  types?: string[];
};

export type FilePart = {
  type: 'file';
  url?: string;
  data?: string;
  mediaType?: string;
  mimeType?: string;
  filename?: string;
  name?: string;
  size?: number;
};

/** Any message part. Unknown part types are ignored by the renderer. */
export type MessagePart =
  | TextPart
  | ErrorPart
  | FilePart
  | CompactionPart
  | TurnSummaryPart
  | ContextEventPart
  | HookActivityPart
  | ToolPart
  | { type: string; [key: string]: unknown };

/** Chat message, structurally compatible with `UIMessage` from the Vercel AI SDK */
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
  createdAt?: Date | string;
  metadata?: unknown;
  [key: string]: unknown;
};

export type InputSuggestions =
  | SuggestionItem[]
  | {
      items: SuggestionItem[];
      className?: string;
      itemClassName?: string;
    };

/** Per-element class name overrides */
export type ChatClassNames = {
  root: string;
  userMessage: string;
  inputBar: string;
};

/** Reports an action taken inside an interactive tool part, for example `approve` or `submit` */
export type ToolActionHandler = (toolCallId: string, action: string, payload?: unknown) => void;

/** Props passed to custom tool renderer components */
export type CustomToolRendererProps = {
  /** Tool name: `Name` for `tool-Name` parts, the MCP tool name for `mcp__user-tools__<name>` */
  name: string;
  input: Record<string, unknown>;
  output: unknown | undefined;
  status: 'pending' | 'streaming' | 'success' | 'error';
  /** State derived from the transcript: adds `queued`, `awaiting-permission` and `rejected` to `status` */
  callState?: ToolCallState;
  /** Id of the tool call */
  toolCallId?: string;
  /** Raw tool part */
  part: ToolPart;
  /** Reports an action to `onToolAction` of `MessageList` or `AgentChat` with this call's id */
  onAction?: (action: string, payload?: unknown) => void;
};

export type ToolRendererSlotProps = {
  part: ToolPart;
  nestedTools?: ToolPart[];
  chatStatus?: string;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
  /** Receives actions reported by custom tool renderers */
  onToolAction?: ToolActionHandler;
  /** Wraps long lines in diffs instead of scrolling them sideways */
  wrapLines?: boolean;
  /** Transcript lookups behind the visible state of a call, see `createToolCallLookups` */
  lookups?: ToolCallLookups;
  /** Shows how long a running call has been going and the progress its server reports */
  showActivity?: boolean;
};

/** Component slot overrides */
export type ChatSlots = {
  InputBar: React.ComponentType<InputBarProps & { [key: string]: unknown }>;
  UserMessage: React.ComponentType<{
    message: ChatMessage;
    className?: string;
    enableImagePreview?: boolean;
    commands?: SlashCommandInfo[];
  }>;
  ToolRenderer: React.ComponentType<ToolRendererSlotProps>;
};

/** A model option for the model selector */
export type ModelOption = {
  id: string;
  name: string;
  version?: string;
};

export type AttachedImage = {
  id: string;
  filename: string;
  url: string;
  size?: number;
};

export type AttachedFile = {
  id: string;
  filename: string;
  size?: number;
};

export type AgentChatEmptyState = {
  /**
   * `welcome` keeps the composer at the bottom and shows avatar, greeting and actions above it in the
   * message area; `center` centers the greeting and composer. `welcome` by default, `center` when
   * `emptyStatePosition="center"` is set.
   */
  layout?: 'welcome' | 'center';
  /** Logo or avatar of the assistant, `welcome` layout only */
  avatar?: React.ReactNode;
  /** Greeting, for example `How can I help you today?` */
  title?: React.ReactNode;
  /** Text under the greeting */
  description?: React.ReactNode;
  /** Starter actions listed under the greeting, `welcome` layout only */
  actions?: ChatWelcomeAction[];
  /**
   * `center` layout: suggestion pills around the composer; the `suggestions` prop is used when omitted.
   * `welcome` layout: listed as actions when `actions` is omitted, never shown as pills under the composer.
   */
  suggestions?: SuggestionItem[];
  /** Overrides of the default English labels of the `welcome` layout */
  labels?: Partial<ChatWelcomeLabels>;
};

/** Props for the `<AgentChat>` drop-in component */
export type AgentChatProps = {
  messages: ChatMessage[];
  onSend: (message: { role: 'user'; content: string }) => void;
  status: ChatStatus;
  onStop: () => void;
  error?: Error;

  classNames?: Partial<ChatClassNames>;
  slots?: Partial<ChatSlots>;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;

  /** Attachment configuration */
  attachments?: {
    onAttach?: () => void;
    images?: AttachedImage[];
    files?: AttachedFile[];
    onRemoveImage?: (id: string) => void;
    onRemoveFile?: (id: string) => void;
    onPaste?: (e: React.ClipboardEvent) => void;
    isDragOver?: boolean;
  };

  /** Show copy toolbar on text turns, `true` by default */
  showCopyToolbar?: boolean;

  /** Collapse runs of consecutive read and search tool calls into one summary row, `false` by default */
  collapseToolRuns?: boolean | CollapseToolRunsOptions;

  /** Message actions under messages: edit, retry, rewind, branch and feedback; plain copy toolbar when omitted */
  messageActions?: MessageListActions;

  /** Adds a retry button to error cards, including the card rendered for `error` */
  onRetry?: () => void;

  /** Receives actions reported by custom tool renderers through `onAction` */
  onToolAction?: ToolActionHandler;

  /**
   * Approval requests keyed by `toolCallId`. The approve/reject footer is rendered under the card
   * of that call whatever renders it, so an MCP call can ask for confirmation without replacing
   * its renderer. An entry with an `outcome` shows a quiet settled line instead; an id with no
   * call in the transcript is ignored.
   */
  approvals?: ToolApprovals;

  /**
   * Every label of the chat, grouped by the component that shows it: `messageList` (with `search`
   * and `toolRuns`), `inputBar`, `errorMessage`, `turnSummary`, `toolApproval`, `welcome`, the
   * tool sections `toolTitles`, `toolCall`, `toolCard`, `toolRow`, `mcpTool`, `bashTool`,
   * `editTool`, `searchTool`, `todoTool`, `planTool`, `toolGroup`, plus `errorTitle` and
   * `placeholder`. Sections are partial and merge key by key
   * with the English defaults; `inputBarProps.labels`, `emptyState.labels` and the `labels` of an
   * approval request win over the matching section.
   */
  labels?: Partial<AgentChatLabels>;

  /**
   * Extra props for the composer: `completions`, `leftActions`, `rightActions`, `placeholder`,
   * `onQueue`, `queuedMessages`, `onRemoveQueued`, `labels` and the rest of `InputBarProps`.
   * `AgentChat` owns `onSend`, `status`, `onStop`, the draft value and the question bar;
   * `attachments` and `suggestions` take precedence over the same fields here.
   */
  inputBarProps?: Omit<
    Partial<InputBarProps>,
    'onSend' | 'status' | 'onStop' | 'value' | 'onChange'
  >;

  /** Content above the composer aligned with the message column, for example `AgentStatus` */
  statusBar?: React.ReactNode;

  /** Adds the conversation search, opened with Mod+F anywhere inside the chat, including the composer, `false` by default */
  withSearch?: boolean;

  /** Pins the prompt of the answer being read to the top while scrolling a long answer */
  stickyPrompt?: boolean;

  /** Syntax highlighter for code blocks in answers; plain code blocks when omitted */
  highlighter?: SyntaxHighlighter;

  /** Collapses long user messages to head and tail; `true` uses `{ chars: 2000, lines: 30 }`, `false` by default */
  longMessageThreshold?: LongTextThreshold | boolean;

  /** Max width of the message column and composer: a number in px or any CSS width, `420px` by default. Pass `'100%'` or `960` for a full-page chat */
  contentWidth?: number | string;

  /** Where to position the scroll container on initial mount, `'bottom'` by default */
  initialScrollBehavior?: 'bottom' | 'top';

  /** Opens an attached image in a fullscreen lightbox on click, `true` by default */
  enableImagePreview?: boolean;

  suggestions?: InputSuggestions;

  emptyStatePosition?: 'default' | 'center';
  /** Greeting of an empty chat; `layout` is `welcome` by default, `center` needs `layout: 'center'` or `emptyStatePosition="center"` */
  emptyState?: AgentChatEmptyState;
  /** Width of the centered empty state and its composer: a number in px or any CSS width; `600px` with `emptyState`, the message column width otherwise */
  emptyStateWidth?: number | string;
  /** Shows composer suggestions only while the chat has no messages */
  hideSuggestionsWhenNotEmpty?: boolean;
  /** Lines the composer and status bar up with the text edge of the message column, `false` by default */
  alignComposer?: boolean;
  /** Fades the top edge of the message list once it is scrolled, `false` by default */
  topFade?: boolean;
  /** Wraps long lines in code blocks and diffs instead of scrolling them sideways, for narrow layouts, `false` by default */
  wrapLines?: boolean;
  /** Shows answer tables with too many columns for the width as one card per row, `false` by default */
  responsiveTables?: boolean;
  /**
   * Commits the streaming answer at most once per animation frame, `true` by default.
   * A finished stream, a hidden tab and `prefers-reduced-motion` commit right away.
   */
  frameBatched?: boolean;
  /** Reveals the growing tail of the streaming answer by character (`'char'`, the default) or by finished line (`'line'`) */
  tailGranularity?: MarkdownTailGranularity;
  /**
   * Fades a newly arrived message or part in over 150ms with a few pixels of travel, `true` by
   * default. The transcript already on screen at mount never animates, and `prefers-reduced-motion`
   * turns the animation off.
   */
  animateAppearance?: boolean;
  /**
   * Transcript lookups behind the visible state of a tool call: queued, waiting for permission,
   * refused, already answered. Built from `messages` when omitted, see `createToolCallLookups`.
   */
  toolCallLookups?: ToolCallLookups;
  /**
   * Quiet line at the end of the transcript while the agent works between tool calls, `true` by
   * default. A node replaces the kit row, for example an `AgentStatus` of the host carrying its own
   * label and token count.
   */
  workingRow?: React.ReactNode | boolean;
  /**
   * Shows how long a running tool call has been going and the progress its MCP server reports,
   * `true` by default.
   */
  toolActivity?: boolean;
  /**
   * How the transcript is laid out: `cards` (the default) keeps the tool cards; `rowsPresentation`
   * shows the flat transcript of a terminal client — a marker, the call and its answer under a
   * gutter; `quietPresentation` folds MCP calls into quiet lines that open into their details. Both
   * are passed as values so they only reach the bundle of a host that uses them.
   */
  presentation?: 'cards' | TranscriptPresentation;
  /**
   * Result formatters by part type, keyed as `toolRenderers`:
   * `tool-Read`, `tool-mcp__tracker__task_list` or a server-wide `tool-mcp__tracker__*`. A formatter
   * that returns `null` leaves the readable summary the kit builds.
   */
  toolOutputs?: ToolOutputFormatters;
  /**
   * Tool definitions of the connected MCP servers keyed by `mcp__<server>__<tool>`: a call then
   * reads by the tool `title` instead of its name, and its arguments and result as a short summary.
   */
  toolCatalog?: ToolCatalog;
  /** Argument formatters by part type, keyed as `toolOutputs`; `null` keeps the kit summary */
  toolArgs?: ToolArgsFormatters;
  /**
   * One vertical gap between every two blocks of the transcript — prompt, answer text, tool call —
   * instead of the tighter gaps around the prompt, `false` by default. Always on in `rows`.
   */
  evenSpacing?: boolean;
  /** Locale of numbers and dates in tool arguments and results, the locale of the runtime by default */
  locale?: string;
  emptySuggestionsPlacement?: 'input' | 'empty' | 'both';
  /**
   * @deprecated Suggestions are always rendered above the composer; `bottom` is treated as `top`.
   */
  emptySuggestionsPosition?: 'top' | 'bottom';

  questionTool?: {
    submitLabel?: string;
    skipLabel?: string;
    allowSkip?: boolean;
    onAnswer?: (payload: {
      toolCallId?: string;
      question: QuestionConfig;
      answer: QuestionAnswer;
    }) => void;
  };

  className?: string;
  style?: React.CSSProperties;
};
