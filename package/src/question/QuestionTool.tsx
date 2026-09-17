import React, { useMemo, useState } from 'react';
import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import { formatQuestionAnswer } from './question-answer';
import { QuestionHeader, type QuestionHeaderLabels } from './QuestionHeader';
import {
  QuestionAnswer,
  QuestionConfig,
  QuestionPrompt,
  DEFAULT_QUESTION_PROMPT_LABELS,
  type QuestionPromptLabels,
} from './QuestionPrompt';
import classes from './QuestionTool.module.css';

export type QuestionToolPart = {
  type: string;
  toolCallId?: string;
  state?: string;
  input?: {
    questions: QuestionConfig[];
    /** Controlled 1-based index of the active question */
    questionIndex?: number;
    totalQuestions?: number;
    onPreviousQuestion?: () => void;
    onNextQuestion?: () => void;
    submitLabel?: string;
    nextLabel?: string;
    skipLabel?: string;
    allowSkip?: boolean;
    onSubmitAnswer?: (answer: QuestionAnswer) => void;
    /** Shows a "Review your answers" step after the last question; answers are final only after it is confirmed */
    review?: boolean;
    /** Called with all answers, keyed by 1-based question index, when the review step is confirmed */
    onSubmitAnswers?: (answers: Record<number, QuestionAnswer>) => void;
    /** Review step title, `Check your answers` by default */
    reviewTitle?: string;
    /** Review step confirm button, `Send answers` by default */
    reviewSubmitLabel?: string;
    /** Review step edit button, `Change` by default; hidden while `questionIndex` is controlled */
    reviewEditLabel?: string;
    /** Shows numbered question navigation that marks answered questions, on by default only with `review` */
    showProgress?: boolean;
    /** Accessible label of the question navigation, `Questions` by default */
    stepsLabel?: string;
  };
  output?: {
    answer?: QuestionAnswer;
  };
};

export interface QuestionToolLabels {
  /** Answer of a question that has not been answered yet, `Pending` by default */
  pending: string;
  /** Accessible label of the question navigation, `Questions` by default */
  steps: string;
  /** Accessible label of a step button, `Question 2, answered` by default */
  step: (index: number, answered: boolean) => string;
  /** Review step title, `Check your answers` by default */
  reviewTitle: string;
  /** Review step confirm button, `Send answers` by default */
  reviewSubmit: string;
  /** Review step edit button, `Change` by default */
  reviewEdit: string;
  /** Labels of the question header */
  header: Partial<QuestionHeaderLabels>;
  /** Labels of the question form */
  prompt: Partial<QuestionPromptLabels>;
}

export const DEFAULT_QUESTION_TOOL_LABELS: QuestionToolLabels = {
  pending: 'Pending',
  steps: 'Questions',
  step: (index, answered) => `Question ${index}${answered ? ', answered' : ''}`,
  reviewTitle: 'Check your answers',
  reviewSubmit: 'Send answers',
  reviewEdit: 'Change',
  header: {},
  prompt: {},
};

export interface QuestionToolProps {
  part: QuestionToolPart;
  chatStatus?: string;
  /** Overrides of the default English labels */
  labels?: Partial<QuestionToolLabels>;
  className?: string;
  style?: React.CSSProperties;
}

/** Tool card for the "ask user" tool: a header with question navigation and the active QuestionPrompt, collapsing into a summary once answered */
export function QuestionTool(props: QuestionToolProps) {
  return <QuestionToolCard key={props.part.toolCallId} {...props} />;
}

