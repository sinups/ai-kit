import React, { useEffect, useId, useRef, useState } from 'react';
import { ActionIcon, Text, Tooltip, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { IconFileText, IconPlus, IconX } from '@tabler/icons-react';
import { fillTemplate } from '../utils/fill-template';
import type { InputBarLabels } from './InputBar';
import classes from './InputBar.module.css';

export interface InputContextItem {
  id: string;
  /** Name shown on the chip and in the restore line */
  label: string;
  /** Icon before the label, a document icon by default */
  icon?: React.ReactNode;
  /** Tooltip of the chip */
  description?: string;
  /** Removed by the user: shown as a restore line when `onRestoreContext` is set, hidden otherwise */
  removed?: boolean;
}

interface InputContextProps {
  items: InputContextItem[];
  onRemove?: (id: string) => void;
  onRestore?: (id: string) => void;
  field: React.RefObject<HTMLTextAreaElement | null>;
  labels: Pick<InputBarLabels, 'removeContext' | 'restoreContext'>;
}

export function InputContext({ items, onRemove, onRestore, field, labels }: InputContextProps) {
  const pendingFocus = useRef('');
  const [, commitFocus] = useState(0);
  const descriptionId = useId();
  useEffect(() => {
    if (pendingFocus.current) {
      pendingFocus.current = '';
      field.current?.focus();
    }
  });
  const requestFocus = (key: string) => {
    pendingFocus.current = key;
    commitFocus((count) => count + 1);
  };
  const focusWhenPending = (key: string) => (element: HTMLElement | null) => {
    if (element && pendingFocus.current === key) {
      pendingFocus.current = '';
      element.focus();
    }
  };

  return (
    <div className={classes.contextList}>
      {items.map((item) => {
        if (item.removed) {
          return onRestore ? (
            <UnstyledButton
              key={item.id}
              ref={focusWhenPending(`restore:${item.id}`)}
              className={classes.contextRestore}
              onClick={() => {
                requestFocus(`remove:${item.id}`);
                onRestore(item.id);
              }}
            >
              <IconPlus size={14} />
              <Text span size="sm" truncate="end">
                {fillTemplate(labels.restoreContext, { label: item.label })}
              </Text>
            </UnstyledButton>
          ) : null;
        }
        return (
          <Tooltip
            key={item.id}
            label={item.description}
            disabled={!item.description}
            events={{ hover: true, focus: true, touch: false }}
          >
            <div className={classes.contextChip}>
              <span className={classes.contextIcon}>{item.icon ?? <IconFileText size={16} />}</span>
              <Text span size="sm" fw={500} truncate="end">
                {item.label}
              </Text>
              {item.description && (
                <VisuallyHidden id={`${descriptionId}${item.id}`}>
                  {item.description}
                </VisuallyHidden>
              )}
              {onRemove && (
                <ActionIcon
                  ref={focusWhenPending(`remove:${item.id}`)}
                  variant="subtle"
                  color="gray"
                  size="xs"
                  aria-label={fillTemplate(labels.removeContext, { label: item.label })}
                  aria-describedby={item.description ? `${descriptionId}${item.id}` : undefined}
                  onClick={() => {
                    requestFocus(`restore:${item.id}`);
                    onRemove(item.id);
                  }}
                >
                  <IconX size={12} stroke={2} />
                </ActionIcon>
              )}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
