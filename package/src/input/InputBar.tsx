import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Combobox,
  Group,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
  useCombobox,
} from '@mantine/core';
import { getHotkeyHandler } from '@mantine/hooks';
import { IconX } from '@tabler/icons-react';
import { useInputTyping } from '../hooks/use-input-typing';
import { QuestionHeader } from '../question/QuestionHeader';
import { QuestionAnswer, QuestionConfig, QuestionPrompt } from '../question/QuestionPrompt';
import type { AttachedFile, AttachedImage, ChatStatus, InputSuggestions } from '../types';
import { getContentWidthStyle, type ContentWidth } from '../utils/content-width';
import { cx } from '../utils/cx';
import { AttachmentButton } from './AttachmentButton';
import { applyCompletion, CompletionToken, findCompletionToken } from './completion-token';
import { FileAttachment } from './FileAttachment';
import { PastedTextAttachment } from './PastedTextAttachment';
import {
  DEFAULT_PASTE_LABEL,
  expandPastedText,
  insertPastePlaceholder,
  prunePastes,
  removePastePlaceholder,
  shouldCollapsePaste,
  countLines,
  type PasteCollapseThreshold,
  type PastedText,
} from './pasted-text';
import {
  canBrowseNewer,
  canBrowseOlder,
  INITIAL_PROMPT_HISTORY_STATE,
  navigatePromptHistory,
  type PromptHistoryState,
} from './prompt-history';
import { PromptHistorySearch, type PromptHistorySearchLabels } from './PromptHistorySearch';
import { SendButton } from './SendButton';
import { SuggestionItem, Suggestions } from './Suggestions';
import { CompletionItem, CompletionSource, useCompletionItems } from './use-completion-items';
import classes from './InputBar.module.css';

const DEFAULT_PLACEHOLDER = 'Send a message...';

export type QueuedMessage = { id: string; content: string };

export interface InputBarLabels {
  /** Name of a collapsed paste chip and its preview title, `{id}` is replaced */
  pastedText: string;
  /** Secondary line of a collapsed paste chip, `{lines}` is replaced */
  pastedTextLines: string;
  /** Accessible label of the remove button of a collapsed paste */
  removePastedText: string;
  /** Accessible label of the remove button of a queued message */
  removeQueuedMessage: string;
  /** Labels of the prompt history search dialog */
  historySearch: Partial<PromptHistorySearchLabels>;
}

const DEFAULT_LABELS: InputBarLabels = {
  pastedText: DEFAULT_PASTE_LABEL,
  pastedTextLines: '{lines} lines',
  removePastedText: 'Remove pasted text',
  removeQueuedMessage: 'Remove queued message',
  historySearch: {},
};

export interface InputBarProps {
  onSend: (message: { role: 'user'; content: string }) => void;
  status: ChatStatus;
  onStop: () => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Max width of the composer: a number in px or any CSS width, `420px` by default. Pass `'100%'` for a full-width chat */
  contentWidth?: ContentWidth;

  /** Renders the attach button when provided */
  onAttach?: () => void;
  attachedImages?: AttachedImage[];
  attachedFiles?: AttachedFile[];
  onRemoveImage?: (id: string) => void;
  onRemoveFile?: (id: string) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  /** Highlights the field border while files are dragged over it */
  isDragOver?: boolean;
  /** When `true` (default) clicking a staged image attachment opens a fullscreen lightbox preview */
  enableImagePreview?: boolean;

  /** Controlled input value */
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Suggestion pills rendered above the field, never below it */
  suggestions?: InputSuggestions;

  /** Simulated typing shown in place of the textarea, for demos */
  typingAnimation?: {
    text: string;
    duration: number;
    image?: string;
    isActive: boolean;
    onComplete: () => void;
  };

  /** Dismissible message strip above or below the field */
  infoBar?: {
    title?: string;
    description?: string;
    onClose?: () => void;
    position?: 'top' | 'bottom';
    /** Optional primary action rendered on the right (for example "Upgrade") */
    action?: {
      label: string;
      onClick: () => void;
    };
  };

