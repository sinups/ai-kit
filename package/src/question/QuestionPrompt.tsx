import React, { useState } from 'react';
import { Box, Textarea, TextInput, UnstyledButton } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { Markdown } from '../Markdown/Markdown';
import { cx } from '../utils/cx';
import {
  QUESTION_CUSTOM_ID,
  buildQuestionAnswer,
  canSubmitQuestion,
  getInitialQuestionDraft,
  getPreviewOption,
  toPreviewMarkdown,
} from './question-answer';
import classes from './QuestionPrompt.module.css';

export type QuestionOptionPreview = {
  /** `markdown` renders the content as Markdown, `code` as a code block */
  kind: 'markdown' | 'code';
  content: string;
  /** Code block language for `code` previews */
  language?: string;
};

export type QuestionOption = {
  id: string;
  label: string;
  description?: string;
  /** Shown beside the options when the prompt is wide and under the chosen option when narrow */
  preview?: QuestionOptionPreview;
};

export type QuestionConfig = {
  kind: 'single' | 'multi' | 'text';
  title: string;
  description?: string;
  options?: QuestionOption[];
  /** Adds a free-text option after the predefined ones */
  allowCustom?: boolean;
  customLabel?: string;
  customPlaceholder?: string;
  minSelections?: number;
  maxSelections?: number;
  /** Placeholder for the `text` kind */
  placeholder?: string;
  /** Adds an optional notes field whose value is sent as `QuestionAnswer.notes` */
  allowNotes?: boolean;
  /** Notes field placeholder, `Add a note (optional)` by default */
  notesPlaceholder?: string;
};

export type QuestionAnswer = {
  kind: 'single' | 'multi' | 'text' | 'skip';
  selectedIds?: string[];
  text?: string;
  /** Free-form note added to the answer when the question allows notes */
  notes?: string;
};

function optionBadge(idx: number) {
  return String.fromCharCode(65 + idx);
}

const WIDE_PREVIEW_WIDTH = 640;

export interface QuestionPromptProps {
  questions: QuestionConfig[];
  /** 1-based index of the active question, `1` by default */
  questionIndex?: number;
  totalQuestions?: number;
  onPreviousQuestion?: () => void;
  onNextQuestion?: () => void;
  /**
   * Answer used to pre-fill the form when revisiting a question.
   * Read only on mount: hosts remount the prompt (via `key`) when the active question changes.
   */
  initialAnswer?: QuestionAnswer;
  /** Label for the primary action on the LAST question, `'Send'` by default */
  submitLabel?: string;
  /**
   * Label for the primary action when there are more questions ahead, `'Next'` by default.
   * The host (for example QuestionTool) is expected to advance to the next question after `onSubmit` fires.
   */
  nextLabel?: string;
  /** `'Skip'` by default */
  skipLabel?: string;
  /** Whether the skip button is shown, `true` by default */
  allowSkip?: boolean;
  onSubmit: (answer: QuestionAnswer) => void;
  /**
   * Called when the skip button is pressed. When provided, `onSubmit` is NOT called for the skip.
   * When omitted, skipping is reported as `onSubmit({ kind: 'skip' })`.
   */
  onSkip?: () => void;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Single question form: lettered options for single/multi choice, optional custom answer, or a free-text area */
export function QuestionPrompt({
  questions,
  questionIndex = 1,
  totalQuestions,
  onPreviousQuestion,
  onNextQuestion,
  submitLabel = 'Send',
  nextLabel = 'Next',
  skipLabel = 'Skip',
  allowSkip = true,
  initialAnswer,
  onSubmit,
  onSkip,
  className,
  style,
}: QuestionPromptProps) {
  const resolvedTotal = totalQuestions ?? questions.length;
  const clampedIndex = Math.max(1, Math.min(questionIndex, resolvedTotal));
  const activeQuestion = questions[clampedIndex - 1];
  const [initialState] = useState(() => getInitialQuestionDraft(initialAnswer, activeQuestion));
  const [selectedIds, setSelectedIds] = useState(initialState.selectedIds);
  const [customText, setCustomText] = useState(initialState.customText);
  const [textValue, setTextValue] = useState(initialState.textValue);
  const [notes, setNotes] = useState(initialState.notes);
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
  const { ref, width } = useElementSize();
  const customEnabled = activeQuestion?.allowCustom ?? false;
  const showNav = resolvedTotal > 1 && (!!onPreviousQuestion || !!onNextQuestion);
  const canGoPrev = clampedIndex > 1;
  const canGoNext = clampedIndex < resolvedTotal;
  const isLastQuestion = clampedIndex >= resolvedTotal;
  const primaryLabel = isLastQuestion ? submitLabel : nextLabel;

  const draft = { selectedIds, customText, textValue, notes };
  const canSubmit = activeQuestion ? canSubmitQuestion(activeQuestion, draft) : false;

  const toggleMulti = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSingleSelect = (id: string) => {
    setSelectedIds([id]);
  };

  const handleCustomTextChange = (nextValue: string) => {
    setCustomText(nextValue);
    if (!activeQuestion) {
      return;
    }
    if (activeQuestion.kind === 'single') {
      setSelectedIds(nextValue.trim().length > 0 ? [QUESTION_CUSTOM_ID] : []);
      return;
    }
    setSelectedIds((prev) => {
      const hasCustom = prev.includes(QUESTION_CUSTOM_ID);
      if (nextValue.trim().length > 0 && !hasCustom) {
        return [...prev, QUESTION_CUSTOM_ID];
      }
      if (nextValue.trim().length === 0 && hasCustom) {
        return prev.filter((id) => id !== QUESTION_CUSTOM_ID);
      }
      return prev;
    });
  };

  const handleSubmit = () => {
    if (!canSubmit || !activeQuestion) {
      return;
    }
    onSubmit(buildQuestionAnswer(activeQuestion, draft));
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
      return;
    }
    onSubmit({ kind: 'skip' });
  };

