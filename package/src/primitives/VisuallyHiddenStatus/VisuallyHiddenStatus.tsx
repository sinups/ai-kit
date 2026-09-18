import React from 'react';
import { VisuallyHidden } from '@mantine/core';

export interface VisuallyHiddenStatusProps {
  /** Text to announce; a change announces it once, an empty value stays silent */
  children: React.ReactNode;
}

/** A polite status region only screen readers hear */
export function VisuallyHiddenStatus({ children }: VisuallyHiddenStatusProps) {
  return (
    <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
      {children}
    </VisuallyHidden>
  );
}

VisuallyHiddenStatus.displayName = 'VisuallyHiddenStatus';
