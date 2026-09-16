import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box, CopyButton, UnstyledButton } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import type {
  ChatMessage,
  ChatStatus,
  CustomToolRendererProps,
  ToolPart,
  ToolRendererSlotProps,
} from '../types';
import { cx } from '../utils/cx';
import { normalizeAssistantToolParts } from '../utils/tool-part-normalizer';
import { UserMessage } from '../UserMessage/UserMessage';
import { Markdown } from '../Markdown/Markdown';
import { ErrorMessage } from '../ErrorMessage/ErrorMessage';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import { SpiralLoader } from '../SpiralLoader/SpiralLoader';
import { ToolRenderer as DefaultToolRenderer } from '../tools/ToolRenderer';
import classes from './MessageList.module.css';

export type MessageListProps = {
  messages: ChatMessage[];
  status: ChatStatus;
  className?: string;
  showCopyToolbar?: boolean;
  suppressQuestionTool?: boolean;
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
  slots?: {
    UserMessage?: React.ComponentType<{
      message: ChatMessage;
      className?: string;
      enableImagePreview?: boolean;
    }>;
    ToolRenderer?: React.ComponentType<ToolRendererSlotProps>;
  };
  classNames?: {
    userMessage?: string;
  };
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
};

const SCROLL_THRESHOLD = 80;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTextPart(part: unknown): part is { type: 'text'; text: string } {
  return isRecord(part) && part.type === 'text' && typeof part.text === 'string';
}

function isErrorPart(part: unknown): part is { type: 'error'; title?: string; message: string } {
  return isRecord(part) && part.type === 'error' && typeof part.message === 'string';
}

