import React, { memo, useCallback, useState } from 'react';
import { UnstyledButton } from '@mantine/core';
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
};

export interface ModeSelectorProps {
  modes: ModeOption[];
  /** Controlled selected mode id */
  value?: string;
  /** Initial selected mode id in uncontrolled mode */
  defaultValue?: string;
  onChange?: (modeId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Toolbar dropdown for switching agent modes (for example Agent / Plan). Renders a static label when only one mode is given. */
export const ModeSelector = memo(function ModeSelector({
  modes,
  value,
  defaultValue,
  onChange,
  className,
  style,
}: ModeSelectorProps) {
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
      aria-label={hasMultiple ? 'Select mode' : undefined}
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
      {modes.map((mode) => {
        const isActive = mode.id === activeMode?.id;
        const Icon = mode.icon;
        return (
          <UnstyledButton
            key={mode.id}
            onClick={() => handleSelect(mode.id)}
            className={classes.option}
            data-active={isActive || undefined}
          >
            {Icon && <Icon className={classes.optionIcon} />}
            <span className={classes.optionText}>
              <span className={classes.optionLabel}>{mode.label}</span>
              {mode.description && (
                <span className={classes.optionDescription}>{mode.description}</span>
              )}
            </span>
            {isActive && <IconCheck size={14} className={classes.check} />}
          </UnstyledButton>
        );
      })}
    </InputPopover>
  );
});

ModeSelector.displayName = 'ModeSelector';
