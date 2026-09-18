import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box, Button, CopyButton, Paper, Text, UnstyledButton } from '@mantine/core';
import { IconArrowDown, IconCheck, IconCopy, IconCornerLeftUp } from '@tabler/icons-react';
import type {
  ChatMessage,
  ChatStatus,
  CollapseToolRunsOptions,
  CustomToolRendererProps,
  PartRenderers,
  SendScroll,
  ToolActionHandler,
  ToolPart,
  ToolRendererSlotProps,
} from '../types';
import { createToolCallLookups, type ToolCallLookups } from '../tools/tool-call-state';
import { getContentWidthStyle, type ContentWidth } from '../utils/content-width';
import type { SyntaxHighlighter } from '../utils/highlighter';
import { cx } from '../utils/cx';
import { normalizeAssistantToolParts } from '../utils/tool-part-normalizer';
import { isErrorPart, isRecord, isTextPart, isV5ToolPart } from '../utils/parts';
import { UserMessage } from '../UserMessage/UserMessage';
import { Markdown, type MarkdownTailGranularity } from '../Markdown/Markdown';
import { ErrorMessage } from '../ErrorMessage/ErrorMessage';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import { SpiralLoader } from '../SpiralLoader/SpiralLoader';
import { WorkingLine } from './WorkingLine';
import type { TranscriptPresentation } from './transcript-presentation';
import { useToolApprovals } from '../approvals/approval-context';
import type { ToolOutputFormatters } from '../rows/tool-output';
import type { ToolArgsFormatters } from '../tools/tool-args';
import { ToolPresentationProvider, type ToolCatalog } from '../tools/tool-presentation';
import { ToolRenderer as DefaultToolRenderer } from '../tools/ToolRenderer';
import { CompactBoundary } from '../CompactBoundary/CompactBoundary';
import {
  groupToolRuns,
  resolveToolRunOptions,
  type ResolvedToolRunOptions,
  type ToolRunLabels,
} from './tool-runs';
import { ToolRunGroup } from './ToolRunGroup';
import { MessageActions } from '../message-actions/MessageActions/MessageActions';
import { EditMessageComposer } from '../message-actions/EditMessageComposer/EditMessageComposer';
import type { MessageListActions, SlashCommandInfo } from '../message-actions/types';
import { TurnSummary } from '../TurnSummary/TurnSummary';
import { ContextEventRow } from '../ContextEventRow/ContextEventRow';
import { HookActivity } from '../HookActivity/HookActivity';
import type { LongTextThreshold } from '../UserMessage/long-text';
import {
  countNewMessages,
  createFollowState,
  findStickyPromptTurn,
  followAfterResize,
  followAfterScroll,
  readMetrics,
  type FollowState,
  type TurnBounds,
} from './scroll-follow';
import {
  getMessagePartIndex,
  hasUnresolvedToolCalls,
  indexTranscript,
  isCompactionPart,
  isContextEventPart,
  isFeedPart,
  isHookActivityPart,
  isTurnSummaryPart,
} from './transcript-index';
import { TranscriptSearch, type TranscriptSearchLabels } from './TranscriptSearch';
import { useTranscriptSearch } from './use-transcript-search';
import { useAppearanceTracker, type AppearanceTracker } from './appearance';
import { useUnstableRenderersWarning } from './use-unstable-renderers-warning';
import { VisuallyHiddenStatus } from '../primitives/VisuallyHiddenStatus/VisuallyHiddenStatus';
import classes from './MessageList.module.css';

export type MessageListLabels = {
  /** Floating button shown when new messages arrive below, `N new messages` by default */
  newMessages: (count: number) => string;
  /** Accessible label of the sticky prompt, `Scroll to the prompt` by default */
  scrollToPrompt: string;
  /** Verb of the working row shown between tool calls, `Working` by default */
  working: string;
  /** Row before the first token of an answer when `workingRow` is off, `Processing...` by default */
  planning: string;
  /** Accessible label of the copy button under a message, `Copy message` by default */
  copyMessage: string;
  /** Accessible label of the copy button right after copying, `Copied` by default */
  copied: string;
  /** Accessible label of the toolbar under a message, `Message actions` by default */
  messageActions: string;
  /** Announced to screen readers once an answer finishes, `Answer ready` by default */
  answerReady: string;
  /** Announced to screen readers once an answer stops with an error, `Answer stopped with an error` by default */
  answerFailed: string;
  /** Announced to screen readers once the user stops an answer, see `stopped`, `Answer stopped` by default */
  answerStopped: string;
  /** Labels of the search bar */
  search?: Partial<TranscriptSearchLabels>;
  /** Summary and progress labels of collapsed tool runs */
  toolRuns?: Partial<ToolRunLabels>;
};

export const DEFAULT_MESSAGE_LIST_LABELS: MessageListLabels = {
  newMessages: (count) => `${count} new ${count === 1 ? 'message' : 'messages'}`,
  scrollToPrompt: 'Scroll to the prompt',
  working: 'Working',
  planning: 'Processing...',
  copyMessage: 'Copy message',
  copied: 'Copied',
  messageActions: 'Message actions',
  answerReady: 'Answer ready',
  answerFailed: 'Answer stopped with an error',
  answerStopped: 'Answer stopped',
};

