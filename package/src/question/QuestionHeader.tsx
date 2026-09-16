import React from 'react';
import { UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconMessageCircleQuestion } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import classes from './QuestionHeader.module.css';

export interface QuestionHeaderProps {
  /** 1-based index of the active question */
  index: number;
  total: number;
  /** Whether the "N of M" navigation is rendered */
  showNavigation: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

/** 28px "Question" caption with optional up/down navigation, shared by QuestionTool and the composer question bar */
export function QuestionHeader({
  index,
  total,
  showNavigation,
  onPrevious,
  onNext,
  className,
}: QuestionHeaderProps) {
  const canGoPrev = index > 1;
  const canGoNext = index < total;

  return (
    <div className={cx(classes.root, className)}>
      <div className={classes.caption}>
        <IconMessageCircleQuestion size={14} />
        Question
      </div>
      {showNavigation && (
        <div className={classes.nav}>
          <UnstyledButton
            onClick={onPrevious}
            disabled={!canGoPrev}
            className={classes.navButton}
            aria-label="Previous question"
          >
            <IconChevronUp size={14} />
          </UnstyledButton>
          <span>
            {index} of {total}
          </span>
          <UnstyledButton
            onClick={onNext}
            disabled={!canGoNext}
            className={classes.navButton}
            aria-label="Next question"
          >
            <IconChevronDown size={14} />
          </UnstyledButton>
        </div>
      )}
    </div>
  );
}

QuestionHeader.displayName = 'QuestionHeader';
