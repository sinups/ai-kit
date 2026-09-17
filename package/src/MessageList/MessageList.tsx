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
  CompactionPart,
  ContextEventPart,
  CustomToolRendererProps,
  HookActivityPart,
  ToolActionHandler,
  ToolPart,
  ToolRendererSlotProps,
  TurnSummaryPart,
} from '../types';
import { getContentWidthStyle, type ContentWidth } from '../utils/content-width';
import type { SyntaxHighlighter } from '../utils/highlighter';
import { cx } from '../utils/cx';
import { normalizeAssistantToolParts } from '../utils/tool-part-normalizer';
import { isErrorPart, isRecord, isTextPart, isV5ToolPart } from '../utils/parts';
import { UserMessage } from '../UserMessage/UserMessage';
import { Markdown } from '../Markdown/Markdown';
import { ErrorMessage } from '../ErrorMessage/ErrorMessage';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import { SpiralLoader } from '../SpiralLoader/SpiralLoader';
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
  findStickyPromptTurn,
  getStickToBottom,
  type TurnBounds,
} from './scroll-follow';
import { TranscriptSearch, type TranscriptSearchLabels } from './TranscriptSearch';
import { useTranscriptSearch } from './use-transcript-search';
import classes from './MessageList.module.css';

export type MessageListLabels = {
  /** Floating button shown when new messages arrive below, `N new messages` by default */
  newMessages: (count: number) => string;
  /** Accessible label of the sticky prompt, `Scroll to the prompt` by default */
  scrollToPrompt: string;
  /** Labels of the search bar */
  search?: Partial<TranscriptSearchLabels>;
  /** Summary and progress labels of collapsed tool runs */
  toolRuns?: Partial<ToolRunLabels>;
};

const DEFAULT_LABELS: MessageListLabels = {
  newMessages: (count) => `${count} new ${count === 1 ? 'message' : 'messages'}`,
  scrollToPrompt: 'Scroll to the prompt',
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
  /**
   * When true (default) clicking an attached image in a user message opens
   * the fullscreen lightbox preview. Set to false to disable previews.
   */
  enableImagePreview?: boolean;
  /**
   * Collapses runs of consecutive read and search tool calls in an assistant message into one
   * summary row, for example `Read 3 files, searched 2 patterns`. Off by default.
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
      longTextThreshold?: LongTextThreshold | boolean;
    }>;
    ToolRenderer?: React.ComponentType<ToolRendererSlotProps>;
  };
  classNames?: {
    userMessage?: string;
  };
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
  /** Receives actions reported by custom tool renderers through `onAction` */
  onToolAction?: ToolActionHandler;
  /** Adds a retry button to error parts */
  onRetry?: () => void;
  /** Adds the conversation search, opened with Mod+F while focus is inside the list */
  searchable?: boolean;
  /** Controlled open state of the search */
  searchOpened?: boolean;
  /** Called when the search opens or closes */
  onSearchOpenedChange?: (opened: boolean) => void;
  /** Pins the prompt of the answer being read to the top while scrolling a long answer */
  stickyPrompt?: boolean;
  /** Collapses long user messages to head and tail; `true` uses `{ chars: 2000, lines: 30 }`, off by default */
  longMessageThreshold?: LongTextThreshold | boolean;
  /** Fades the top edge of the list once it is scrolled, so content does not end abruptly under a header */
  topFade?: boolean;
  /** Wraps long lines in code blocks and diffs instead of scrolling them sideways, for narrow layouts; off by default */
  wrapLines?: boolean;
  /** Shows answer tables with too many columns for the width as one card per row, off by default */
  responsiveTables?: boolean;
  /** Called with the width in px of the vertical scrollbar whenever it appears, disappears or resizes */
  onScrollbarWidthChange?: (width: number) => void;
  /** Syntax highlighter for code blocks in answers and compaction summaries; plain code blocks when omitted */
  highlighter?: SyntaxHighlighter;
  /** Overrides of the default English labels */
  labels?: Partial<MessageListLabels>;
};

function isCompactionPart(part: unknown): part is CompactionPart {
  return isRecord(part) && part.type === 'compaction';
}

function isTurnSummaryPart(part: unknown): part is TurnSummaryPart {
  return isRecord(part) && part.type === 'turn-summary';
}

function isContextEventPart(part: unknown): part is ContextEventPart {
  return isRecord(part) && part.type === 'context-event';
}

function isHookActivityPart(part: unknown): part is HookActivityPart {
  return isRecord(part) && part.type === 'hook-activity';
}

function isFeedPart(part: unknown): boolean {
  return (
    isCompactionPart(part) ||
    isTurnSummaryPart(part) ||
    isContextEventPart(part) ||
    isHookActivityPart(part)
  );
}

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

