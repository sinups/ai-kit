import React, { memo, useId } from 'react';
import {
  Box,
  Button,
  Input,
  Menu,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconBrain, IconCheck, IconChevronDown } from '@tabler/icons-react';
import { DEFAULT_EFFORT_LEVELS, findEffortLevel } from '../effort';
import type { EffortLevel, EffortLevelValue } from '../types';
import classes from './EffortSelector.module.css';

export interface EffortSelectorLabels {
  label: string;
  thinking: string;
  thinkingDescription: string;
}

export const DEFAULT_EFFORT_SELECTOR_LABELS: EffortSelectorLabels = {
  label: 'Reasoning effort',
  thinking: 'Extended thinking',
  thinkingDescription: 'Show the reasoning before the answer',
};

export interface EffortSelectorProps {
  /** Selected level value */
  value: EffortLevelValue;
  /** Called with the picked level value */
  onChange: (value: EffortLevelValue) => void;
  /** Levels in order from the least to the most effort, `low`, `medium`, `high`, `max` by default */
  levels?: EffortLevel[];
  /** State of the extended thinking switch; the switch is rendered only together with `onThinkingChange` */
  thinking?: boolean;
  /** Called when extended thinking is toggled */
  onThinkingChange?: (thinking: boolean) => void;
  /** `default` renders a labeled control, `inline` renders a compact menu button for a composer toolbar, `default` by default */
  variant?: 'default' | 'inline';
  /** Component width in px from which the levels are a segmented control instead of a select, `380` by default */
  breakpoint?: number;
  /** Disables the control */
  disabled?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<EffortSelectorLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Reasoning effort picker: segmented control when wide, select when narrow, or a menu button in a toolbar */
export const EffortSelector = memo(function EffortSelector({
  value,
  onChange,
  levels = DEFAULT_EFFORT_LEVELS,
  thinking = false,
  onThinkingChange,
  variant = 'default',
  breakpoint = 380,
  disabled = false,
  labels: labelsProp,
  className,
  style,
}: EffortSelectorProps) {
  const labels = { ...DEFAULT_EFFORT_SELECTOR_LABELS, ...labelsProp };
  const { ref, width } = useElementSize();
  const labelId = useId();
  const active = findEffortLevel(levels, value);

  if (variant === 'inline') {
    return (
      <Menu position="top-start" width={260} shadow="md" disabled={disabled}>
        <Menu.Target>
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            fw={500}
            leftSection={<IconBrain size={14} />}
            rightSection={<IconChevronDown size={12} />}
            aria-label={`${labels.label}: ${active?.label ?? value}`}
            disabled={disabled}
            className={className}
            style={style}
          >
            {active?.label ?? value}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{labels.label}</Menu.Label>
          {levels.map((level) => (
            <Menu.Item
              key={level.value}
              onClick={() => onChange(level.value)}
              rightSection={level.value === value ? <IconCheck size={14} /> : undefined}
              aria-current={level.value === value || undefined}
            >
              <Text size="sm">{level.label}</Text>
              {level.description && (
                <Text size="xs" c="dimmed">
                  {level.description}
                </Text>
              )}
            </Menu.Item>
          ))}
          {onThinkingChange && (
            <>
              <Menu.Divider />
              <Menu.Item
                closeMenuOnClick={false}
                onClick={() => onThinkingChange(!thinking)}
                rightSection={
                  <Switch
                    size="xs"
                    checked={thinking}
                    readOnly
                    tabIndex={-1}
                    aria-label={labels.thinking}
                  />
                }
              >
                <Text size="sm">{labels.thinking}</Text>
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>
    );
  }

  const measuring = width === 0;
  const isWide = width >= breakpoint;

  return (
    <Stack ref={ref} gap="xs" className={className} style={style}>
      <Box>
        <Input.Label id={labelId}>{labels.label}</Input.Label>
        <Box className={classes.measured} data-measuring={measuring || undefined}>
          {isWide ? (
            <SegmentedControl
              fullWidth
              aria-labelledby={labelId}
              value={value}
              onChange={onChange}
              disabled={disabled}
              data={levels.map((level) => ({ value: level.value, label: level.label }))}
            />
          ) : (
            <Select
              aria-labelledby={labelId}
              value={value}
              allowDeselect={false}
              disabled={disabled}
              onChange={(next) => next !== null && onChange(next)}
              data={levels.map((level) => ({ value: level.value, label: level.label }))}
            />
          )}
        </Box>
        {active?.description && (
          <Text size="xs" c="dimmed" mt={6} aria-live="polite">
            {active.description}
          </Text>
        )}
      </Box>
      {onThinkingChange && (
        <Switch
          label={labels.thinking}
          description={labels.thinkingDescription}
          checked={thinking}
          disabled={disabled}
          onChange={(event) => onThinkingChange(event.currentTarget.checked)}
        />
      )}
    </Stack>
  );
});

EffortSelector.displayName = 'EffortSelector';
