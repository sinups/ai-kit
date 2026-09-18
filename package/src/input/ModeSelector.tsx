import React, { memo, useCallback, useState } from 'react';
import { Badge, UnstyledButton } from '@mantine/core';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import { InputPopover } from './InputPopover';
import classes from './ModeSelector.module.css';

export type ModeOption = {
  id: string;
  label: string;
  /** Icon component, receives `className` for sizing */
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  /** Short mark after the label, for example `Default` */
  badge?: string;
};

export interface ModeSelectorLabels {
  /** Accessible label of the trigger, `Select mode` by default */
  trigger: string;
  /** Heading of the open menu, empty by default and then not shown */
  title: string;
}

export const DEFAULT_MODE_SELECTOR_LABELS: ModeSelectorLabels = {
  trigger: 'Select mode',
  title: '',
};

export interface ModeSelectorProps {
  modes: ModeOption[];
  /** Controlled selected mode id */
  value?: string;
  /** Initial selected mode id in uncontrolled mode */
  defaultValue?: string;
  onChange?: (modeId: string) => void;
  /** Shows the digits `1`…`N` next to the modes and picks a mode by its digit while the menu is open, `false` by default */
  shortcuts?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<ModeSelectorLabels>;
  className?: string;
  style?: React.CSSProperties;
}

/** Toolbar dropdown for switching agent modes (for example Agent / Plan). Renders a static label when only one mode is given. */
export const ModeSelector = memo(function ModeSelector({
  modes,
  value,
  defaultValue,
  onChange,
  shortcuts = false,
  labels: labelsProp,
  className,
  style,
}: ModeSelectorProps) {
  const labels = { ...DEFAULT_MODE_SELECTOR_LABELS, ...labelsProp };
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeId = isControlled ? value : internalValue;
  const activeMode = modes.find((m) => m.id === activeId) ?? modes[0];
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (id: string) => {
      if (!isControlled) {
        setInternalValue(id);
      }
      onChange?.(id);
      setOpen(false);
    },
    [isControlled, onChange]
  );

  const pickByDigit = (event: React.KeyboardEvent<HTMLElement>) => {
    const { key, metaKey, ctrlKey, altKey, repeat, isComposing } = event.nativeEvent;
    if (!open || !shortcuts || metaKey || ctrlKey || altKey || repeat || isComposing) {
      return;
    }
    const mode = /^[1-9]$/.test(key) ? modes[Number(key) - 1] : undefined;
    if (mode) {
      event.preventDefault();
      handleSelect(mode.id);
    }
  };

  if (modes.length === 0) {
    return null;
  }
  const ActiveIcon = activeMode?.icon;
  const hasMultiple = modes.length > 1;

  const trigger = (
    <UnstyledButton
      component={hasMultiple ? 'button' : 'span'}
      className={cx(classes.trigger, className)}
      style={style}
      data-static={!hasMultiple || undefined}
      aria-label={hasMultiple ? labels.trigger : undefined}
      onKeyDown={hasMultiple ? pickByDigit : undefined}
    >
      {ActiveIcon && <ActiveIcon className={classes.triggerIcon} />}
      <span className={classes.label}>{activeMode?.label}</span>
      {hasMultiple && <IconChevronDown size={12} className={classes.chevron} />}
    </UnstyledButton>
  );

  if (!hasMultiple) {
    return trigger;
  }

  return (
    <InputPopover open={open} onOpenChange={setOpen} side="top" align="start" trigger={trigger}>
      {labels.title && <div className={classes.title}>{labels.title}</div>}
      <div onKeyDown={pickByDigit} role="presentation">
        {modes.map((mode, index) => {
          const isActive = mode.id === activeMode?.id;
          const Icon = mode.icon;
          return (
            <UnstyledButton
              key={mode.id}
              onClick={() => handleSelect(mode.id)}
              className={classes.option}
              data-active={isActive || undefined}
              aria-keyshortcuts={shortcuts && index < 9 ? String(index + 1) : undefined}
            >
              {Icon && <Icon className={classes.optionIcon} />}
              <span className={classes.optionText}>
                <span className={classes.optionLabel}>
                  {mode.label}
                  {mode.badge && (
                    <Badge size="xs" variant="default" radius="sm" className={classes.badge}>
                      {mode.badge}
                    </Badge>
                  )}
                </span>
                {mode.description && (
                  <span className={classes.optionDescription}>{mode.description}</span>
                )}
              </span>
              {isActive && <IconCheck size={14} className={classes.check} />}
              {shortcuts && index < 9 && (
                <kbd className={classes.shortcut} aria-hidden="true">
                  {index + 1}
                </kbd>
              )}
            </UnstyledButton>
          );
        })}
      </div>
    </InputPopover>
  );
});

ModeSelector.displayName = 'ModeSelector';
