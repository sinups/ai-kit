import React from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import { cx } from '../utils/cx';
import classes from './Suggestions.module.css';

export type SuggestionItem = {
  id: string;
  label: string;
  /** Text inserted into the composer, `label` is used when omitted */
  value?: string;
  icon?: React.ReactNode;
  className?: string;
};

export interface SuggestionsProps {
  items: SuggestionItem[];
  onSelect: (item: SuggestionItem) => void;
  disabled?: boolean;
  className?: string;
  /** Class name applied to every suggestion chip */
  itemClassName?: string;
  style?: React.CSSProperties;
}

/** Row of clickable suggestion chips shown under the composer or in the empty state */
export function Suggestions({
  items,
  onSelect,
  disabled,
  className,
  itemClassName,
  style,
}: SuggestionsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Box className={cx(classes.root, className)} style={style}>
      {items.map((item) => (
        <UnstyledButton
          key={item.id}
          disabled={disabled}
          onClick={() => onSelect(item)}
          className={cx(classes.item, itemClassName, item.className)}
        >
          {item.icon && <span className={classes.icon}>{item.icon}</span>}
          {item.label}
        </UnstyledButton>
      ))}
    </Box>
  );
}

Suggestions.displayName = 'Suggestions';