  /**
   * Inline question panel docked above the field.
   * Changing `id` starts a new question set: the active index and stored answers are reset.
   */
  questionBar?: {
    id: string;
    questions: QuestionConfig[];
    /** Controlled 1-based active question, used together with `onPreviousQuestion`/`onNextQuestion` */
    questionIndex?: number;
    totalQuestions?: number;
    /** When this or `onNextQuestion` is set, navigation is external and the host drives `questionIndex` */
    onPreviousQuestion?: () => void;
    onNextQuestion?: () => void;
    submitLabel?: string;
    skipLabel?: string;
    allowSkip?: boolean;
    /**
     * Called for EVERY answered question with its 1-based `questionIndex`.
     * With internal navigation the bar then advances to the next question; the panel closes
     * only after the last question is answered.
     */
    onSubmit: (answer: QuestionAnswer, meta: { questionIndex: number }) => void;
    /** Called once when Skip is pressed (`onSubmit` is not called for it); Skip closes the panel */
    onSkip?: (meta: { questionIndex: number }) => void;
  };

  /** Trigger-based autocomplete lists, for example slash commands on `/` and mentions on `@` */
  completions?: CompletionSource[];

  /** Messages waiting to be sent after the current response, shown above the field */
  queuedMessages?: QueuedMessage[];
  /** Renders a remove button on every queued message */
  onRemoveQueued?: (id: string) => void;
  /** When set, submitting while the response is streaming queues the message instead of ignoring it */
  onQueue?: (message: { role: 'user'; content: string }) => void;
  /** Heading of the queued messages list, `Queued` by default */
  queuedLabel?: string;

  /** Content rendered on the left of the toolbar, next to the attachment button */
  leftActions?: React.ReactNode;
  /** Content rendered on the right of the toolbar, before the send button */
  rightActions?: React.ReactNode;

  /** Pastes at or above the threshold collapse into an attachment chip and are expanded again in `onSend`; `false` turns collapsing off. 10000 characters or 50 lines by default */
  pasteCollapseThreshold?: PasteCollapseThreshold | false;
  /** Previously sent prompts, oldest first: ArrowUp in an empty field or at the start of the text shows older ones, ArrowDown returns to the draft */
  history?: string[];
  /** Hotkey that opens the prompt history search over `history`, `mod+R` by default; `null` turns it off */
  historySearchHotkey?: string | null;
  /** Called by the history search hotkey instead of opening the built-in dialog */
  onHistorySearch?: () => void;
  /** Overrides for the English labels */
  labels?: Partial<InputBarLabels>;
}

