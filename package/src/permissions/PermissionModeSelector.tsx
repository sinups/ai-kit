import React, { memo, useId } from 'react';
import { Alert, Box, Input, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconAlertTriangle } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import {
  PERMISSION_MODES,
  PERMISSION_MODE_ORDER,
  type PermissionMode,
  type PermissionModeMeta,
} from './types';
import classes from './PermissionModeSelector.module.css';

export interface PermissionModeSelectorLabels {
  /** Label, description and warning flag of each mode */
  modes: Partial<Record<PermissionMode, Partial<PermissionModeMeta>>>;
  /** Warning shown when a dangerous mode is selected */
  dangerWarning: string;
}

export const DEFAULT_PERMISSION_MODE_SELECTOR_LABELS: PermissionModeSelectorLabels = {
  modes: {},
  dangerWarning:
    'Tool calls run without approval, including commands that change files or reach the network. Use only in an isolated environment.',
};

export interface PermissionModeSelectorProps {
  /** Selected mode */
  value: PermissionMode;
  /** Called with the mode the user picked */
  onChange: (mode: PermissionMode) => void;
  /** Modes offered, all modes by default */
  modes?: PermissionMode[];
  /** Field label, `Permission mode` by default */
  label?: React.ReactNode;
  /** `segmented` shows all modes at once, `select` a dropdown, `auto` picks by component width, `auto` by default */
  variant?: 'auto' | 'segmented' | 'select';
  /** Disables the control */
  disabled?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<PermissionModeSelectorLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const SEGMENTED_MIN_WIDTH = 440;

/** Permission mode picker with a description of the selected mode and a warning for modes that skip approvals */
export const PermissionModeSelector = memo(function PermissionModeSelector({
  value,
  onChange,
  modes = PERMISSION_MODE_ORDER,
  label = 'Permission mode',
  variant = 'auto',
  disabled = false,
  labels: labelsProp,
  className,
  style,
}: PermissionModeSelectorProps) {
  const labels = { ...DEFAULT_PERMISSION_MODE_SELECTOR_LABELS, ...labelsProp };
  const { ref, width } = useElementSize();
  const labelId = useId();
  const metaOf = (mode: PermissionMode): PermissionModeMeta => ({
    ...PERMISSION_MODES[mode],
    ...labels.modes[mode],
  });
  const selected = metaOf(value);
  const data = modes.map((mode) => ({ value: mode, label: metaOf(mode).label }));
  const segmented = variant === 'segmented' || (variant === 'auto' && width >= SEGMENTED_MIN_WIDTH);
  const handleChange = (next: string | null) => {
    if (next) {
      onChange(next as PermissionMode);
    }
  };

  return (
    <Stack
      ref={ref}
      gap="xs"
      className={cx(classes.root, className)}
      style={style}
      data-measuring={(variant === 'auto' && width === 0) || undefined}
    >
      {segmented ? (
        <Input.Wrapper label={label} labelProps={{ id: labelId }}>
          <Box mt={4}>
            <SegmentedControl
              fullWidth
              aria-labelledby={labelId}
              data={data}
              value={value}
              onChange={handleChange}
              disabled={disabled}
              color={selected.dangerous ? 'red' : undefined}
            />
          </Box>
        </Input.Wrapper>
      ) : (
        <Select
          label={label}
          data={data}
          value={value}
          onChange={handleChange}
          allowDeselect={false}
          disabled={disabled}
        />
      )}
      <Text size="xs" c="dimmed" aria-live="polite">
        {selected.description}
      </Text>
      {selected.dangerous && (
        <Alert color="red" variant="light" icon={<IconAlertTriangle size={16} />} p="xs">
          <Text size="xs">{labels.dangerWarning}</Text>
        </Alert>
      )}
    </Stack>
  );
});

PermissionModeSelector.displayName = 'PermissionModeSelector';
