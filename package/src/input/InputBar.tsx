import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Textarea, UnstyledButton } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useInputTyping } from '../hooks/use-input-typing';
import { QuestionHeader } from '../question/QuestionHeader';
import { QuestionAnswer, QuestionConfig, QuestionPrompt } from '../question/QuestionPrompt';
import type { AttachedFile, AttachedImage, ChatStatus, InputSuggestions } from '../types';
import { cx } from '../utils/cx';
import { AttachmentButton } from './AttachmentButton';
import { FileAttachment } from './FileAttachment';
import { SendButton } from './SendButton';
import { SuggestionItem, Suggestions } from './Suggestions';
import classes from './InputBar.module.css';

type InputConfig = {
  inputBarPlaceholder: string;
  attachmentButtonPosition: 'left' | 'right';
  attachmentPreviewStyle: 'thumbnail' | 'chip' | 'hidden';
};

const DEFAULT_INPUT_CONFIG: InputConfig = {
  inputBarPlaceholder: 'Send a message...',
  attachmentButtonPosition: 'left',
  attachmentPreviewStyle: 'thumbnail',
};

export interface InputBarProps {
  onSend: (message: { role: 'user'; content: string }) => void;
  status: ChatStatus;
  onStop: () => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;

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

  /** Inline question panel docked above the field */
  questionBar?: {
    id: string;
    questions: QuestionConfig[];
    questionIndex?: number;
    totalQuestions?: number;
    onPreviousQuestion?: () => void;
    onNextQuestion?: () => void;
    submitLabel?: string;
    skipLabel?: string;
    allowSkip?: boolean;
    onSubmit: (answer: QuestionAnswer) => void;
    onSkip?: () => void;
  };

  /** Content rendered on the left of the toolbar, next to the attachment button */
  leftActions?: React.ReactNode;
  /** Content rendered on the right of the toolbar, before the send button */
  rightActions?: React.ReactNode;
}

/** Chat composer: auto-growing textarea, attachments, toolbar, info and question bars, suggestions */
export const InputBar = memo(function InputBar({
  onSend,
  status,
  onStop,
  placeholder,
  className,
  style,
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
  leftActions,
  rightActions,
}: InputBarProps) {
  const [internalInput, setInternalInput] = useState('');
  const [isInfoBarOpen, setIsInfoBarOpen] = useState(true);
  const [dismissedQuestionId, setDismissedQuestionId] = useState<string | null>(null);
  const [questionBarIndex, setQuestionBarIndex] = useState(1);
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
  const config = DEFAULT_INPUT_CONFIG;

  const isStreaming = status === 'streaming' || status === 'submitted';
  const isTyping = typingAnimation?.isActive ?? false;

  const { displayedText, showImage } = useInputTyping(
    typingAnimation?.text ?? '',
    typingAnimation?.duration ?? 2000,
    isTyping,
    typingAnimation?.onComplete ?? (() => {})
  );

  const effectivePlaceholder = placeholder ?? config.inputBarPlaceholder;

  const showAttach = Boolean(onAttach);
  const attachRight = config.attachmentButtonPosition === 'right';

  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    textareaRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) {
      return;
    }
    onSend({ role: 'user', content: trimmed });
    setInput('');
  }, [input, isStreaming, disabled, onSend, setInput]);

  const handleInfoBarClose = useCallback(() => {
    setIsInfoBarOpen(false);
    infoBar?.onClose?.();
  }, [infoBar]);

  const infoBarPosition = infoBar?.position ?? 'top';
  const shouldShowInfoBar = Boolean(infoBar && (infoBar.title || infoBar.description));
  const infoBarData = infoBar ?? {};

  const infoBarNode = shouldShowInfoBar ? (
    <div
      className={classes.infoBar}
      data-open={isInfoBarOpen || undefined}
      data-position={infoBarPosition}
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
          submitLabel={questionBarData.submitLabel}
          skipLabel={questionBarData.skipLabel}
          allowSkip={questionBarData.allowSkip}
          onSubmit={(answer) => {
            questionBarData.onSubmit(answer);
            setDismissedQuestionId(questionBarData.id);
          }}
          onSkip={() => {
            questionBarData.onSkip?.();
          }}
        />
      </div>
    ) : null;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const hasInput = input.trim().length > 0;
  const hasContextItems = attachedImages.length > 0 || attachedFiles.length > 0;
  const showContextItems = hasContextItems && config.attachmentPreviewStyle !== 'hidden';
  const imageDisplayMode = config.attachmentPreviewStyle === 'thumbnail' ? 'image-only' : 'chip';

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
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
    <Box className={cx(classes.root, className)} style={style}>
      <div className={classes.inner}>
        <div className={classes.stack} data-info-bar={shouldShowInfoBar || undefined}>
          {infoBarPosition === 'top' && infoBarNode}
          {questionBarNode}
          <div
            role="presentation"
            className={classes.field}
            data-drag-over={isDragOver || undefined}
            onClick={handleContainerClick}
          >
            <div className={classes.contextGrid} data-open={showContextItems || undefined}>
              <div className={classes.contextClip}>
                {showContextItems && (
                  <div className={classes.contextItems}>
                    {attachedImages.map((img) => (
                      <FileAttachment
                        key={img.id}
                        id={img.id}
                        filename={img.filename}
                        size={img.size}
                        isImage
                        url={img.url}
                        display={imageDisplayMode}
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
                    onChange={(e) => setInput(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={onPaste}
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
                {!attachRight && showAttach && onAttach && <AttachmentButton onClick={onAttach} />}
                {leftActions}
              </div>
              <div className={classes.toolbarGroup}>
                {rightActions}
                {attachRight && showAttach && onAttach && <AttachmentButton onClick={onAttach} />}
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
          {suggestionItems.length > 0 && (
            <Suggestions
              items={suggestionItems}
              onSelect={handleSuggestionSelect}
              disabled={disabled || isStreaming}
              className={cx(classes.suggestions, suggestionsClassName)}
              itemClassName={suggestionItemClassName}
            />
          )}
          {infoBarPosition === 'bottom' && infoBarNode}
        </div>
      </div>
    </Box>
  );
});

InputBar.displayName = 'InputBar';