function isV5ToolPart(part: unknown): part is ToolPart {
  if (!isRecord(part)) {
    return false;
  }
  const partType = part.type;
  return (
    partType === 'dynamic-tool' || (typeof partType === 'string' && partType.startsWith('tool-'))
  );
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
  showCopyToolbar = true,
  suppressQuestionTool = false,
  initialScrollBehavior = 'bottom',
  enableImagePreview = true,
  slots,
  classNames,
  toolRenderers,
}: MessageListProps) {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const chatContainerObserverRef = useRef<ResizeObserver | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const prevScrollTopRef = useRef(0);
  const lastMessageIdRef = useRef<string | null>(messages[messages.length - 1]?.id ?? null);
  const assistantSpaceActiveRef = useRef(false);
  const [activeCopyId, setActiveCopyId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const CustomUserMessage = slots?.UserMessage || UserMessage;
  const CustomToolRenderer = slots?.ToolRenderer || DefaultToolRenderer;

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
      });
      observer.observe(el);
      chatContainerObserverRef.current = observer;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (chatContainerObserverRef.current) {
        chatContainerObserverRef.current.disconnect();
      }
    };
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

  const isAtBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return true;
    }
    return container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD;
  }, []);

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }

    const currentScrollTop = container.scrollTop;
    const prevScrollTop = prevScrollTopRef.current;
    prevScrollTopRef.current = currentScrollTop;

    if (currentScrollTop < prevScrollTop) {
      shouldAutoScrollRef.current = false;
      return;
    }
    shouldAutoScrollRef.current = isAtBottom();
  }, [isAtBottom]);

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
    let prevScrollHeight = container.scrollHeight;

    const resizeObserver = new ResizeObserver(() => {
      const newContentHeight = contentWrapper.getBoundingClientRect().height;
      if (newContentHeight === lastContentHeight) {
        return;
      }
      lastContentHeight = newContentHeight;

      if (!shouldAutoScrollRef.current) {
        const newScrollHeight = container.scrollHeight;
        if (newScrollHeight !== prevScrollHeight && prevScrollHeight > 0) {
          const delta = newScrollHeight - prevScrollHeight;
          container.scrollTop += delta;
        }
      }
      prevScrollHeight = container.scrollHeight;
    });

    resizeObserver.observe(contentWrapper);
    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedMessages = useMemo(() => normalizeMessages(messages), [messages]);
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
    const lastTurn = turns[turns.length - 1];
    const hasAssistant = Boolean(lastTurn && lastTurn.assistantMsgs.length > 0);
    if (last.role === 'user' && !hasAssistant) {
      return true;
    }
    return isStreaming && !getLastAssistantHasContent(normalizedMessages);
  }, [isStreaming, normalizedMessages, turns]);
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
    <Box ref={containerRefCallback} onScroll={handleScroll} className={cx(classes.root, className)}>
      <div ref={contentWrapperRef} className={classes.content}>
        <div className={classes.turns}>
          {turns.map((turn, turnIndex) => {
            const isLastTurn = turnIndex === turns.length - 1;
            const turnKey = turn.userMsg?.id ?? `turn-${turnIndex}`;

            return (
              <div key={turnKey} className={classes.turn}>
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
                    return (
                      <div className={classes.group}>
                        <CustomUserMessage
                          message={userMsg}
                          className={classNames?.userMessage}
                          enableImagePreview={enableImagePreview}
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

                    return (
                      <div className={classes.group}>
                        <div className={classes.assistantStack}>
                          {turn.assistantMsgs.map((msg, i) => {
                            const isLastMsg = isLastTurn && i === turn.assistantMsgs.length - 1;
                            return (
                              <AssistantParts
                                key={msg.id}
                                msg={msg}
                                isLast={isLastMsg}
                                isStreaming={isStreaming}
                                suppressQuestionTool={suppressQuestionTool}
                                ToolRendererComponent={CustomToolRenderer}
                                toolRenderers={toolRenderers}
                              />
                            );
                          })}
                        </div>
                        {showToolbar || toolbarVisible ? (
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
      </div>
    </Box>
  );
});

MessageList.displayName = 'MessageList';

function AssistantParts({
  msg,
  isLast,
  isStreaming,
  suppressQuestionTool,
  ToolRendererComponent,
  toolRenderers,
}: {
  msg: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
  suppressQuestionTool: boolean;
  ToolRendererComponent: React.ComponentType<ToolRendererSlotProps>;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
}) {
  const parts = useMemo(
    () => normalizeAssistantToolParts(msg.parts ?? []) as unknown[],
    [msg.parts]
  );

  const elements = useMemo(() => {
    const elems: React.ReactNode[] = [];
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

    parts.forEach((part, i) => {
      if (isV5ToolPart(part) && part.type === 'tool-TaskOutput') {
        return;
      }

      if (isTextPart(part)) {
        if (part.text) {
          elems.push(
            <div key={`${msg.id}-text-${i}`} className={classes.assistantText}>
              <Markdown content={part.text} />
            </div>
          );
        }
        return;
      }

      if (isErrorPart(part)) {
        elems.push(
          <ErrorMessage key={`${msg.id}-error-${i}`} title={part.title} message={part.message} />
        );
        return;
      }

      if (isV5ToolPart(part)) {
        if (suppressQuestionTool && part.type === 'tool-Question') {
          return;
        }
        if (part.toolCallId && nestedToolIds.has(part.toolCallId)) {
          return;
        }

        const chatStreamingStatus = isLast && isStreaming ? 'streaming' : undefined;
        const toolCallId = part.toolCallId;
        const nestedTools =
          (part.type === 'tool-Task' || part.type === 'tool-Agent') && toolCallId
            ? nestedToolsMap.get(toolCallId) || []
            : undefined;
        elems.push(
          <ToolRendererComponent
            key={part.toolCallId ?? `${msg.id}-tool-${i}`}
            part={part}
            nestedTools={nestedTools}
            chatStatus={chatStreamingStatus}
            toolRenderers={toolRenderers}
          />
        );
      }
    });

    return elems;
  }, [
    parts,
    msg.id,
    isLast,
    isStreaming,
    suppressQuestionTool,
    ToolRendererComponent,
    toolRenderers,
  ]);

  return (
    <div className={classes.assistantParts} data-stacked={elements.length > 1 || undefined}>
      {elements}
    </div>
  );
}