function getLastAssistantHasContent(messages: ChatMessage[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role !== 'assistant') {
      continue;
    }
    return (msg.parts ?? []).some((part) => {
      if (isTextPart(part)) {
        return part.text.trim().length > 0;
      }
      return isV5ToolPart(part);
    });
  }
  return false;
}

function getLastUserMessageId(messages: ChatMessage[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role === 'user') {
      return msg.id;
    }
  }
  return null;
}

function getTextFromParts(parts: unknown[], joiner: string): string {
  return parts
    .filter(isTextPart)
    .map((part) => part.text)
    .join(joiner);
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

function ToolbarCopyButton({ text, onCopied }: { text: string; onCopied?: () => void }) {
  return (
    <CopyButton value={text} timeout={2000}>
      {({ copied, copy }) => (
        <UnstyledButton
          tabIndex={-1}
          aria-label={copied ? 'Copied' : 'Copy message'}
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
  onCopied,
}: {
  text?: string;
  timestamp?: string;
  size: 'sm' | 'lg';
  align: 'start' | 'end';
  isVisible: boolean;
  onCopied?: () => void;
}) {
  return (
    <div
      role="toolbar"
      tabIndex={-1}
      aria-label="Message actions"
      className={classes.toolbar}
      data-size={size}
      data-align={align}
      data-visible={isVisible || undefined}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {timestamp && <span>{timestamp}</span>}
      {text && <ToolbarCopyButton text={text} onCopied={onCopied} />}
    </div>
  );
}

type Turn = { userMsg?: ChatMessage; assistantMsgs: ChatMessage[] };

function hasFeedPart(msg: ChatMessage): boolean {
  return (msg.parts ?? []).some(isFeedPart);
}

/** Group flat messages into turns (user message + following assistant messages) */
function groupMessagesIntoTurns(messages: ChatMessage[]) {
  const turns: Turn[] = [];
  let current: Turn | null = null;

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (current) {
        turns.push(current);
      }
      current = { userMsg: msg, assistantMsgs: [] };
    } else if (msg.role === 'assistant') {
      if (!current) {
        current = { assistantMsgs: [] };
      }
      current.assistantMsgs.push(msg);
    } else if (hasFeedPart(msg)) {
      if (!current) {
        current = { assistantMsgs: [] };
      }
      current.assistantMsgs.push({
        ...msg,
        parts: msg.parts.filter(isFeedPart),
      });
    }
  }
  if (current) {
    turns.push(current);
  }
  return turns;
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
  onToolAction,
  onRetry,
  searchable = false,
  searchOpened: searchOpenedProp,
  onSearchOpenedChange,
  stickyPrompt = false,
  longMessageThreshold,
  highlighter,
  topFade = false,
  wrapLines,
  responsiveTables,
  onScrollbarWidthChange,
  labels: labelsProp,
}: MessageListProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const chatContainerObserverRef = useRef<ResizeObserver | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const prevScrollTopRef = useRef(0);
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
    const previousScrollTop = prevScrollTopRef.current;
    prevScrollTopRef.current = container.scrollTop;
    if (topFade) {
      setIsScrolled(container.scrollTop > 0);
    }
    shouldAutoScrollRef.current = getStickToBottom(
      shouldAutoScrollRef.current,
      previousScrollTop,
      container
    );
    if (shouldAutoScrollRef.current) {
      markAllSeen();
    }
    updateStickyPrompt();
  }, [markAllSeen, updateStickyPrompt, topFade]);

  useLayoutEffect(() => {
    const container = chatContainerRef.current;
    const contentWrapper = contentWrapperRef.current;
    if (!container || !contentWrapper) {
      return;
    }

    if (initialScrollBehavior === 'top') {
      container.scrollTop = 0;
      shouldAutoScrollRef.current = false;
    } else {
      container.scrollTop = container.scrollHeight;
      shouldAutoScrollRef.current = true;
    }

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
      if (shouldAutoScrollRef.current) {
        container.scrollTop = container.scrollHeight;
        prevScrollTopRef.current = container.scrollTop;
      }
    });

    resizeObserver.observe(contentWrapper);
    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedMessages = useMemo(() => normalizeMessages(messages), [messages]);

  useEffect(() => {
    messagesRef.current = normalizedMessages;
    const ids = normalizedMessages.map((message) => message.id);
    if (shouldAutoScrollRef.current) {
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
  const isSearchOpen = searchable && (searchOpenedProp ?? internalSearchOpened);
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
    if (!searchable || !isModKey(event) || event.key.toLowerCase() !== 'f') {
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
    shouldAutoScrollRef.current = true;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    markAllSeen();
  };
  const lastMessage = normalizedMessages[normalizedMessages.length - 1];
  const lastMessageId = lastMessage?.id ?? null;
  const lastMessageRole = lastMessage?.role ?? null;
  const lastUserMessageId = useMemo(
    () => getLastUserMessageId(normalizedMessages),
    [normalizedMessages]
  );

  const lastUserMessageIdRef = useRef(lastUserMessageId);
  const pendingPlanningScrollUserIdRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (lastUserMessageId && lastUserMessageId !== lastUserMessageIdRef.current) {
      shouldAutoScrollRef.current = true;
      pendingPlanningScrollUserIdRef.current = lastUserMessageId;
      const cancel = scrollToBottomSettled();
      lastUserMessageIdRef.current = lastUserMessageId;
      return cancel;
    }
  }, [lastUserMessageId, scrollToBottomSettled]);

  const planningLabel = 'Processing...';
  const turns = useMemo(() => groupMessagesIntoTurns(normalizedMessages), [normalizedMessages]);
  const showPlanning = useMemo(() => {
    const last = normalizedMessages[normalizedMessages.length - 1];
    if (!last) {
      return false;
    }
    return isStreaming && (last.role === 'user' || !getLastAssistantHasContent(normalizedMessages));
  }, [isStreaming, normalizedMessages]);
  const isNewAssistantMessage =
    lastMessageRole === 'assistant' &&
    Boolean(lastMessageId) &&
    lastMessageId !== lastMessageIdRef.current;
  const showAssistantBreathingSpace =
    showPlanning || assistantSpaceActiveRef.current || isNewAssistantMessage;

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
    <Box
      ref={containerRefCallback}
      onScroll={handleScroll}
      onKeyDown={searchable ? handleKeyDown : undefined}
      tabIndex={searchable ? -1 : undefined}
      data-top-fade={topFade && isScrolled ? true : undefined}
      className={cx(classes.root, className)}
      style={getContentWidthStyle(contentWidth, style)}
    >
      <div ref={contentWrapperRef} className={classes.content}>
        {(isSearchOpen || (stickyPrompt && stickyTurnKey)) && (
          <div className={classes.stickyTop} data-search-ignore>
            <div className={classes.stickyTopInner}>
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
        <div ref={turnsRootRef} className={classes.turns}>
          {turns.map((turn, turnIndex) => {
            const isLastTurn = turnIndex === turns.length - 1;
            const turnKey = turn.userMsg?.id ?? `turn-${turnIndex}`;

            return (
              <div key={turnKey} className={classes.turn} data-turn-key={turnKey}>
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
                          className={classes.group}
                          data-message-actions-host
                          data-message-id={userMsg.id}
                          data-turn-prompt
                        >
                          <CustomUserMessage
                            message={userMsg}
                            className={classNames?.userMessage}
                            enableImagePreview={enableImagePreview}
                            commands={commands}
                            longTextThreshold={longMessageThreshold}
                          />
                          <MessageActions
                            messageRole="user"
                            align="end"
                            text={showCopyToolbar ? text : undefined}
                            timestamp={userTimestamp}
                            disabled={isStreaming}
                            onEdit={onEdit && text ? () => setEditingId(userMsg.id) : undefined}
                            onRewind={onRewind ? () => onRewind(userMsg.id) : undefined}
                          />
                        </div>
                      );
                    }
                    return (
                      <div className={classes.group} data-turn-prompt>
                        <CustomUserMessage
                          message={userMsg}
                          className={classNames?.userMessage}
                          enableImagePreview={enableImagePreview}
                          commands={commands}
                          longTextThreshold={longMessageThreshold}
                        />
                        {showUserToolbar && (
                          <MessageToolbar
                            text={showCopyToolbar ? text : ''}
                            timestamp={userTimestamp}
                            size="sm"
                            align="end"
                            isVisible={userCopyVisible}
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
                        <div className={classes.assistantStack}>
                          {turn.assistantMsgs.map((msg, i) => {
                            const isLastMsg = isLastTurn && i === turn.assistantMsgs.length - 1;
                            return (
                              <AssistantParts
                                key={msg.id}
                                msg={msg}
                                isLast={isLastMsg}
                                isStreaming={isStreaming}
                                isTextStreaming={status === 'streaming'}
                                highlighter={highlighter}
                                wrapLines={wrapLines}
                                responsiveTables={responsiveTables}
                                suppressQuestionTool={suppressQuestionTool}
                                suppressQuestionToolCallId={suppressQuestionToolCallId}
                                ToolRendererComponent={CustomToolRenderer}
                                toolRenderers={toolRenderers}
                                onToolAction={onToolAction}
                                onRetry={onRetry}
                                toolRunOptions={toolRunOptions}
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
                            onCopied={() => markCopied(copyKey)}
                          />
                        ) : null}
                      </div>
                    );
                  })()}

                {isLastTurn && showPlanning && (
                  <ToolRowBase
                    icon={<SpiralLoader size={12} />}
                    shimmerLabel={planningLabel}
                    completeLabel="Done"
                    isAnimating
                  />
                )}
              </div>
            );
          })}
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
  );
});