export type MessageListProps = {
  messages: ChatMessage[];
  status: ChatStatus;
  className?: string;
  style?: React.CSSProperties;
  /** Max width of the message column: a number in px or any CSS width, `420px` by default. Pass `'100%'` for a full-width chat */
  contentWidth?: ContentWidth;
  showCopyToolbar?: boolean;
  /** Hides every `tool-Question` part. Prefer `suppressQuestionToolCallId`. */
  suppressQuestionTool?: boolean;
  /** Hides only the `tool-Question` part with this `toolCallId` (e.g. the one shown in the input bar) */
  suppressQuestionToolCallId?: string;
  /**
   * Where to position the scroll container on initial mount.
   * - "bottom" (default): classic chat behavior, pinned to the latest message.
   * - "top": start from the top of the conversation, useful for static demos
   *   or read-only transcripts where the user should read top-to-bottom.
   */
  initialScrollBehavior?: 'bottom' | 'top';
  /** Opens an attached image of a user message in a fullscreen lightbox on click, `true` by default */
  enableImagePreview?: boolean;
  /**
   * Collapses runs of consecutive read and search tool calls in an assistant message into one
   * summary row, for example `Read 3 files, searched 2 patterns`, `false` by default. Does not
   * apply to the rows presentation, where every call keeps its own row.
   */
  collapseToolRuns?: boolean | CollapseToolRunsOptions;
  /**
   * Turns on message actions: edit and rewind for user messages, retry, feedback and branch for
   * assistant turns. Each action appears only when its callback is set; without this prop the plain
   * copy toolbar is rendered.
   */
  messageActions?: MessageListActions;
  /** Known slash commands; a user message that starts with one of them is shown as a command chip */
  commands?: SlashCommandInfo[];
  slots?: {
    UserMessage?: React.ComponentType<{
      message: ChatMessage;
      className?: string;
      enableImagePreview?: boolean;
      commands?: SlashCommandInfo[];
      longMessageThreshold?: LongTextThreshold | boolean;
    }>;
    ToolRenderer?: React.ComponentType<ToolRendererSlotProps>;
  };
  classNames?: {
    userMessage?: string;
  };
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
  /** Renderers of part types the list does not know, keyed by `part.type`; parts without one stay hidden */
  partRenderers?: PartRenderers;
  /** Where the list scrolls when the user sends, `bottom` by default; `prompt-top` puts the question at the top and grows the answer under it */
  sendScroll?: SendScroll;
  /** Shows a caret after the growing text while streaming, `false` by default */
  streamingCaret?: boolean;
  /** Skips layout and paint of finished turns outside the viewport, `false` by default; a number is the turn count it starts from, `true` means 50 */
  lazyTurns?: boolean | number;
  /** The user stopped the latest answer, so its end is announced as `labels.answerStopped`; `AgentChat` sets it from its stop button */
  stopped?: boolean;
  /** Receives actions reported by custom tool renderers through `onAction` */
  onToolAction?: ToolActionHandler;
  /**
   * Transcript lookups behind the visible state of a tool call: queued, waiting for permission,
   * refused, already answered. Built from `messages` when omitted, see `createToolCallLookups`.
   */
  toolCallLookups?: ToolCallLookups;
  /**
   * Quiet line at the end of the transcript while the agent works between tool calls, `false` by
   * default. `true` renders the kit row: `labels.working` with the time since the last event; a node
   * replaces it, for example an `AgentStatus` of the host carrying its own label and token count.
   */
  workingRow?: React.ReactNode | boolean;
  /**
   * Shows how long a running tool call has been going and the progress its MCP server reports,
   * `false` by default. The time comes from the host when the call carries a start time and from
   * the kit otherwise.
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
  /** Adds a retry button to error parts */
  onRetry?: () => void;
  /** Adds the conversation search, opened with Mod+F while focus is inside the list, `false` by default */
  withSearch?: boolean;
  /** Controlled open state of the search */
  searchOpened?: boolean;
  /** Called when the search opens or closes */
  onSearchOpenedChange?: (opened: boolean) => void;
  /** Pins the prompt of the answer being read to the top while scrolling a long answer */
  stickyPrompt?: boolean;
  /** Collapses long user messages to head and tail; `true` uses `{ chars: 2000, lines: 30 }`, `false` by default */
  longMessageThreshold?: LongTextThreshold | boolean;
  /** Fades the top edge of the list once it is scrolled, so content does not end abruptly under a header */
  topFade?: boolean;
  /** Wraps long lines in code blocks and diffs instead of scrolling them sideways, for narrow layouts, `false` by default */
  wrapLines?: boolean;
  /** Shows answer tables with too many columns for the width as one card per row, `false` by default */
  responsiveTables?: boolean;
  /**
   * Commits the streaming answer at most once per animation frame, `false` by default.
   * A finished stream, a hidden tab and `prefers-reduced-motion` commit right away.
   */
  frameBatched?: boolean;
  /** Reveals the growing tail of the streaming answer by character (`'char'`, the default) or by finished line (`'line'`) */
  tailGranularity?: MarkdownTailGranularity;
  /**
   * Fades a newly arrived message or part in over 150ms with a few pixels of travel, `false` by
   * default. The transcript already on screen at mount never animates, and `prefers-reduced-motion`
   * turns the animation off.
   */
  animateAppearance?: boolean;
  /** Called with the width in px of the vertical scrollbar whenever it appears, disappears or resizes */
  onScrollbarWidthChange?: (width: number) => void;
  /** Syntax highlighter for code blocks in answers and compaction summaries; plain code blocks when omitted */
  highlighter?: SyntaxHighlighter;
  /** Overrides of the default English labels */
  labels?: Partial<MessageListLabels>;
};

function isModKey(event: React.KeyboardEvent) {
  return event.metaKey || event.ctrlKey;
}
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  let changed = false;
  const normalized = messages.map((message) => {
    if (Array.isArray(message.parts) && message.parts.length > 0) {
      return message;
    }
    const raw = message as { content?: string; text?: string };
    const content = raw.content ?? raw.text;
    if (typeof content !== 'string' || !content) {
      return message;
    }
    changed = true;
    return {
      ...message,
      parts: [{ type: 'text', text: content }],
    } as ChatMessage;
  });
  return changed ? normalized : messages;
}

function getTextFromParts(parts: unknown[], joiner: string): string {
  return parts
    .filter(isTextPart)
    .map((part) => part.text)
    .join(joiner);
}

/** Whether a call of the latest answer waits for the user, whose decision the status bar already asks for */
function hasOpenDecision(
  messages: ChatMessage[],
  requests: ReturnType<typeof useToolApprovals>,
  lookups: ToolCallLookups
): boolean {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'assistant') {
    return false;
  }
  return (last.parts ?? []).some((part) => {
    if (!isV5ToolPart(part) || !part.toolCallId) {
      return false;
    }
    const request = requests?.[part.toolCallId];
    if (request) {
      return !request.outcome;
    }
    return Boolean(lookups.isAwaitingPermission?.(part.toolCallId));
  });
}

/** Whether the answer itself is still growing, in which case the working row would double the caret */
function isTailGrowingText(messages: ChatMessage[]): boolean {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'assistant') {
    return false;
  }
  const parts = last.parts ?? [];
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index];
    if (isTextPart(part)) {
      return part.text.trim().length > 0;
    }
    if (isV5ToolPart(part)) {
      return false;
    }
  }
  return false;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isSameDay) {
    return timeFormatter.format(date);
  }
  return dateFormatter.format(date);
}

type ToolbarLabels = Pick<MessageListLabels, 'copyMessage' | 'copied' | 'messageActions'>;

