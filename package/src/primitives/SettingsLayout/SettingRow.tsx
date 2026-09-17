import React, { memo } from 'react';
import { Box, Input, Stack } from '@mantine/core';
import { cx } from '../../utils/cx';
import classes from './SettingsLayout.module.css';

export type SettingRowLayout = 'auto' | 'inline' | 'stacked';

export interface SettingRowProps {
  /** Setting name */
  label: React.ReactNode;
  /** Explanation under the label */
  description?: React.ReactNode;
  /** Input that edits the setting, for example `Switch`, `Select` or `Button` */
  control: React.ReactNode;
  /** Validation message under the description */
  error?: React.ReactNode;
  /** Id of the control element; when set the label becomes a `<label>` pointing at it */
  htmlFor?: string;
  /** `inline` puts the control to the right of the text, `stacked` under it, `auto` switches to inline from a row width of 480px, `auto` by default */
  layout?: SettingRowLayout;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Settings row: label and description with the control beside them when there is room, under them otherwise */
export const SettingRow = memo(function SettingRow({
  label,
  description,
  control,
  error,
  htmlFor,
  layout = 'auto',
  className,
  style,
}: SettingRowProps) {
  return (
    <Box className={cx(classes.rowContainer, className)} style={style}>
      <Box className={classes.row} data-layout={layout}>
        <Stack gap={2} className={classes.rowText}>
          <Input.Label htmlFor={htmlFor} labelElement={htmlFor ? 'label' : 'div'}>
            {label}
          </Input.Label>
          {description && <Input.Description>{description}</Input.Description>}
          {error && <Input.Error role="alert">{error}</Input.Error>}
        </Stack>
        <Box className={classes.rowControl}>{control}</Box>
      </Box>
    </Box>
  );
});