function QuestionToolCard({ part, labels: labelsProp, className, style }: QuestionToolProps) {
  const labels = { ...DEFAULT_QUESTION_TOOL_LABELS, ...labelsProp };
  const [localIndex, setLocalIndex] = useState(part.input?.questionIndex ?? 1);
  const questions: QuestionConfig[] = part.input?.questions ?? [];
  const totalQuestions = part.input?.totalQuestions ?? questions.length;
  const isControlled = typeof part.input?.questionIndex === 'number';
  const questionIndex = isControlled ? (part.input?.questionIndex ?? 1) : localIndex;
  const clampedIndex = Math.max(1, Math.min(questionIndex, totalQuestions));
  const question = questions[clampedIndex - 1];
  const [localAnswers, setLocalAnswers] = useState<Record<number, QuestionAnswer>>({});
  const [reviewing, setReviewing] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const withReview = !!part.input?.review;
  const showProgress = part.input?.showProgress ?? withReview;

  const outputAnswer = part.output?.answer;
  const answeredCount = Object.keys(localAnswers).length;
  const allAnswered = totalQuestions > 0 && answeredCount >= totalQuestions;
  const isComplete = !!outputAnswer || (withReview ? reviewConfirmed : allAnswered);
  const showNavigation = totalQuestions > 1 && !isComplete;
  const canGoPrev = clampedIndex > 1;
  const canGoNext = clampedIndex < totalQuestions;

  const summaryAnswers = useMemo(() => {
    if (!isComplete || totalQuestions <= 1 || answeredCount === 0) {
      return [];
    }
    return Array.from({ length: totalQuestions }, (_, idx) => ({
      index: idx + 1,
      answer: localAnswers[idx + 1],
    }));
  }, [isComplete, localAnswers, totalQuestions, answeredCount]);

  const pendingLabel = labels.pending;
  const summaryText = useMemo(() => {
    const allOptions = questions.flatMap((q) => q.options ?? []);
    if (!isComplete) {
      return '';
    }
    if (summaryAnswers.length > 0) {
      return summaryAnswers
        .map(
          (item) =>
            `${item.index}: ${item.answer ? formatQuestionAnswer(item.answer, questions[item.index - 1]?.options ?? []) : pendingLabel}`
        )
        .join(' • ');
    }
    if (outputAnswer) {
      return formatQuestionAnswer(outputAnswer, allOptions);
    }
    if (localAnswers[clampedIndex]) {
      return formatQuestionAnswer(localAnswers[clampedIndex], allOptions);
    }
    return pendingLabel;
  }, [
    isComplete,
    summaryAnswers,
    outputAnswer,
    localAnswers,
    clampedIndex,
    questions,
    pendingLabel,
  ]);

  if (!question) {
    return null;
  }

  const goPrev = () => {
    if (!canGoPrev) {
      return;
    }
    part.input?.onPreviousQuestion?.();
    if (!isControlled) {
      setLocalIndex((prev) => Math.max(1, prev - 1));
    }
  };

  const goTo = (index: number) => {
    setReviewing(false);
    if (!isControlled) {
      setLocalIndex(index);
    }
  };

  const goNext = () => {
    if (!canGoNext) {
      return;
    }
    part.input?.onNextQuestion?.();
    if (!isControlled) {
      setLocalIndex((prev) => Math.min(totalQuestions, prev + 1));
    }
  };

  return (
    <Box className={cx(classes.root, className)} style={style}>
      <QuestionHeader
        index={clampedIndex}
        total={totalQuestions}
        showNavigation={showNavigation}
        onPrevious={goPrev}
        onNext={goNext}
        labels={labels.header}
      />

      {!isComplete && showProgress && totalQuestions > 1 && (
        <Group
          gap={4}
          px={12}
          pt={6}
          wrap="wrap"
          role="navigation"
          aria-label={part.input?.stepsLabel ?? labels.steps}
          className={classes.steps}
        >
          {Array.from({ length: totalQuestions }, (_, idx) => {
            const index = idx + 1;
            const answered = !!localAnswers[index];
            const current = !reviewing && index === clampedIndex;
            return (
              <Button
                key={index}
                size="compact-xs"
                radius="xl"
                variant={current ? 'light' : 'subtle'}
                color={answered ? undefined : 'gray'}
                leftSection={answered ? <IconCheck size={12} /> : undefined}
                aria-current={current ? 'step' : undefined}
                aria-label={labels.step(index, answered)}
                data-answered={answered || undefined}
                disabled={isControlled || (!answered && !current)}
                onClick={() => goTo(index)}
              >
                {index}
              </Button>
            );
          })}
        </Group>
      )}

      {isComplete ? (
        <div className={classes.summary}>{summaryText}</div>
      ) : reviewing ? (
        <Stack gap={10} p={12} className={classes.review}>
          <Text size="sm" fw={500}>
            {part.input?.reviewTitle ?? labels.reviewTitle}
          </Text>
          {questions.slice(0, totalQuestions).map((item, idx) => {
            const answer = localAnswers[idx + 1];
            return (
              <Group key={idx} gap={10} wrap="nowrap" align="flex-start" justify="space-between">
                <Stack gap={0} miw={0}>
                  <Text size="xs" c="dimmed">
                    {idx + 1}. {item.title}
                  </Text>
                  <Text size="sm">
                    {answer ? formatQuestionAnswer(answer, item.options ?? []) : labels.pending}
                  </Text>
                </Stack>
                {!isControlled && (
                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="gray"
                    onClick={() => goTo(idx + 1)}
                  >
                    {part.input?.reviewEditLabel ?? labels.reviewEdit}
                  </Button>
                )}
              </Group>
            );
          })}
          <Group justify="flex-end">
            <Button
              size="compact-sm"
              disabled={!allAnswered}
              onClick={() => {
                setReviewConfirmed(true);
                setReviewing(false);
                part.input?.onSubmitAnswers?.(localAnswers);
              }}
            >
              {part.input?.reviewSubmitLabel ?? labels.reviewSubmit}
            </Button>
          </Group>
        </Stack>
      ) : (
        <QuestionPrompt
          key={`${clampedIndex}-${question.title}`}
          questions={questions}
          questionIndex={clampedIndex}
          totalQuestions={totalQuestions}
          initialAnswer={localAnswers[clampedIndex]}
          nextLabel={part.input?.nextLabel}
          skipLabel={part.input?.skipLabel}
          allowSkip={part.input?.allowSkip}
          labels={labels.prompt}
          submitLabel={
            withReview
              ? (part.input?.nextLabel ?? labels.prompt.next ?? DEFAULT_QUESTION_PROMPT_LABELS.next)
              : part.input?.submitLabel
          }
          onSubmit={(nextAnswer) => {
            const nextAnswers = { ...localAnswers, [clampedIndex]: nextAnswer };
            setLocalAnswers(nextAnswers);
            part.input?.onSubmitAnswer?.(nextAnswer);
            const firstUnanswered = Array.from(
              { length: totalQuestions },
              (_, idx) => idx + 1
            ).find((index) => !nextAnswers[index]);
            if (withReview && firstUnanswered === undefined) {
              setReviewing(true);
            } else if (clampedIndex < totalQuestions) {
              goNext();
            } else if (withReview && firstUnanswered !== undefined) {
              goTo(firstUnanswered);
            }
          }}
        />
      )}
    </Box>
  );
}

QuestionTool.displayName = 'QuestionTool';
