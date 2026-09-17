import type React from 'react';
import { rem } from '@mantine/core';

export type ContentWidth = number | string;

export function getContentWidthStyle(
  contentWidth: ContentWidth | undefined,
  style?: React.CSSProperties
): React.CSSProperties | undefined {
  if (contentWidth === undefined) {
    return style;
  }
  const value = typeof contentWidth === 'number' ? rem(contentWidth) : contentWidth;
  return { '--ae-max-width': value, ...style } as React.CSSProperties;
}
