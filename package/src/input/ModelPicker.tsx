import React, { memo, useCallback, useState } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import type { ModelOption } from '../types';
import { cx } from '../utils/cx';
import { InputPopover } from './InputPopover';
import classes from './ModelPicker.module.css';

export interface ModelPickerProps {
  models: ModelOption[];
  /** Controlled selected model id */
  value?: string;
  /** Initial selected model id in uncontrolled mode */
  defaultValue?: string;
  onChange?: (modelId: string) => void;
  /** Label shown when no model matches, `'Auto'` by default */
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Toolbar dropdown for choosing the active model */
export const ModelPicker = memo(function ModelPicker({
  models,
  value,
  defaultValue,
  onChange,
  placeholder = 'Auto',
  className,
  style,
}: ModelPickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeId = isControlled ? value : internalValue;
  const activeModel = models.find((m) => m.id === activeId) ?? models[0];
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

  return (
    <InputPopover
      open={open}
      onOpenChange={setOpen}
      side="top"
      align="start"
      trigger={
        <UnstyledButton
          className={cx(classes.trigger, className)}
          style={style}
          aria-label="Select model"
        >
          <span className={classes.triggerName}>{activeModel?.name ?? placeholder}</span>
          {activeModel?.version && (
            <span className={classes.triggerVersion}>{activeModel.version}</span>
          )}
          <IconChevronDown size={12} className={classes.chevron} />
        </UnstyledButton>
      }
    >
      {models.map((model) => {
        const isActive = model.id === activeModel?.id;
        return (
          <UnstyledButton
            key={model.id}
            onClick={() => handleSelect(model.id)}
            className={classes.option}
            data-active={isActive || undefined}
          >
            <span className={classes.optionLabel}>
              {model.name}
              {model.version && <span className={classes.optionVersion}>{model.version}</span>}
            </span>
            {isActive && <IconCheck size={14} className={classes.check} />}
          </UnstyledButton>
        );
      })}
    </InputPopover>
  );
});

ModelPicker.displayName = 'ModelPicker';

export interface ModelBadgeProps {
  models: ModelOption[];
  value?: string;
  /** Label shown when no model matches, `'Auto'` by default */
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Read-only label of the active model, for toolbars without model switching */
export const ModelBadge = memo(function ModelBadge({
  models,
  value,
  placeholder = 'Auto',
  className,
  style,
}: ModelBadgeProps) {
  const activeModel = models.find((m) => m.id === value) ?? models[0];
  return (
    <Box className={cx(classes.badge, className)} style={style}>
      <span className={classes.triggerName}>{activeModel?.name ?? placeholder}</span>
      {activeModel?.version && <span className={classes.badgeVersion}>{activeModel.version}</span>}
    </Box>
  );
});

ModelBadge.displayName = 'ModelBadge';