MessageList.displayName = 'MessageList';

function AssistantParts({
  msg,
  isLast,
  isStreaming,
  isTextStreaming,
  highlighter,
  wrapLines,
  responsiveTables,
  suppressQuestionTool,
  suppressQuestionToolCallId,
  ToolRendererComponent,
  toolRenderers,
  onToolAction,
  onRetry,
  toolRunOptions,
}: {
  msg: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
  isTextStreaming: boolean;
  highlighter?: SyntaxHighlighter;
  wrapLines?: boolean;
  responsiveTables?: boolean;
  suppressQuestionTool: boolean;
  suppressQuestionToolCallId?: string;
  ToolRendererComponent: React.ComponentType<ToolRendererSlotProps>;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
  onToolAction?: ToolActionHandler;
  onRetry?: () => void;
  toolRunOptions?: ResolvedToolRunOptions | null;
}) {
  const parts = useMemo(
    () => normalizeAssistantToolParts(msg.parts ?? []) as unknown[],
    [msg.parts]
  );

  const elements = useMemo(() => {
    const taskPartIds = new Set(
      parts
        .filter(
          (p): p is ToolPart =>
            isV5ToolPart(p) &&
            (p.type === 'tool-Task' || p.type === 'tool-Agent') &&
            typeof p.toolCallId === 'string'
        )
        .map((p) => p.toolCallId as string)
    );
    const nestedToolsMap = new Map<string, ToolPart[]>();
    const nestedToolIds = new Set<string>();

    for (const part of parts) {
      if (!isV5ToolPart(part)) {
        continue;
      }
      if (part.type === 'tool-TaskOutput') {
        continue;
      }
      if (!part.toolCallId || !part.toolCallId.includes(':')) {
        continue;
      }
      const parentId = part.toolCallId.split(':')[0];
      if (!taskPartIds.has(parentId)) {
        continue;
      }
      if (!nestedToolsMap.has(parentId)) {
        nestedToolsMap.set(parentId, []);
      }
      nestedToolsMap.get(parentId)!.push(part);
      nestedToolIds.add(part.toolCallId);
    }

    const chatStreamingStatus = isLast && isStreaming ? 'streaming' : undefined;
    let lastTextIndex = -1;
    parts.forEach((part, index) => {
      if (isTextPart(part)) {
        lastTextIndex = index;
      }
    });
    const visible: Array<{ part: unknown; index: number }> = [];

    parts.forEach((part, index) => {
      if (isTextPart(part)) {
        if (part.text) {
          visible.push({ part, index });
        }
        return;
      }
      if (isErrorPart(part) || isFeedPart(part)) {
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
      if (part.toolCallId && nestedToolIds.has(part.toolCallId)) {
        return;
      }
      visible.push({ part, index });
    });

    const renderEntry = ({ part, index }: { part: unknown; index: number }): React.ReactNode => {
      if (isTextPart(part)) {
        return (
          <div key={`${msg.id}-text-${index}`} className={classes.assistantText}>
            <Markdown
              content={part.text}
              highlighter={highlighter}
              codeWrap={wrapLines}
              responsiveTables={responsiveTables}
              streaming={isLast && isTextStreaming && index === lastTextIndex ? true : undefined}
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
          ? nestedToolsMap.get(toolCallId) || []
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
        />
      );
    };

    if (!toolRunOptions) {
      return visible.map(renderEntry);
    }

    return groupToolRuns(
      visible,
      ({ part }) => isV5ToolPart(part) && toolRunOptions.types.has(part.type),
      toolRunOptions.minRun
    ).map((segment) => {
      if (segment.kind === 'single') {
        return renderEntry(segment.item);
      }
      const runParts = segment.items.map((entry) => entry.part as ToolPart);
      const first = segment.items[0];
      return (
        <ToolRunGroup
          key={`run-${runParts[0].toolCallId ?? `${msg.id}-${first.index}`}`}
          parts={runParts}
          chatStatus={chatStreamingStatus}
          ToolRendererComponent={ToolRendererComponent}
          toolRenderers={toolRenderers}
          onToolAction={onToolAction}
          wrapLines={wrapLines}
          labels={toolRunOptions.labels}
        />
      );
    });
  }, [
    parts,
    msg.id,
    isLast,
    isStreaming,
    isTextStreaming,
    highlighter,
    wrapLines,
    responsiveTables,
    suppressQuestionTool,
    suppressQuestionToolCallId,
    ToolRendererComponent,
    toolRenderers,
    onToolAction,
    onRetry,
    toolRunOptions,
  ]);

  return (
    <div className={classes.assistantParts} data-stacked={elements.length > 1 || undefined}>
      {elements}
    </div>
  );
}
