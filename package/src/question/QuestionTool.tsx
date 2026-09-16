import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mantine/core';
import { cx } from '../utils/cx';
import { QuestionHeader } from './QuestionHeader';
import { QuestionAnswer, QuestionConfig, QuestionPrompt } from './QuestionPrompt';
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
  };
  output?: {
    answer?: QuestionAnswer;
  };
};

export interface QuestionToolProps {
  part: QuestionToolPart;
  chatStatus?: string;
  className?: string;
  style?: React.CSSProperties;
}

function formatAnswer(answer: QuestionAnswer) {
  if (answer.kind === 'skip') {
    return 'Skipped';
  }
  if (answer.kind === 'text') {
    return answer.text || 'Answered';
  }
  const ids = answer.selectedIds?.length ? answer.selectedIds.join(', ') : '';
  if (answer.text) {
    return ids ? `${ids} (${answer.text})` : answer.text;
  }
  return ids || 'Answered';
}

/** Tool card for the "ask user" tool: a header with question navigation and the active QuestionPrompt, collapsing into a summary once answered */
export function QuestionTool({ part, className, style }: QuestionToolProps) {
  const [localIndex, setLocalIndex] = useState(part.input?.questionIndex ?? 1);
  const questions: QuestionConfig[] = part.input?.questions ?? [];
  const totalQuestions = part.input?.totalQuestions ?? questions.length;
  const isControlled = typeof part.input?.questionIndex === 'number';
  let questionIndex: number;
  if (isControlled) {
    questionIndex = part.input?.questionIndex ?? 1;
  } else if (questions.length > 0) {
    questionIndex = localIndex;
  } else {
    questionIndex = part.input?.questionIndex ?? 1;
  }
  const clampedIndex = Math.max(1, Math.min(questionIndex, totalQuestions));
  const question = questions[clampedIndex - 1];
  const [localAnswers, setLocalAnswers] = useState<Record<number, QuestionAnswer>>({});

  useEffect(() => {
    if (typeof part.input?.questionIndex === 'number') {
      setLocalIndex(part.input.questionIndex);
    }
  }, [part.input?.questionIndex]);

  useEffect(() => {
    setLocalAnswers({});
    setLocalIndex(part.input?.questionIndex ?? 1);
  }, [part.toolCallId]);

  const outputAnswer = part.output?.answer;
  const answeredCount = Object.keys(localAnswers).length;
  const isComplete =
    totalQuestions === 1
      ? !!outputAnswer || answeredCount >= 1
      : totalQuestions > 0 && answeredCount >= totalQuestions;
  const showNavigation = totalQuestions > 1 && !isComplete;
  const canGoPrev = clampedIndex > 1;
  const canGoNext = clampedIndex < totalQuestions;

  const summaryAnswers = useMemo(() => {
    if (!isComplete || totalQuestions <= 1) {
      return [];
    }
    return Array.from({ length: totalQuestions }, (_, idx) => ({
      index: idx + 1,
      answer: localAnswers[idx + 1],
    }));
  }, [isComplete, localAnswers, totalQuestions]);

  const summaryText = useMemo(() => {
    if (!isComplete) {
      return '';
    }
    if (summaryAnswers.length > 0) {
      return summaryAnswers
        .map((item) => `${item.index}: ${item.answer ? formatAnswer(item.answer) : 'Pending'}`)
        .join(' • ');
    }
    if (outputAnswer) {
      return formatAnswer(outputAnswer);
    }
    if (localAnswers[clampedIndex]) {
      return formatAnswer(localAnswers[clampedIndex]);
    }
    return 'Pending';
  }, [isComplete, summaryAnswers, outputAnswer, localAnswers, clampedIndex]);

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
      />

      {isComplete ? (
        <div className={classes.summary}>{summaryText}</div>
      ) : (
        <QuestionPrompt
          key={`${clampedIndex}-${question.title}`}
          questions={questions}
          questionIndex={clampedIndex}
          totalQuestions={totalQuestions}
          initialAnswer={localAnswers[clampedIndex]}
          submitLabel={part.input?.submitLabel}
          nextLabel={part.input?.nextLabel}
          skipLabel={part.input?.skipLabel}
          allowSkip={part.input?.allowSkip}
          onSubmit={(nextAnswer) => {
            setLocalAnswers((prev) => ({ ...prev, [clampedIndex]: nextAnswer }));
            part.input?.onSubmitAnswer?.(nextAnswer);
            if (clampedIndex < totalQuestions) {
              goNext();
            }
          }}
        />
      )}
    </Box>
  );
}

QuestionTool.displayName = 'QuestionTool';
