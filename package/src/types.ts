import type React from 'react';
import type { QuestionAnswer, QuestionConfig } from './question/QuestionPrompt';
import type { SuggestionItem } from './input/Suggestions';

/** Chat status, structurally compatible with `ChatStatus` from the Vercel AI SDK */
export type ChatStatus = 'submitted' | 'streaming' | 'ready' | 'error';

/** Tool part state, structurally compatible with AI SDK v5 tool parts */
export type ToolPartState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error'
  | (string & {});

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
  [key: string]: unknown;
};

export type TextPart = { type: 'text'; text: string; state?: string };
export type ErrorPart = { type: 'error'; title?: string; message: string };
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

/** Props passed to custom tool renderer components */
export type CustomToolRendererProps = {
  name: string;
  input: Record<string, unknown>;
  output: unknown | undefined;
  status: 'pending' | 'streaming' | 'success' | 'error';
};

export type ToolRendererSlotProps = {
  part: ToolPart;
  nestedTools?: ToolPart[];
  chatStatus?: string;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
};

/** Component slot overrides */
export type ChatSlots = {
  InputBar: React.ComponentType<{
    onSend: (message: { role: 'user'; content: string }) => void;
    status: ChatStatus;
    onStop: () => void;
    [key: string]: unknown;
  }>;
  UserMessage: React.ComponentType<{
    message: ChatMessage;
    className?: string;
    enableImagePreview?: boolean;
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

  /** Where to position the scroll container on initial mount, `'bottom'` by default */
  initialScrollBehavior?: 'bottom' | 'top';

  /** When `true` (default) clicking an attached image opens a fullscreen lightbox preview */
  enableImagePreview?: boolean;

  suggestions?: InputSuggestions;

  emptyStatePosition?: 'default' | 'center';
  emptySuggestionsPlacement?: 'input' | 'empty' | 'both';
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