function ToolbarCopyButton({
  text,
  labels,
  onCopied,
}: {
  text: string;
  labels: ToolbarLabels;
  onCopied?: () => void;
}) {
  return (
    <CopyButton value={text} timeout={2000}>
      {({ copied, copy }) => (
        <UnstyledButton
          tabIndex={-1}
          aria-label={copied ? labels.copied : labels.copyMessage}
          className={classes.copyButton}
          onClick={() => {
            copy();
            onCopied?.();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <span className={classes.copyIcons} data-copied={copied || undefined}>
            <IconCopy size={14} className={classes.copyIcon} />
            <IconCheck size={14} className={classes.checkIcon} />
          </span>
        </UnstyledButton>
      )}
    </CopyButton>
  );
}

function MessageToolbar({
  text,
  timestamp,
  size,
  align,
  isVisible,
  labels,
  onCopied,
}: {
  text?: string;
  timestamp?: string;
  size: 'sm' | 'lg';
  align: 'start' | 'end';
  isVisible: boolean;
  labels: ToolbarLabels;
  onCopied?: () => void;
}) {
  return (
    <div
      role="toolbar"
      tabIndex={-1}
      aria-label={labels.messageActions}
      className={classes.toolbar}
      data-size={size}
      data-align={align}
      data-visible={isVisible || undefined}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {timestamp && <span>{timestamp}</span>}
      {text && <ToolbarCopyButton text={text} labels={labels} onCopied={onCopied} />}
    </div>
  );
}

/** Scrollable conversation view with turn grouping, tool rendering and copy toolbars */
export const MessageList = memo(function MessageList({
  messages,
  status,
  className,
  style,
  contentWidth,
  showCopyToolbar = true,
  suppressQuestionTool = false,
  suppressQuestionToolCallId,
  initialScrollBehavior = 'bottom',
  enableImagePreview = true,
  collapseToolRuns,
  messageActions,
  commands,
  slots,
  classNames,
  toolRenderers,
  partRenderers,
  sendScroll = 'bottom',
  streamingCaret = false,
  lazyTurns = false,
  stopped = false,
  onToolAction,
  toolCallLookups,
  workingRow = false,
  toolActivity = false,
  presentation = 'cards',
  toolOutputs,
  toolCatalog,
  toolArgs,
  evenSpacing = false,
  locale,
  onRetry,
  withSearch = false,
  searchOpened: searchOpenedProp,
  onSearchOpenedChange,
  stickyPrompt = false,
  longMessageThreshold,
  highlighter,
  topFade = false,
  wrapLines,
  responsiveTables,
  frameBatched,
  tailGranularity,
  animateAppearance = false,
  onScrollbarWidthChange,
  labels: labelsProp,
}: MessageListProps) {
  const labels = { ...DEFAULT_MESSAGE_LIST_LABELS, ...labelsProp };
  useUnstableRenderersWarning(partRenderers);
  const appearance = useAppearanceTracker(animateAppearance, messages.length > 0);
  const custom = typeof presentation === 'object' ? presentation : undefined;
  const isRows = custom?.kind === 'rows';
  const isEven = evenSpacing && !isRows;
  const appearClass = (key: string) => (appearance.isNew(key) ? classes.appear : undefined);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const chatContainerObserverRef = useRef<ResizeObserver | null>(null);
  const followRef = useRef<FollowState>(
    createFollowState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 }, true)
  );
  const messagesRef = useRef<ChatMessage[]>(messages);
  const lastMessageIdRef = useRef<string | null>(messages[messages.length - 1]?.id ?? null);
  const assistantSpaceActiveRef = useRef(false);
  const [activeCopyId, setActiveCopyId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const focusAfterEditRef = useRef<string | null>(null);
  const finishEditing = useCallback(() => {
    focusAfterEditRef.current = editingId;
    setEditingId(null);
  }, [editingId]);

  useEffect(() => {
    const messageId = focusAfterEditRef.current;
    if (editingId !== null || messageId === null) {
      return;
    }
    focusAfterEditRef.current = null;
    chatContainerRef.current
      ?.querySelector<HTMLElement>(
        `[data-message-id="${CSS.escape(messageId)}"] [data-action="edit"]`
      )
      ?.focus();
  }, [editingId]);

  const CustomUserMessage = slots?.UserMessage || UserMessage;
  const CustomToolRenderer = slots?.ToolRenderer || DefaultToolRenderer;
  const toolRunLabels = labelsProp?.toolRuns;
  const toolRunOptions = useMemo(
    () => resolveToolRunOptions(collapseToolRuns, toolRunLabels),
    [collapseToolRuns, toolRunLabels]
  );

  // Consumers pass these inline, so the identity changes on every token; the memoized rows compare
  // props by identity and would re-render the whole transcript without a stable wrapper.
  const onToolActionRef = useRef(onToolAction);
  onToolActionRef.current = onToolAction;
  const hasToolAction = Boolean(onToolAction);
  const stableToolAction = useMemo<ToolActionHandler | undefined>(
    () =>
      hasToolAction
        ? (toolCallId, action, payload) => onToolActionRef.current?.(toolCallId, action, payload)
        : undefined,
    [hasToolAction]
  );
  const onRetryRef = useRef(onRetry);
  onRetryRef.current = onRetry;
  const hasRetry = Boolean(onRetry);
  const stableRetry = useMemo<(() => void) | undefined>(
    () => (hasRetry ? () => onRetryRef.current?.() : undefined),
    [hasRetry]
  );

  const markCopied = useCallback((id: string) => {
    setActiveCopyId(id);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handlePointerDown = () => {
      setActiveCopyId(null);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const isStreaming = status === 'streaming' || status === 'submitted';
  const [announcement, setAnnouncement] = useState('');
  const wasStreamingRef = useRef(isStreaming);
  useEffect(() => {
    if (isStreaming) {
      setAnnouncement('');
    } else if (wasStreamingRef.current) {
      setAnnouncement(
        status === 'error'
          ? labels.answerFailed
          : stopped
            ? labels.answerStopped
            : labels.answerReady
      );
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, status, stopped, labels.answerFailed, labels.answerReady, labels.answerStopped]);

  const scrollbarWidthRef = useRef(0);
  const onScrollbarWidthChangeRef = useRef(onScrollbarWidthChange);
  onScrollbarWidthChangeRef.current = onScrollbarWidthChange;
  const reportScrollbarWidth = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el || !onScrollbarWidthChangeRef.current) {
      return;
    }
    const width = Math.max(0, el.offsetWidth - el.clientWidth);
    if (width !== scrollbarWidthRef.current) {
      scrollbarWidthRef.current = width;
      onScrollbarWidthChangeRef.current(width);
    }
  }, []);

  const containerRefCallback = useCallback((el: HTMLDivElement | null) => {
    chatContainerRef.current = el;

    if (chatContainerObserverRef.current) {
      chatContainerObserverRef.current.disconnect();
      chatContainerObserverRef.current = null;
    }
    if (el) {
      el.style.setProperty('--chat-container-height', `${el.clientHeight}px`);
      const observer = new ResizeObserver((entries) => {
        const height = entries[0]?.contentRect.height ?? 0;
        el.style.setProperty('--chat-container-height', `${height}px`);
        reportScrollbarWidth();
      });
      observer.observe(el);
      chatContainerObserverRef.current = observer;
    }
  }, []);

  const scrollToBottomInstant = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, []);

  const scrollToBottomSettled = useCallback(() => {
    let rafOne = 0;
    let rafTwo = 0;
    scrollToBottomInstant();
    rafOne = requestAnimationFrame(() => {
      scrollToBottomInstant();
      rafTwo = requestAnimationFrame(() => {
        scrollToBottomInstant();
      });
    });
    return () => {
      cancelAnimationFrame(rafOne);
      cancelAnimationFrame(rafTwo);
    };
  }, [scrollToBottomInstant]);

  const [unseenCount, setUnseenCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [stickyTurnKey, setStickyTurnKey] = useState<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set(messages.map((message) => message.id)));
  const stickyFrameRef = useRef(0);

  const markAllSeen = useCallback(() => {
    seenIdsRef.current = new Set(messagesRef.current.map((message) => message.id));
    setUnseenCount(0);
  }, []);

  const updateStickyPrompt = useCallback(() => {
    const container = chatContainerRef.current;
    if (!stickyPrompt || !container) {
      return;
    }
    cancelAnimationFrame(stickyFrameRef.current);
    stickyFrameRef.current = requestAnimationFrame(() => {
      const top = container.getBoundingClientRect().top;
      const bounds: TurnBounds[] = [];
      container.querySelectorAll<HTMLElement>('[data-turn-key]').forEach((element) => {
        const rect = element.getBoundingClientRect();
        const prompt = element.querySelector<HTMLElement>('[data-turn-prompt]');
        bounds.push({
          key: element.dataset.turnKey ?? '',
          top: rect.top - top,
          bottom: rect.bottom - top,
          promptBottom: prompt ? prompt.getBoundingClientRect().bottom - top : null,
        });
      });
      setStickyTurnKey(findStickyPromptTurn(bounds));
    });
  }, [stickyPrompt]);

  useEffect(() => () => cancelAnimationFrame(stickyFrameRef.current), []);

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }
    if (topFade) {
      setIsScrolled(container.scrollTop > 0);
    }
    followRef.current = followAfterScroll(followRef.current, readMetrics(container));
    if (followRef.current.following) {
      markAllSeen();
    }
    updateStickyPrompt();
  }, [markAllSeen, updateStickyPrompt, topFade]);

  const pinIfGrown = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }
    const { state, pin } = followAfterResize(followRef.current, readMetrics(container));
    if (!pin) {
      followRef.current = state;
      return;
    }
    container.scrollTop = container.scrollHeight;
    followRef.current = createFollowState(readMetrics(container), true);
  }, []);

  useLayoutEffect(() => {
    const container = chatContainerRef.current;
    const contentWrapper = contentWrapperRef.current;
    if (!container || !contentWrapper) {
      return;
    }

    if (initialScrollBehavior === 'top') {
      container.scrollTop = 0;
    } else {
      container.scrollTop = container.scrollHeight;
    }
    followRef.current = createFollowState(readMetrics(container), initialScrollBehavior !== 'top');

    let lastContentHeight = contentWrapper.getBoundingClientRect().height;
    reportScrollbarWidth();

    // A tall block can arrive in a single resize, so growth is followed whenever the list is pinned.
    const resizeObserver = new ResizeObserver(() => {
      const newContentHeight = contentWrapper.getBoundingClientRect().height;
      if (newContentHeight === lastContentHeight) {
        return;
      }
      lastContentHeight = newContentHeight;
      reportScrollbarWidth();
      pinIfGrown();
    });

    resizeObserver.observe(contentWrapper);
    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedMessages = useMemo(() => normalizeMessages(messages), [messages]);

  useLayoutEffect(() => {
    pinIfGrown();
  }, [normalizedMessages, pinIfGrown]);

  useEffect(() => {
    messagesRef.current = normalizedMessages;
    const ids = normalizedMessages.map((message) => message.id);
    if (followRef.current.following) {
      seenIdsRef.current = new Set(ids);
      setUnseenCount(0);
    } else {
      setUnseenCount(countNewMessages(seenIdsRef.current, ids));
    }
    updateStickyPrompt();
  }, [normalizedMessages, updateStickyPrompt]);

  const turnsRootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [internalSearchOpened, setInternalSearchOpened] = useState(false);
  const isSearchOpen = withSearch && (searchOpenedProp ?? internalSearchOpened);
  const setSearchOpen = useCallback(
    (opened: boolean) => {
      setInternalSearchOpened(opened);
      onSearchOpenedChange?.(opened);
    },
    [onSearchOpenedChange]
  );
  const search = useTranscriptSearch({
    enabled: isSearchOpen,
    rootRef: turnsRootRef,
    scrollRef: chatContainerRef,
    contentKey: normalizedMessages,
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!withSearch || !isModKey(event) || event.key.toLowerCase() !== 'f') {
      return;
    }
    event.preventDefault();
    setSearchOpen(true);
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  };

  const closeSearch = () => {
    setSearchOpen(false);
    search.setQuery('');
    chatContainerRef.current?.focus();
  };

  const jumpToLatest = () => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }
    followRef.current = createFollowState(readMetrics(container), true);
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    markAllSeen();
  };
  const lastMessage = normalizedMessages[normalizedMessages.length - 1];
  const lastMessageId = lastMessage?.id ?? null;
  const lastMessageRole = lastMessage?.role ?? null;
  const transcript = useMemo(() => indexTranscript(normalizedMessages), [normalizedMessages]);
  const derivedToolCallLookups = useMemo(
    () => createToolCallLookups(normalizedMessages),
    [normalizedMessages]
  );
  const lookups = toolCallLookups ?? derivedToolCallLookups;
  const approvalRequests = useToolApprovals();
  const isWaitingForDecision = useMemo(
    () => hasOpenDecision(normalizedMessages, approvalRequests, lookups),
    [normalizedMessages, approvalRequests, lookups]
  );
  const { turns, lastUserMessageId } = transcript;
  const turnStartRef = useRef({ id: lastUserMessageId, at: Date.now() });
  if (turnStartRef.current.id !== lastUserMessageId) {
    turnStartRef.current = { id: lastUserMessageId, at: Date.now() };
  }

  const lastUserMessageIdRef = useRef(lastUserMessageId);
  const pendingPlanningScrollUserIdRef = useRef<string | null>(null);
  const promptTop = sendScroll === 'prompt-top';
  useLayoutEffect(() => {
    if (lastUserMessageId && lastUserMessageId !== lastUserMessageIdRef.current) {
      lastUserMessageIdRef.current = lastUserMessageId;
      const container = chatContainerRef.current;
      const turn = container?.querySelector<HTMLElement>(
        `[data-turn-key="${CSS.escape(lastUserMessageId)}"]`
      );
      const previousLastId = lastMessageIdRef.current;
      const appended = normalizedMessages.some((message) => message.id === previousLastId);
      if (promptTop && appended && container && turn) {
        const top = container.getBoundingClientRect().top;
        const overlay = container.querySelector<HTMLElement>('[data-sticky-overlay]');
        const covered = overlay ? Math.max(0, overlay.getBoundingClientRect().bottom - top) : 0;
        container.scrollTop += turn.getBoundingClientRect().top - top - covered;
        followRef.current = createFollowState(readMetrics(container), false);
        return;
      }
      followRef.current = { ...followRef.current, following: true };
      pendingPlanningScrollUserIdRef.current = lastUserMessageId;
      return scrollToBottomSettled();
    }
  }, [lastUserMessageId, normalizedMessages, promptTop, scrollToBottomSettled]);

  const lastActivityRef = useRef({ messages: normalizedMessages, at: Date.now() });
  if (lastActivityRef.current.messages !== normalizedMessages) {
    lastActivityRef.current = { messages: normalizedMessages, at: Date.now() };
  }

  const hasWorkingRow = workingRow !== false && workingRow !== undefined;
  const showPlanning =
    Boolean(lastMessage) &&
    isStreaming &&
    (lastMessageRole === 'user' || !transcript.lastAssistantHasContent);
  const showWorkingRow =
    hasWorkingRow &&
    isStreaming &&
    !isTailGrowingText(normalizedMessages) &&
    !isWaitingForDecision &&
    !custom?.showsActivity?.(lastMessage?.parts ?? []);
  const isNewAssistantMessage =
    lastMessageRole === 'assistant' &&
    Boolean(lastMessageId) &&
    lastMessageId !== lastMessageIdRef.current;
  const showAssistantBreathingSpace =
    !promptTop && (showPlanning || assistantSpaceActiveRef.current || isNewAssistantMessage);

  useEffect(() => {
    if (lastMessageRole === 'assistant') {
      if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
        assistantSpaceActiveRef.current = true;
      }
    }
    if (lastMessageRole === 'user') {
      assistantSpaceActiveRef.current = false;
    }
    lastMessageIdRef.current = lastMessageId;
  }, [lastMessageId, lastMessageRole]);

  const workingNode =
    showWorkingRow &&
    (workingRow === true ? (
      <WorkingLine
        label={labels.working}
        since={showPlanning ? turnStartRef.current.at : lastActivityRef.current.at}
        className={isRows ? classes.workingRowInline : undefined}
      />
    ) : (
      workingRow
    ));
  const lazyFrom = lazyTurns === false ? null : lazyTurns === true ? 50 : lazyTurns;

  useLayoutEffect(() => {
    if (!showPlanning || !lastUserMessageId) {
      return;
    }
    if (pendingPlanningScrollUserIdRef.current !== lastUserMessageId) {
      return;
    }
    const cancel = scrollToBottomSettled();
    pendingPlanningScrollUserIdRef.current = null;
    return cancel;
  }, [lastUserMessageId, showPlanning, scrollToBottomSettled]);

  return (
    <ToolPresentationProvider
      catalog={toolCatalog}
      args={toolArgs}
      outputs={toolOutputs}
      locale={locale}
    >
      <Box
        ref={containerRefCallback}
        onScroll={handleScroll}
        onKeyDown={withSearch ? handleKeyDown : undefined}
        tabIndex={withSearch ? -1 : undefined}
        data-top-fade={topFade && isScrolled ? true : undefined}
        className={cx(classes.root, className)}
        style={getContentWidthStyle(contentWidth, style)}
        role="log"
        aria-live="off"
        aria-busy={isStreaming}
      >
        <div ref={contentWrapperRef} className={classes.content}>
          {(isSearchOpen || (stickyPrompt && stickyTurnKey)) && (
            <div className={classes.stickyTop} data-search-ignore>
              <div className={classes.stickyTopInner} data-sticky-overlay>
                {isSearchOpen && (
                  <TranscriptSearch
                    inputRef={searchInputRef}
                    value={search.query}
                    onChange={search.setQuery}
                    activeIndex={search.activeIndex}
                    total={search.total}
                    onNext={search.next}
                    onPrevious={search.previous}
                    onClose={closeSearch}
                    labels={labels.search}
                  />
                )}
                {stickyPrompt &&
                  stickyTurnKey &&
                  (() => {
                    const turn = turns.find((item) => item.userMsg?.id === stickyTurnKey);
                    const promptText = turn?.userMsg
                      ? getTextFromParts(turn.userMsg.parts ?? [], ' ')
                      : '';
                    if (!promptText) {
                      return null;
                    }
                    return (
                      <Paper withBorder shadow="xs" radius="md" className={classes.stickyPrompt}>
                        <UnstyledButton
                          className={classes.stickyPromptButton}
                          aria-label={labels.scrollToPrompt}
                          onClick={() =>
                            chatContainerRef.current
                              ?.querySelector<HTMLElement>(
                                `[data-turn-key="${CSS.escape(stickyTurnKey)}"]`
                              )
                              ?.scrollIntoView({
                                block: 'start',
                                behavior: 'smooth',
                              })
                          }
                        >
                          <IconCornerLeftUp size={14} aria-hidden />
                          <Text component="span" size="xs" truncate="end" miw={0}>
                            {promptText}
                          </Text>
                        </UnstyledButton>
                      </Paper>
                    );
                  })()}
              </div>
            </div>
          )}
          <div
            ref={turnsRootRef}
            className={classes.turns}
            data-rows={isRows || undefined}
            data-even={isEven || undefined}
          >
            {turns.map((turn, turnIndex) => {
              const isLastTurn = turnIndex === turns.length - 1;
              const turnKey = turn.userMsg?.id ?? turn.assistantMsgs[0]?.id ?? `turn-${turnIndex}`;

              return (
                <div
                  key={turnKey}
                  className={classes.turn}
                  data-turn-key={turnKey}
                  data-send-scroll={(promptTop && isLastTurn) || undefined}
                  data-lazy={
                    (lazyFrom !== null && turns.length >= lazyFrom && !isLastTurn) || undefined
                  }
                  data-rows={isRows || undefined}
                  data-even={isEven || undefined}
                >
                  {turn.userMsg &&
                    (() => {
                      const userMsg = turn.userMsg;
                      const text = getTextFromParts(userMsg.parts ?? [], '');
                      const hasParts = (userMsg.parts ?? []).length > 0;
                      if (!text && !hasParts) {
                        return null;
                      }
                      const userCreatedAt = userMsg.createdAt;
                      const userCopyKey = `user-${userMsg.id}`;
                      const userCopyVisible = activeCopyId === userCopyKey;
                      const userTimestamp =
                        isMounted && userCreatedAt
                          ? formatTimestamp(new Date(userCreatedAt))
                          : undefined;
                      const showUserToolbar =
                        (showCopyToolbar && Boolean(text)) || Boolean(userTimestamp);
                      if (messageActions) {
                        const { onEdit, onRewind } = messageActions;
                        if (onEdit && editingId === userMsg.id) {
                          return (
                            <div className={classes.group} data-turn-prompt>
                              <EditMessageComposer
                                defaultValue={text}
                                onCancel={finishEditing}
                                onSubmit={async (nextText) => {
                                  await onEdit(userMsg.id, nextText);
                                  finishEditing();
                                }}
                              />
                            </div>
                          );
                        }
                        return (
                          <div
                            className={cx(classes.group, appearClass(`user:${userMsg.id}`))}
                            data-message-actions-host
                            data-message-id={userMsg.id}
                            data-turn-prompt
                          >
                            <CustomUserMessage
                              message={userMsg}
                              className={classNames?.userMessage}
                              enableImagePreview={enableImagePreview}
                              commands={commands}
                              longMessageThreshold={longMessageThreshold}
                            />
                            <MessageActions
                              messageRole="user"
                              align="end"
                              text={showCopyToolbar ? text : undefined}
                              timestamp={userTimestamp}
                              disabled={isStreaming}
                              onEdit={onEdit && text ? () => setEditingId(userMsg.id) : undefined}
                              onRewind={onRewind ? () => onRewind(userMsg.id) : undefined}
                              actions={messageActions?.actions?.(userMsg.id, 'user')}
                            />
                          </div>
                        );
                      }
                      return (
                        <div
                          className={cx(classes.group, appearClass(`user:${userMsg.id}`))}
                          data-turn-prompt
                        >
                          <CustomUserMessage
                            message={userMsg}
                            className={classNames?.userMessage}
                            enableImagePreview={enableImagePreview}
                            commands={commands}
                            longMessageThreshold={longMessageThreshold}
                          />
                          {showUserToolbar && (
                            <MessageToolbar
                              text={showCopyToolbar ? text : ''}
                              timestamp={userTimestamp}
                              size="sm"
                              align="end"
                              isVisible={userCopyVisible}
                              labels={labels}
                              onCopied={() => markCopied(userCopyKey)}
                            />
                          )}
                        </div>
                      );
                    })()}

                  {turn.assistantMsgs.length > 0 &&
                    !(isLastTurn && showPlanning) &&
                    (() => {
                      const assistantText = getTextFromParts(
                        turn.assistantMsgs.flatMap((msg) => msg.parts ?? []),
                        '\n\n'
                      );
                      const isTurnStreaming = isStreaming && isLastTurn;
                      const showToolbar =
                        showCopyToolbar && Boolean(assistantText.trim()) && !isTurnStreaming;
                      const copyKey = `assistant-${turnKey}-all`;
                      const toolbarText = showCopyToolbar ? assistantText : '';
                      const toolbarVisible = activeCopyId === copyKey;
                      const firstAssistant = turn.assistantMsgs.find(
                        (msg) => msg.role === 'assistant'
                      );
                      const firstAssistantId = firstAssistant?.id ?? '';
                      const isErrorOnlyTurn = turn.assistantMsgs.every((msg) =>
                        (msg.parts ?? []).every(isErrorPart)
                      );
                      const showActions =
                        Boolean(messageActions) &&
                        Boolean(firstAssistant) &&
                        !isTurnStreaming &&
                        !isErrorOnlyTurn;
                      const actionsNode = messageActions && showActions && (
                        <MessageActions
                          messageRole="assistant"
                          text={showCopyToolbar && assistantText.trim() ? assistantText : undefined}
                          feedbackReasons={messageActions.feedbackReasons}
                          actions={messageActions.actions?.(firstAssistantId, 'assistant')}
                          feedback={
                            messageActions.feedback
                              ? (messageActions.feedback[firstAssistantId] ?? null)
                              : undefined
                          }
                          onRetry={
                            messageActions.onRetry
                              ? () => messageActions.onRetry!(firstAssistantId)
                              : undefined
                          }
                          onBranch={
                            messageActions.onBranch
                              ? () => messageActions.onBranch!(firstAssistantId)
                              : undefined
                          }
                          onFeedback={
                            messageActions.onFeedback
                              ? (value, details) =>
                                  details
                                    ? messageActions.onFeedback!(firstAssistantId, value, details)
                                    : messageActions.onFeedback!(firstAssistantId, value)
                              : undefined
                          }
                        />
                      );

                      return (
                        <div
                          className={classes.group}
                          data-message-actions-host={messageActions ? true : undefined}
                        >
                          <div
                            className={classes.assistantStack}
                            data-rows={isRows || undefined}
                            data-even={isEven || undefined}
                          >
                            {turn.assistantMsgs.map((msg, i) => {
                              const isLastMsg = isLastTurn && i === turn.assistantMsgs.length - 1;
                              return (
                                <AssistantParts
                                  key={msg.id}
                                  msg={msg}
                                  isRowStreaming={isLastMsg && isStreaming}
                                  isRowTextStreaming={isLastMsg && status === 'streaming'}
                                  highlighter={highlighter}
                                  wrapLines={wrapLines}
                                  responsiveTables={responsiveTables}
                                  frameBatched={frameBatched}
                                  tailGranularity={tailGranularity}
                                  suppressQuestionTool={suppressQuestionTool}
                                  suppressQuestionToolCallId={suppressQuestionToolCallId}
                                  ToolRendererComponent={CustomToolRenderer}
                                  toolRenderers={toolRenderers}
                                  partRenderers={partRenderers}
                                  streamingCaret={streamingCaret}
                                  onToolAction={stableToolAction}
                                  onRetry={stableRetry}
                                  toolRunOptions={toolRunOptions}
                                  appearance={appearance}
                                  lookups={lookups}
                                  toolActivity={toolActivity}
                                  custom={custom}
                                  runLabels={toolRunLabels}
                                  turnStartedAt={
                                    isLastTurn && i === 0 ? turnStartRef.current.at : undefined
                                  }
                                  toolOutputs={toolOutputs}
                                  evenSpacing={isEven}
                                />
                              );
                            })}
                          </div>
                          {messageActions ? (
                            actionsNode
                          ) : showToolbar || toolbarVisible ? (
                            <MessageToolbar
                              text={toolbarText}
                              size="lg"
                              align="start"
                              isVisible={toolbarVisible}
                              labels={labels}
                              onCopied={() => markCopied(copyKey)}
                            />
                          ) : null}
                        </div>
                      );
                    })()}

                  {isLastTurn && promptTop && workingNode}
                  {isLastTurn && showPlanning && !hasWorkingRow && (
                    <ToolRowBase
                      icon={<SpiralLoader size={12} />}
                      shimmerLabel={labels.planning}
                      completeLabel="Done"
                      isAnimating
                    />
                  )}
                </div>
              );
            })}
            {!promptTop && workingNode}
          </div>
          {showAssistantBreathingSpace && (
            <div aria-hidden="true" className={classes.breathingSpace} />
          )}
          {unseenCount > 0 && (
            <div className={classes.jumpToLatest} data-search-ignore>
              <Button
                size="compact-sm"
                radius="xl"
                variant="default"
                leftSection={<IconArrowDown size={14} />}
                className={classes.jumpToLatestButton}
                onClick={jumpToLatest}
              >
                {labels.newMessages(unseenCount)}
              </Button>
            </div>
          )}
        </div>
      </Box>
      <VisuallyHiddenStatus>{announcement}</VisuallyHiddenStatus>
    </ToolPresentationProvider>
  );
});

