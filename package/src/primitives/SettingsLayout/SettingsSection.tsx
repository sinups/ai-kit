import React, { Children, Fragment, memo } from 'react';
import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import { cx } from '../../utils/cx';
import classes from './SettingsLayout.module.css';

export interface SettingsSectionProps {
  /** Section heading */
  title: React.ReactNode;
  /** Secondary text under the heading */
  description?: React.ReactNode;
  /** Content on the right side of the heading, for example a reset button */
  actions?: React.ReactNode;
  /** Rows of the section, usually `SettingRow`; a divider is placed between them */
  children?: React.ReactNode;
  /** Marks destructive settings with an error-colored heading */
  danger?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Titled group of settings rows separated by dividers */
export const SettingsSection = memo(function SettingsSection({
  title,
  description,
  actions,
  children,
  danger = false,
  className,
  style,
}: SettingsSectionProps) {
  const rows = Children.toArray(children);

  return (
    <Stack
      component="section"
      gap="md"
      className={cx(classes.section, className)}
      style={style}
      data-danger={danger || undefined}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Stack gap={2} miw={0}>
          <Title order={3} size="h5" c={danger ? 'var(--ae-danger)' : undefined}>
            {title}
          </Title>
          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}
        </Stack>
        {actions && (
          <Group gap="xs" wrap="nowrap" className={classes.actions}>
            {actions}
          </Group>
        )}
      </Group>
      {rows.length > 0 && (
        <Stack gap="sm">
          {rows.map((row, index) => (
            <Fragment key={React.isValidElement(row) && row.key !== null ? row.key : index}>
              {index > 0 && <Divider />}
              {row}
            </Fragment>
          ))}
        </Stack>
      )}
    </Stack>
  );
});

SettingsSection.displayName = 'SettingsSection';