/** Chat composer: auto-growing textarea, attachments, toolbar, info and question bars, suggestions */
export const InputBar = memo(function InputBar({
  onSend,
  status,
  onStop,
  placeholder,
  className,
  style,
  contentWidth,
  onAttach,
  attachedImages = [],
  attachedFiles = [],
  onRemoveImage,
  onRemoveFile,
  onPaste,
  isDragOver,
  enableImagePreview = true,
  value: controlledValue,
  onChange: controlledOnChange,
  disabled,
  autoFocus,
  suggestions = [],
  typingAnimation,
  infoBar,
  questionBar,
  completions,
  queuedMessages = [],
  onRemoveQueued,
  onQueue,
  queuedLabel = 'Queued',
  leftActions,
  rightActions,
  pasteCollapseThreshold,
  history,
  historySearchHotkey = 'mod+R',
  onHistorySearch,
  labels: labelsProp,
}: InputBarProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [internalInput, setInternalInput] = useState('');
  const [isInfoBarOpen, setIsInfoBarOpen] = useState(true);
  const [isInfoBarCollapsed, setIsInfoBarCollapsed] = useState(false);
  const infoBarKey = `${infoBar?.title ?? ''}\u0000${infoBar?.description ?? ''}`;
  const [prevInfoBarKey, setPrevInfoBarKey] = useState(infoBarKey);
  if (prevInfoBarKey !== infoBarKey) {
    setPrevInfoBarKey(infoBarKey);
    setIsInfoBarOpen(true);
    setIsInfoBarCollapsed(false);
  }

  const [dismissedQuestionId, setDismissedQuestionId] = useState<string | null>(null);
  const [questionBarIndex, setQuestionBarIndex] = useState(1);
  const [questionBarAnswers, setQuestionBarAnswers] = useState<Record<number, QuestionAnswer>>({});
  const questionBarId = questionBar?.id;
  const [prevQuestionBarId, setPrevQuestionBarId] = useState(questionBarId);
  if (prevQuestionBarId !== questionBarId) {
    setPrevQuestionBarId(questionBarId);
    setQuestionBarIndex(1);
    setQuestionBarAnswers({});
  }
  const isControlled = controlledValue !== undefined;
  const input = isControlled ? controlledValue : internalInput;
  const setInput = useCallback(
    (v: string) => {
      if (isControlled) {
        controlledOnChange?.(v);
      } else {
        setInternalInput(v);
      }
    },
    [isControlled, controlledOnChange]
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === 'streaming' || status === 'submitted';
  const isTyping = typingAnimation?.isActive ?? false;

  const { displayedText, showImage } = useInputTyping(
    typingAnimation?.text ?? '',
    typingAnimation?.duration ?? 2000,
    isTyping,
    typingAnimation?.onComplete ?? (() => {})
  );

  const effectivePlaceholder = placeholder ?? DEFAULT_PLACEHOLDER;

  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    textareaRef.current?.focus();
  }, [autoFocus]);

  const [pastes, setPastes] = useState<PastedText[]>([]);
  const pasteCounterRef = useRef(0);
  const activePastes = useMemo(
    () => prunePastes(input, pastes, labels.pastedText),
    [input, pastes, labels.pastedText]
  );
  const [historyState, setHistoryState] = useState<PromptHistoryState>(
    INITIAL_PROMPT_HISTORY_STATE
  );
  const [isHistorySearchOpen, setIsHistorySearchOpen] = useState(false);

  const resetComposerExtras = useCallback(() => {
    setPastes([]);
    pasteCounterRef.current = 0;
    setHistoryState(INITIAL_PROMPT_HISTORY_STATE);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || disabled) {
      return;
    }
    const content = expandPastedText(input, activePastes, labels.pastedText).trim();
    if (isStreaming) {
      if (onQueue) {
        onQueue({ role: 'user', content });
        setInput('');
        resetComposerExtras();
      }
      return;
    }
    onSend({ role: 'user', content });
    setInput('');
    resetComposerExtras();
  }, [
    input,
    activePastes,
    labels.pastedText,
    isStreaming,
    disabled,
    onSend,
    onQueue,
    setInput,
    resetComposerExtras,
  ]);

  const moveCaret = useCallback((position: 'start' | 'end' | number) => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) {
        return;
      }
      el.focus();
      const offset = position === 'start' ? 0 : position === 'end' ? el.value.length : position;
      el.setSelectionRange(offset, offset);
    });
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      onPaste?.(e);
      if (e.defaultPrevented) {
        return;
      }
      const text = e.clipboardData.getData('text/plain');
      if (!text || !shouldCollapsePaste(text, pasteCollapseThreshold)) {
        return;
      }
      e.preventDefault();
      const el = e.currentTarget;
      pasteCounterRef.current += 1;
      const id = pasteCounterRef.current;
      const next = insertPastePlaceholder(
        input,
        el.selectionStart,
        el.selectionEnd,
        id,
        labels.pastedText
      );
      setPastes((prev) => [
        ...prunePastes(input, prev, labels.pastedText),
        { id, text, lines: countLines(text) },
      ]);
      setInput(next.text);
      setCaret(next.caret);
      moveCaret(next.caret);
    },
    [onPaste, pasteCollapseThreshold, input, setInput, moveCaret, labels.pastedText]
  );

  const removePaste = useCallback(
    (id: number) => {
      setInput(removePastePlaceholder(input, id, labels.pastedText));
      setPastes((prev) => prev.filter((paste) => paste.id !== id));
    },
    [input, setInput, labels.pastedText]
  );

  const hasHistory = (history?.length ?? 0) > 0;
  const openHistorySearch = useCallback(() => {
    if (onHistorySearch) {
      onHistorySearch();
    } else if (hasHistory) {
      setIsHistorySearchOpen(true);
    }
  }, [onHistorySearch, hasHistory]);

  const handleHistorySelect = useCallback(
    (prompt: string) => {
      setInput(prompt);
      setHistoryState(INITIAL_PROMPT_HISTORY_STATE);
      moveCaret('end');
    },
    [setInput, moveCaret]
  );

  const [caret, setCaret] = useState<number | null>(null);
  const [dismissedTokenKey, setDismissedTokenKey] = useState<string | null>(null);
  const completionTriggers = useMemo(
    () => (completions ?? []).map((source) => source.trigger),
    [completions]
  );
  const completionToken: CompletionToken | null =
    completionTriggers.length > 0 && caret !== null && !disabled && !isTyping
      ? findCompletionToken(input, Math.min(caret, input.length), completionTriggers)
      : null;
  const completionTokenKey = completionToken
    ? `${completionToken.start}:${completionToken.trigger}`
    : null;
  if (!completionTokenKey && dismissedTokenKey) {
    setDismissedTokenKey(null);
  }
  const completionSource = completionToken
    ? completions?.find((source) => source.trigger === completionToken.trigger)
    : undefined;
  const completionItems = useCompletionItems(completionSource, completionToken?.query ?? null);
  const isCompletionOpen =
    completionItems.length > 0 &&
    completionTokenKey !== null &&
    completionTokenKey !== dismissedTokenKey;

  const combobox = useCombobox({
    opened: isCompletionOpen,
    onOpenedChange: (opened) => {
      if (!opened) {
        setDismissedTokenKey(completionTokenKey);
      }
    },
  });
  const comboboxRef = useRef(combobox);
  comboboxRef.current = combobox;

  useEffect(() => {
    if (isCompletionOpen) {
      comboboxRef.current.selectFirstOption();
    }
  }, [isCompletionOpen, completionItems]);

  const insertCompletion = useCallback(
    (item: CompletionItem) => {
      if (!completionToken) {
        return;
      }
      const next = applyCompletion(input, completionToken, item.value);
      setInput(next.text);
      setCaret(next.caret);
      completionSource?.onSelect?.(item);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) {
          return;
        }
        el.focus();
        el.setSelectionRange(next.caret, next.caret);
      });
    },
    [completionToken, completionSource, input, setInput]
  );

  const completionGroups = useMemo(() => {
    const groups: Array<{
      label: string;
      entries: Array<{ item: CompletionItem; index: number }>;
    }> = [];
    completionItems.forEach((item, index) => {
      const label = item.group ?? '';
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.entries.push({ item, index });
      } else {
        groups.push({ label, entries: [{ item, index }] });
      }
    });
    return groups;
  }, [completionItems]);

  const handleInfoBarClose = useCallback(() => {
    setIsInfoBarOpen(false);
    infoBar?.onClose?.();
  }, [infoBar]);

  const infoBarPosition = infoBar?.position ?? 'top';
  const shouldShowInfoBar = Boolean(infoBar && (infoBar.title || infoBar.description));
  const infoBarData = infoBar ?? {};

  const hasInfoBarBackground = shouldShowInfoBar && (isInfoBarOpen || !isInfoBarCollapsed);

  const handleInfoBarTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isInfoBarOpen) {
      setIsInfoBarCollapsed(true);
    }
  };

  const infoBarNode = shouldShowInfoBar ? (
    <div
      className={classes.infoBar}
      data-open={isInfoBarOpen || undefined}
      data-position={infoBarPosition}
      onTransitionEnd={handleInfoBarTransitionEnd}
    >
      <div className={classes.infoBarText}>
        {infoBarData.title && <span className={classes.infoBarTitle}>{infoBarData.title}</span>}
        {infoBarData.description && (
          <span className={classes.infoBarDescription}>
            {infoBarData.title ? ` ${infoBarData.description}` : infoBarData.description}
          </span>
        )}
      </div>
      <div className={classes.infoBarActions}>
        {infoBarData.action && (
          <UnstyledButton onClick={infoBarData.action.onClick} className={classes.infoBarAction}>
            {infoBarData.action.label}
          </UnstyledButton>
        )}
        {infoBarData.onClose && (
          <UnstyledButton
            onClick={handleInfoBarClose}
            className={classes.infoBarClose}
            aria-label="Close"
          >
            <IconX size={14} stroke={2} />
          </UnstyledButton>
        )}
      </div>
    </div>
  ) : null;

  const shouldShowQuestionBar = Boolean(questionBar && questionBar.id !== dismissedQuestionId);
  const questionBarData = questionBar;
  const questionSet = questionBarData?.questions ?? [];
  const hasQuestions = questionSet.length > 0;
  const derivedTotal = hasQuestions ? questionSet.length : 1;
  const totalQuestions = questionBarData?.totalQuestions ?? derivedTotal;
  const hasExternalQuestionNavigation = Boolean(
    questionBarData?.onPreviousQuestion || questionBarData?.onNextQuestion
  );
  const questionIndex = hasExternalQuestionNavigation
    ? (questionBarData?.questionIndex ?? 1)
    : questionBarIndex;
  const clampedQuestionIndex = Math.max(1, Math.min(questionIndex, totalQuestions));
  const activeQuestion = hasQuestions ? questionSet[clampedQuestionIndex - 1] : undefined;
  const showQuestionNavigation = totalQuestions > 1;
  const canGoPrev = clampedQuestionIndex > 1;
  const canGoNext = clampedQuestionIndex < totalQuestions;

  const handleQuestionPrevious = useCallback(() => {
    if (!canGoPrev) {
      return;
    }
    if (questionBarData?.onPreviousQuestion) {
      questionBarData.onPreviousQuestion();
      return;
    }
    setQuestionBarIndex((prev) => Math.max(1, prev - 1));
  }, [canGoPrev, questionBarData]);

  const handleQuestionNext = useCallback(() => {
    if (!canGoNext) {
      return;
    }
    if (questionBarData?.onNextQuestion) {
      questionBarData.onNextQuestion();
      return;
    }
    setQuestionBarIndex((prev) => Math.min(totalQuestions, prev + 1));
  }, [canGoNext, questionBarData, totalQuestions]);

  const questionBarNode =
    shouldShowQuestionBar && questionBarData && activeQuestion ? (
      <div
        className={classes.questionBar}
        data-rounded-top={!shouldShowInfoBar || infoBarPosition === 'bottom' || undefined}
      >
        <QuestionHeader
          index={clampedQuestionIndex}
          total={totalQuestions}
          showNavigation={showQuestionNavigation}
          onPrevious={handleQuestionPrevious}
          onNext={handleQuestionNext}
        />
        <QuestionPrompt
          key={`${clampedQuestionIndex}-${activeQuestion.title}`}
          questions={questionSet}
          questionIndex={clampedQuestionIndex}
          totalQuestions={totalQuestions}
          initialAnswer={questionBarAnswers[clampedQuestionIndex]}
          submitLabel={questionBarData.submitLabel}
          skipLabel={questionBarData.skipLabel}
          allowSkip={questionBarData.allowSkip}
          onSubmit={(answer) => {
            const answeredIndex = clampedQuestionIndex;
            setQuestionBarAnswers((prev) => ({ ...prev, [answeredIndex]: answer }));
            questionBarData.onSubmit(answer, { questionIndex: answeredIndex });
            if (answeredIndex >= totalQuestions) {
              setDismissedQuestionId(questionBarData.id);
            } else if (!hasExternalQuestionNavigation) {
              setQuestionBarIndex(answeredIndex + 1);
            }
          }}
          onSkip={() => {
            questionBarData.onSkip?.({ questionIndex: clampedQuestionIndex });
            setDismissedQuestionId(questionBarData.id);
          }}
        />
      </div>
    ) : null;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return;
      }
      if (isCompletionOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          combobox.selectNextOption();
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          combobox.selectPreviousOption();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setDismissedTokenKey(completionTokenKey);
          return;
        }
        if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
          e.preventDefault();
          const selectedIndex = combobox.getSelectedOptionIndex();
          insertCompletion(completionItems[selectedIndex >= 0 ? selectedIndex : 0]);
          return;
        }
      }
      if (historySearchHotkey && (hasHistory || onHistorySearch)) {
        let matched = false;
        getHotkeyHandler([
          [
            historySearchHotkey,
            () => {
              matched = true;
              openHistorySearch();
            },
          ],
        ])(e);
        if (matched) {
          return;
        }
      }
      const isPlainArrow = !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey;
      if (history && isPlainArrow && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        const el = e.currentTarget;
        const older = e.key === 'ArrowUp';
        const allowed = older
          ? canBrowseOlder(input, el.selectionStart, el.selectionEnd)
          : historyState.index !== null &&
            canBrowseNewer(input, el.selectionStart, el.selectionEnd);
        const result = allowed
          ? navigatePromptHistory(history, historyState, older ? 'older' : 'newer', input)
          : null;
        if (result) {
          e.preventDefault();
          setHistoryState(result.state);
          setInput(result.value);
          moveCaret(older ? 'start' : 'end');
          return;
        }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [
      combobox,
      completionItems,
      completionTokenKey,
      handleSubmit,
      insertCompletion,
      isCompletionOpen,
      historySearchHotkey,
      hasHistory,
      onHistorySearch,
      openHistorySearch,
      history,
      input,
      historyState,
      setInput,
      moveCaret,
    ]
  );

  const queueNode =
    queuedMessages.length > 0 ? (
      <Stack gap={2} px={12} pt={6} pb={8} aria-label={queuedLabel}>
        <Text size="xs" fw={500} className={classes.queueLabel}>
          {queuedLabel}
        </Text>
        {queuedMessages.map((message) => (
          <Group key={message.id} gap={6} wrap="nowrap" miw={0}>
            <Text size="xs" truncate="end" flex={1} miw={0} className={classes.queueText}>
              {message.content}
            </Text>
            {onRemoveQueued && (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="xs"
                aria-label={labels.removeQueuedMessage}
                onClick={() => onRemoveQueued(message.id)}
              >
                <IconX size={12} stroke={2} />
              </ActionIcon>
            )}
          </Group>
        ))}
      </Stack>
    ) : null;

  const hasInput = input.trim().length > 0;
  const hasContextItems =
    attachedImages.length > 0 || attachedFiles.length > 0 || activePastes.length > 0;

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (!e.currentTarget.contains(e.target as Node)) {
      return;
    }
    if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('button, textarea')) {
      textareaRef.current?.focus();
    }
  }, []);

  const handleSuggestionSelect = useCallback(
    (item: SuggestionItem) => {
      if (disabled || isStreaming) {
        return;
      }
      setInput(item.value ?? item.label);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) {
          return;
        }
        el.focus();
        const end = el.value.length;
        el.setSelectionRange(end, end);
      });
    },
    [disabled, isStreaming, setInput]
  );

  const suggestionItems = Array.isArray(suggestions) ? suggestions : (suggestions?.items ?? []);
  const suggestionsClassName = Array.isArray(suggestions) ? undefined : suggestions?.className;
  const suggestionItemClassName = Array.isArray(suggestions)
    ? undefined
    : suggestions?.itemClassName;

  let sendState: 'idle' | 'typing' | 'streaming' = 'idle';
  if (isStreaming) {
    sendState = 'streaming';
  } else if (hasInput && !disabled) {
    sendState = 'typing';
  }

  return (
    <Box className={cx(classes.root, className)} style={getContentWidthStyle(contentWidth, style)}>
      <div className={classes.inner}>
        <div className={classes.stack} data-info-bar={hasInfoBarBackground || undefined}>
          {infoBarPosition === 'top' && infoBarNode}
          {questionBarNode}
          {queueNode}
          {suggestionItems.length > 0 && (
            <Suggestions
              items={suggestionItems}
              onSelect={handleSuggestionSelect}
              disabled={disabled || isStreaming}
              className={cx(classes.suggestions, suggestionsClassName)}
              itemClassName={suggestionItemClassName}
            />
          )}
          <Combobox
            store={combobox}
            onOptionSubmit={(value) => insertCompletion(completionItems[Number(value)])}
            position="top-start"
            width="target"
            offset={6}
            transitionProps={{ duration: 0 }}
            classNames={{ dropdown: classes.completionDropdown }}
          >
            <Combobox.DropdownTarget>
              <div
                role="presentation"
                className={classes.field}
                data-drag-over={isDragOver || undefined}
                onClick={handleContainerClick}
              >
                <div className={classes.contextGrid} data-open={hasContextItems || undefined}>
                  <div className={classes.contextClip}>
                    {hasContextItems && (
                      <div className={classes.contextItems}>
                        {attachedImages.map((img) => (
                          <FileAttachment
                            key={img.id}
                            id={img.id}
                            filename={img.filename}
                            size={img.size}
                            isImage
                            url={img.url}
                            display="image-only"
                            enableImagePreview={enableImagePreview}
                            onRemove={onRemoveImage ? () => onRemoveImage(img.id) : undefined}
                          />
                        ))}
                        {attachedFiles.map((file) => (
                          <FileAttachment
                            key={file.id}
                            id={file.id}
                            filename={file.filename}
                            size={file.size}
                            onRemove={onRemoveFile ? () => onRemoveFile(file.id) : undefined}
                          />
                        ))}
                        {activePastes.map((paste) => (
                          <PastedTextAttachment
                            key={paste.id}
                            paste={paste}
                            label={labels.pastedText}
                            linesLabel={labels.pastedTextLines}
                            removeLabel={labels.removePastedText}
                            onRemove={disabled ? undefined : () => removePaste(paste.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isTyping && typingAnimation?.image && showImage && (
                  <div className={classes.typingImages}>
                    <div className={classes.typingImage}>
                      <img src={typingAnimation.image} alt="" className={classes.typingImg} />
                    </div>
                  </div>
                )}

                <div className={classes.inputWrap}>
                  {isTyping ? (
                    <div className={classes.typingText}>
                      <span>{displayedText}</span>
                      <span className={classes.caret} />
                    </div>
                  ) : (
                    <>
                      <Textarea
                        ref={textareaRef}
                        variant="unstyled"
                        autosize
                        minRows={1}
                        maxRows={5}
                        value={input}
                        onChange={(e) => {
                          setInput(e.currentTarget.value);
                          setCaret(e.currentTarget.selectionStart);
                          if (historyState.index !== null) {
                            setHistoryState(INITIAL_PROMPT_HISTORY_STATE);
                          }
                        }}
                        onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
                        onKeyDown={handleKeyDown}
                        aria-expanded={completionTriggers.length > 0 ? isCompletionOpen : undefined}
                        aria-haspopup={completionTriggers.length > 0 ? 'listbox' : undefined}
                        onPaste={handlePaste}
                        placeholder={effectivePlaceholder}
                        disabled={disabled}
                        classNames={{
                          root: classes.textareaRoot,
                          wrapper: classes.textareaWrapper,
                          input: classes.textarea,
                        }}
                      />
                      <div className={classes.focusRing} />
                    </>
                  )}
                </div>

                <div className={classes.toolbar}>
                  <div className={cx(classes.toolbarGroup, classes.toolbarLeft)}>
                    {onAttach && <AttachmentButton onClick={onAttach} />}
                    {leftActions}
                  </div>
                  <div className={classes.toolbarGroup}>
                    {rightActions}
                    <UnstyledButton
                      className={classes.sendWrap}
                      aria-label={isStreaming ? 'Stop' : 'Send'}
                      onClick={() => {
                        if (isStreaming) {
                          onStop();
                        } else if (hasInput) {
                          handleSubmit();
                        }
                      }}
                    >
                      <SendButton state={sendState} />
                    </UnstyledButton>
                  </div>
                </div>
              </div>
            </Combobox.DropdownTarget>
            <Combobox.Dropdown>
              <Combobox.Options mah={240} className={classes.completionOptions}>
                {completionGroups.map((group) => {
                  const options = group.entries.map(({ item, index }) => (
                    <Combobox.Option
                      key={`${index}-${item.value}`}
                      value={String(index)}
                      className={classes.completionOption}
                    >
                      <Group gap={8} wrap="nowrap" miw={0}>
                        {item.icon && <span className={classes.completionIcon}>{item.icon}</span>}
                        <Text size="xs" fw={500} className={classes.completionLabel}>
                          {item.label}
                        </Text>
                        {item.description && (
                          <Text
                            size="xs"
                            truncate="end"
                            miw={0}
                            className={classes.completionDescription}
                          >
                            {item.description}
                          </Text>
                        )}
                      </Group>
                    </Combobox.Option>
                  ));
                  return group.label ? (
                    <Combobox.Group key={group.label} label={group.label}>
                      {options}
                    </Combobox.Group>
                  ) : (
                    <React.Fragment key="__ungrouped">{options}</React.Fragment>
                  );
                })}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
          {infoBarPosition === 'bottom' && infoBarNode}
        </div>
      </div>
      {history && !onHistorySearch && (
        <PromptHistorySearch
          opened={isHistorySearchOpen}
          onClose={() => setIsHistorySearchOpen(false)}
          history={history}
          onSelect={handleHistorySelect}
          labels={labels.historySearch}
        />
      )}
    </Box>
  );
});

InputBar.displayName = 'InputBar';