MessageList.displayName = 'MessageList';

type AssistantPartsProps = {
  msg: ChatMessage;
  isRowStreaming: boolean;
  isRowTextStreaming: boolean;
  highlighter?: SyntaxHighlighter;
  wrapLines?: boolean;
  responsiveTables?: boolean;
  frameBatched?: boolean;
  tailGranularity?: MarkdownTailGranularity;
  suppressQuestionTool: boolean;
  suppressQuestionToolCallId?: string;
  ToolRendererComponent: React.ComponentType<ToolRendererSlotProps>;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
  partRenderers?: PartRenderers;
  streamingCaret: boolean;
  onToolAction?: ToolActionHandler;
  onRetry?: () => void;
  toolRunOptions?: ResolvedToolRunOptions | null;
  appearance: AppearanceTracker;
  lookups: ToolCallLookups;
  toolActivity: boolean;
  custom?: TranscriptPresentation;
  runLabels?: Partial<ToolRunLabels>;
  turnStartedAt?: number;
  toolOutputs?: ToolOutputFormatters;
  evenSpacing: boolean;
};

function findPartRenderer(renderers: PartRenderers | undefined, part: unknown) {
  const type = isRecord(part) ? part.type : undefined;
  return renderers && typeof type === 'string' && Object.hasOwn(renderers, type)
    ? renderers[type]
    : undefined;
}

