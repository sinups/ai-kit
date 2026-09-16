import React, { memo } from 'react';
import { Box } from '@mantine/core';
import { cx } from '../utils/cx';
import classes from './ErrorMessage.module.css';

export type ErrorMessageProps = {
  title?: string;
  message: string;
  className?: string;
};

/** Inline error card rendered in place of an assistant reply */
export const ErrorMessage = memo(function ErrorMessage({
  title = 'Something went wrong',
  message,
  className,
}: ErrorMessageProps) {
  return (
    <Box className={cx(classes.root, className)}>
      <div className={classes.card}>
        <div className={classes.title}>{title}</div>
        <div className={classes.message}>{message}</div>
      </div>
    </Box>
  );
});

ErrorMessage.displayName = 'ErrorMessage';
