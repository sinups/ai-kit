import React from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import classes from './NoticeBar.module.css';

export interface NoticeBarAction {
  label: string;
  onClick: () => void;
  kind?: 'primary' | 'secondary' | 'muted';
}

export interface NoticeBarProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: NoticeBarAction[];
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function NoticeBar({
  title,
  description,
  actions = [],
  onClose,
  closeLabel = 'Close',
  className,
  style,
}: NoticeBarProps) {
  return (
    <Box role="status" className={cx(classes.root, className)} style={style}>
      <div className={classes.text}>
        <span className={classes.title}>{title}</span>
        {description && <span className={classes.description}> {description}</span>}
      </div>
      {(actions.length > 0 || onClose) && (
        <div className={classes.actions}>
          {actions.map((action) => (
            <UnstyledButton
              key={action.label}
              className={classes.action}
              data-primary={action.kind === 'primary' || undefined}
              data-muted={action.kind === 'muted' || undefined}
              onClick={action.onClick}
            >
              {action.label}
            </UnstyledButton>
          ))}
          {onClose && (
            <UnstyledButton className={classes.close} aria-label={closeLabel} onClick={onClose}>
              <IconX size={14} stroke={2} />
            </UnstyledButton>
          )}
        </div>
      )}
    </Box>
  );
}