function samePartList(previous: unknown[] = [], next: unknown[] = []): boolean {
  if (previous === next) {
    return true;
  }
  if (previous.length !== next.length) {
    return false;
  }
  return previous.every((part, index) => part === next[index]);
}

function sameRenderers(
  previous: Record<string, unknown> | undefined,
  next: Record<string, unknown> | undefined
): boolean {
  if (previous === next) {
    return true;
  }
  if (!previous || !next) {
    return false;
  }
  const keys = Object.keys(previous);
  return (
    keys.length === Object.keys(next).length && keys.every((key) => previous[key] === next[key])
  );
}

/**
 * A finished message keeps its element tree while the streaming one grows a part per token.
 * Only a row that can no longer move on its own is allowed to bail out: it must not be streaming
 * and every tool call it holds must already have a result. Whole-transcript facts never reach this
 * comparator, they arrive as booleans derived from the row itself.
 */
function areAssistantPartsEqual(previous: AssistantPartsProps, next: AssistantPartsProps): boolean {
  if (next.isRowStreaming || next.isRowTextStreaming) {
    return false;
  }
  if (hasUnresolvedToolCalls(next.msg.parts)) {
    return false;
  }
  if (previous.msg !== next.msg) {
    if (previous.msg.id !== next.msg.id || previous.msg.role !== next.msg.role) {
      return false;
    }
    if (!samePartList(previous.msg.parts, next.msg.parts)) {
      return false;
    }
  }
  return (
    previous.isRowStreaming === next.isRowStreaming &&
    previous.isRowTextStreaming === next.isRowTextStreaming &&
    previous.highlighter === next.highlighter &&
    previous.wrapLines === next.wrapLines &&
    previous.responsiveTables === next.responsiveTables &&
    previous.frameBatched === next.frameBatched &&
    previous.tailGranularity === next.tailGranularity &&
    previous.suppressQuestionTool === next.suppressQuestionTool &&
    previous.suppressQuestionToolCallId === next.suppressQuestionToolCallId &&
    previous.ToolRendererComponent === next.ToolRendererComponent &&
    previous.onToolAction === next.onToolAction &&
    previous.onRetry === next.onRetry &&
    previous.toolRunOptions === next.toolRunOptions &&
    previous.appearance === next.appearance &&
    previous.toolActivity === next.toolActivity &&
    previous.custom === next.custom &&
    previous.runLabels === next.runLabels &&
    previous.turnStartedAt === next.turnStartedAt &&
    previous.toolOutputs === next.toolOutputs &&
    previous.evenSpacing === next.evenSpacing &&
    previous.streamingCaret === next.streamingCaret &&
    sameRenderers(previous.toolRenderers, next.toolRenderers) &&
    sameRenderers(previous.partRenderers, next.partRenderers)
  );
}

