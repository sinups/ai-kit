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

export interface PermissionModeSelectorProps {
  /** Selected mode */
  value: PermissionMode;
  /** Called with the mode the user picked */
  onChange: (mode: PermissionMode) => void;
  /** Modes offered, all modes by default */
  modes?: PermissionMode[];
  /** Overrides for the English label, description and warning flag of each mode */
  modeLabels?: Partial<Record<PermissionMode, Partial<PermissionModeMeta>>>;
  /** Field label, `Permission mode` by default */
  label?: React.ReactNode;
  /** Warning shown when a dangerous mode is selected */
  dangerWarning?: React.ReactNode;
  /** `segmented` shows all modes at once, `select` a dropdown, `auto` picks by component width, `auto` by default */
  variant?: 'auto' | 'segmented' | 'select';
  /** Disables the control */
  disabled?: boolean;
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
  modeLabels,
  label = 'Permission mode',
  dangerWarning = 'Tool calls run without approval, including commands that change files or reach the network. Use only in an isolated environment.',
  variant = 'auto',
  disabled = false,
  className,
  style,
}: PermissionModeSelectorProps) {
  const { ref, width } = useElementSize();
  const labelId = useId();
  const metaOf = (mode: PermissionMode): PermissionModeMeta => ({
    ...PERMISSION_MODES[mode],
    ...modeLabels?.[mode],
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
          <Text size="xs">{dangerWarning}</Text>
        </Alert>
      )}
    </Stack>
  );
});

PermissionModeSelector.displayName = 'PermissionModeSelector';