  if (!activeQuestion) {
    return null;
  }

  const options = activeQuestion.options ?? [];
  const previewOption =
    activeQuestion.kind !== 'text'
      ? getPreviewOption(options, selectedIds, activeOptionId)
      : undefined;
  const isWide = width >= WIDE_PREVIEW_WIDTH;
  const renderPreview = (className: string) =>
    width > 0 && previewOption?.preview ? (
      <div
        className={className}
        data-preview={previewOption.id}
        data-kind={previewOption.preview.kind}
      >
        <Markdown content={toPreviewMarkdown(previewOption.preview)} />
      </div>
    ) : null;

  return (
    <Box ref={ref} className={cx(classes.root, className)} style={style}>
      <div className={classes.header}>
        <div className={classes.title}>
          <span className={classes.indexBadge}>{clampedIndex}</span>
          <span>{activeQuestion.title}</span>
        </div>
      </div>

      {activeQuestion.kind !== 'text' && options.length > 0 && (
        <div
          className={classes.choice}
          data-wide-preview={(isWide && !!previewOption) || undefined}
        >
          <div className={classes.options}>
            {options.map((option, idx) => {
              const checked = selectedIds.includes(option.id);
              return (
                <React.Fragment key={option.id}>
                  <UnstyledButton
                    onMouseEnter={option.preview ? () => setActiveOptionId(option.id) : undefined}
                    onFocus={option.preview ? () => setActiveOptionId(option.id) : undefined}
                    onClick={() => {
                      if (activeQuestion.kind === 'single') {
                        handleSingleSelect(option.id);
                        if (customEnabled) {
                          setCustomText('');
                        }
                      } else {
                        toggleMulti(option.id);
                      }
                    }}
                    className={classes.option}
                    data-checked={checked || undefined}
                    aria-pressed={checked}
                  >
                    <span className={classes.badge} data-checked={checked || undefined}>
                      {optionBadge(idx)}
                    </span>
                    <span className={classes.optionLabel}>
                      {option.label}
                      {option.description && (
                        <span className={classes.optionDescription}> {option.description}</span>
                      )}
                    </span>
                  </UnstyledButton>
                  {!isWide &&
                    previewOption?.id === option.id &&
                    (checked || activeOptionId === option.id) &&
                    renderPreview(classes.inlinePreview)}
                </React.Fragment>
              );
            })}

            {customEnabled && (
              <div className={classes.custom}>
                <span
                  className={classes.badge}
                  data-checked={selectedIds.includes(QUESTION_CUSTOM_ID) || undefined}
                >
                  {optionBadge(options.length)}
                </span>
                <TextInput
                  variant="unstyled"
                  value={customText}
                  onChange={(event) => handleCustomTextChange(event.currentTarget.value)}
                  placeholder={activeQuestion.customPlaceholder ?? 'Type your answer'}
                  classNames={{ root: classes.customInputRoot, input: classes.customInput }}
                />
              </div>
            )}
          </div>
          {isWide && renderPreview(classes.sidePreview)}
        </div>
      )}

      {activeQuestion.kind === 'text' && (
        <Textarea
          variant="unstyled"
          value={textValue}
          onChange={(event) => setTextValue(event.currentTarget.value)}
          placeholder={activeQuestion.placeholder ?? 'Type your answer'}
          rows={3}
          resize="vertical"
          classNames={{ root: classes.textareaRoot, input: classes.textarea }}
        />
      )}

      {activeQuestion.allowNotes && (
        <Textarea
          variant="unstyled"
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          placeholder={activeQuestion.notesPlaceholder ?? 'Add a note (optional)'}
          aria-label={activeQuestion.notesPlaceholder ?? 'Add a note (optional)'}
          autosize
          minRows={1}
          maxRows={4}
          classNames={{ root: classes.textareaRoot, input: classes.textarea }}
        />
      )}

      <div className={classes.footer} data-nav={showNav || undefined}>
        {showNav && (
          <div className={classes.footerGroup}>
            {onPreviousQuestion && (
              <UnstyledButton
                onClick={onPreviousQuestion}
                disabled={!canGoPrev}
                className={classes.navButton}
              >
                Previous
              </UnstyledButton>
            )}
            {onNextQuestion && (
              <UnstyledButton
                onClick={onNextQuestion}
                disabled={!canGoNext}
                className={classes.navButton}
              >
                Next
              </UnstyledButton>
            )}
          </div>
        )}
        <div className={cx(classes.footerGroup, classes.footerActions)}>
          {allowSkip && (
            <UnstyledButton onClick={handleSkip} className={classes.skipButton}>
              {skipLabel}
            </UnstyledButton>
          )}
          <UnstyledButton
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={classes.submitButton}
          >
            {primaryLabel}
          </UnstyledButton>
        </div>
      </div>
    </Box>
  );
}

QuestionPrompt.displayName = 'QuestionPrompt';