const AssistantParts = memo(function AssistantParts({
  msg,
  isRowStreaming,
  isRowTextStreaming,
  highlighter,
  wrapLines,
  responsiveTables,
  frameBatched,
  tailGranularity,
  suppressQuestionTool,
  suppressQuestionToolCallId,
  ToolRendererComponent,
  toolRenderers,
  partRenderers,
  streamingCaret,
  onToolAction,
  onRetry,
  toolRunOptions,
  appearance,
  lookups,
  toolActivity,
  custom,
  runLabels,
  turnStartedAt,
  toolOutputs,
  evenSpacing,
}: AssistantPartsProps) {
  const parts = useMemo(
    () => normalizeAssistantToolParts(msg.parts ?? []) as unknown[],
    [msg.parts]
  );

  const approvals = useToolApprovals();
  const liveLookups = useMemo(
    () => (hasUnresolvedToolCalls(parts) ? lookups : undefined),
    [parts, lookups]
  );

  const elements = useMemo(() => {
    const { siblingsByParentId, nestedToolCallIds, lastTextIndex } = getMessagePartIndex(parts);
    const chatStreamingStatus = isRowStreaming ? 'streaming' : 'ready';
    const visible: Array<{ part: unknown; index: number }> = [];

    parts.forEach((part, index) => {
      if (isTextPart(part)) {
        if (part.text) {
          visible.push({ part, index });
        }
        return;
      }
      if (isErrorPart(part) || isFeedPart(part) || findPartRenderer(partRenderers, part)) {
        visible.push({ part, index });
        return;
      }
      if (!isV5ToolPart(part) || part.type === 'tool-TaskOutput') {
        return;
      }
      if (
        part.type === 'tool-Question' &&
        (suppressQuestionTool ||
          (suppressQuestionToolCallId !== undefined &&
            part.toolCallId === suppressQuestionToolCallId))
      ) {
        return;
      }
      if (part.toolCallId && nestedToolCallIds.has(part.toolCallId)) {
        return;
      }
      visible.push({ part, index });
    });

    const renderEntry = ({ part, index }: { part: unknown; index: number }): React.ReactNode => {
      const PartRenderer = findPartRenderer(partRenderers, part);
      if (PartRenderer) {
        return (
          <PartRenderer
            key={`${msg.id}-part-${index}`}
            part={part}
            messageId={msg.id}
            index={index}
            chatStatus={chatStreamingStatus}
          />
        );
      }
      if (isTextPart(part)) {
        return (
          <div key={`${msg.id}-text-${index}`} className={classes.assistantText}>
            <Markdown
              content={part.text}
              highlighter={highlighter}
              wrapLines={wrapLines}
              responsiveTables={responsiveTables}
              frameBatched={frameBatched}
              tailGranularity={tailGranularity}
              streaming={isRowTextStreaming && index === lastTextIndex ? true : undefined}
              streamingCaret={streamingCaret}
            />
          </div>
        );
      }
      if (isErrorPart(part)) {
        return (
          <ErrorMessage
            key={`${msg.id}-error-${index}`}
            title={part.title}
            message={part.message}
            onRetry={onRetry}
          />
        );
      }
      if (isTurnSummaryPart(part)) {
        return (
          <TurnSummary
            key={`${msg.id}-summary-${index}`}
            durationMs={part.durationMs}
            tokens={part.tokens}
            tokenBudget={part.tokenBudget}
            backgroundTasks={part.backgroundTasks}
          />
        );
      }
      if (isContextEventPart(part)) {
        return (
          <ContextEventRow
            key={`${msg.id}-context-${index}`}
            kind={part.kind}
            label={part.label}
            detail={part.detail}
            items={part.items}
          />
        );
      }
      if (isHookActivityPart(part)) {
        return (
          <HookActivity
            key={`${msg.id}-hooks-${index}`}
            event={part.event}
            status={part.status}
            hooks={part.hooks}
            reason={part.reason}
          />
        );
      }
      if (isCompactionPart(part)) {
        return (
          <CompactBoundary
            key={`${msg.id}-compaction-${index}`}
            summary={part.summary}
            tokensBefore={part.tokensBefore}
            tokensAfter={part.tokensAfter}
            direction={part.direction}
            userContext={part.userContext}
            highlighter={highlighter}
          />
        );
      }
      const toolPart = part as ToolPart;
      const toolCallId = toolPart.toolCallId;
      const nestedTools =
        (toolPart.type === 'tool-Task' || toolPart.type === 'tool-Agent') && toolCallId
          ? siblingsByParentId.get(toolCallId) || []
          : undefined;
      return (
        <ToolRendererComponent
          key={toolCallId ?? `${msg.id}-tool-${index}`}
          part={toolPart}
          nestedTools={nestedTools}
          chatStatus={chatStreamingStatus}
          toolRenderers={toolRenderers}
          onToolAction={onToolAction}
          wrapLines={wrapLines}
          lookups={liveLookups}
          showActivity={toolActivity}
        />
      );
    };

    const appear = (node: React.ReactNode): React.ReactNode => {
      if (!appearance.enabled || !React.isValidElement(node) || node.key === null) {
        return node;
      }
      if (!appearance.isNew(`${msg.id}:${node.key}`)) {
        return node;
      }
      return (
        <div key={node.key} className={classes.appear}>
          {node}
        </div>
      );
    };

    if (custom) {
      return custom
        .renderParts(visible, renderEntry, {
          messageId: msg.id,
          chatStatus: chatStreamingStatus,
          lookups: liveLookups,
          approvals,
          showActivity: toolActivity,
          highlighter,
          wrapLines,
          toolOutputs,
          runLabels,
          turnStartedAt,
        })
        .map(appear);
    }

    if (!toolRunOptions) {
      return visible.map((entry) => appear(renderEntry(entry)));
    }

    return groupToolRuns(
      visible,
      ({ part }) => isV5ToolPart(part) && toolRunOptions.types.has(part.type),
      toolRunOptions.minRun
    ).map((segment) => {
      if (segment.kind === 'single') {
        return appear(renderEntry(segment.item));
      }
      const runParts = segment.items.map((entry) => entry.part as ToolPart);
      const first = segment.items[0];
      return appear(
        <ToolRunGroup
          key={`run-${runParts[0].toolCallId ?? `${msg.id}-${first.index}`}`}
          parts={runParts}
          chatStatus={chatStreamingStatus}
          ToolRendererComponent={ToolRendererComponent}
          toolRenderers={toolRenderers}
          onToolAction={onToolAction}
          wrapLines={wrapLines}
          lookups={liveLookups}
          showActivity={toolActivity}
          labels={toolRunOptions.labels}
        />
      );
    });
  }, [
    parts,
    msg.id,
    isRowStreaming,
    isRowTextStreaming,
    highlighter,
    wrapLines,
    responsiveTables,
    frameBatched,
    tailGranularity,
    suppressQuestionTool,
    suppressQuestionToolCallId,
    ToolRendererComponent,
    toolRenderers,
    onToolAction,
    onRetry,
    toolRunOptions,
    appearance,
    liveLookups,
    toolActivity,
    custom,
    runLabels,
    turnStartedAt,
    toolOutputs,
    approvals,
    partRenderers,
    streamingCaret,
  ]);

  return (
    <div
      className={classes.assistantParts}
      data-stacked={elements.length > 1 || undefined}
      data-rows={custom?.kind === 'rows' || undefined}
      data-even={evenSpacing || undefined}
    >
      {elements}
    </div>
  );
}, areAssistantPartsEqual);

AssistantParts.displayName = 'AssistantParts';
