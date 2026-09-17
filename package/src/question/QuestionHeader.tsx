import React from 'react';
import { UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconMessageCircleQuestion } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import classes from './QuestionHeader.module.css';

export interface QuestionHeaderLabels {
  /** Caption before the navigation, `Question` by default */
  caption: string;
  /** Accessible label of the previous button, `Previous question` by default */
  previous: string;
  /** Accessible label of the next button, `Next question` by default */
  next: string;
  /** Position of the active question, `2 of 5` by default */
  position: (index: number, total: number) => string;
}

export const DEFAULT_QUESTION_HEADER_LABELS: QuestionHeaderLabels = {
  caption: 'Question',
  previous: 'Previous question',
  next: 'Next question',
  position: (index, total) => `${index} of ${total}`,
};

export interface QuestionHeaderProps {
  /** 1-based index of the active question */
  index: number;
  total: number;
  /** Whether the "N of M" navigation is rendered */
  showNavigation: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<QuestionHeaderLabels>;
  className?: string;
}

/** 28px "Question" caption with optional up/down navigation, shared by QuestionTool and the composer question bar */
export function QuestionHeader({
  index,
  total,
  showNavigation,
  onPrevious,
  onNext,
  labels: labelsProp,
  className,
}: QuestionHeaderProps) {
  const labels = { ...DEFAULT_QUESTION_HEADER_LABELS, ...labelsProp };
  const canGoPrev = index > 1;
  const canGoNext = index < total;

  return (
    <div className={cx(classes.root, className)}>
      <div className={classes.caption}>
        <IconMessageCircleQuestion size={14} />
        {labels.caption}
      </div>
      {showNavigation && (
        <div className={classes.nav}>
          <UnstyledButton
            onClick={onPrevious}
            disabled={!canGoPrev}
            className={classes.navButton}
            aria-label={labels.previous}
          >
            <IconChevronUp size={14} />
          </UnstyledButton>
          <span>{labels.position(index, total)}</span>
          <UnstyledButton
            onClick={onNext}
            disabled={!canGoNext}
            className={classes.navButton}
            aria-label={labels.next}
          >
            <IconChevronDown size={14} />
          </UnstyledButton>
        </div>
      )}
    </div>
  );
}

QuestionHeader.displayName = 'QuestionHeader';
