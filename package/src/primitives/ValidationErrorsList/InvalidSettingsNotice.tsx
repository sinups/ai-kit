import React, { memo, useState } from 'react';
import { Alert, Button, Collapse, Group, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconFileAlert } from '@tabler/icons-react';
import { usePendingActions } from '../../hooks/use-pending-actions';
import {
  fillValidationTemplate,
  getValidationSeverity,
  groupValidationErrors,
  type SettingsValidationError,
  type SettingsValidationSeverity,
} from './validation-errors';
import { ValidationErrorsList, type ValidationErrorsListLabels } from './ValidationErrorsList';

export interface InvalidSettingsNoticeLabels {
  /** `{file}` is replaced with the file name */
  title: string;
  /** Used when there is one problem, `{file}` is replaced */
  descriptionOne: string;
  /** Used for several problems, `{count}` and `{file}` are replaced */
  descriptionMany: string;
  /** Used when the number of problems is unknown, `{file}` is replaced */
  descriptionUnknown: string;
  continueWithout: string;
  openFile: string;
  showDetails: string;
  hideDetails: string;
  /** Shown when `onContinueWithout` rejects without a message */
  error: string;
  /** Accessible label of the close button */
  close: string;
  /** Labels of the embedded error list */
  list: Partial<ValidationErrorsListLabels>;
}

export interface InvalidSettingsNoticeProps {
  /** Settings file that failed validation */
  file: string;
  /** Problems found in the file; their count is shown and they can be expanded */
  errors?: SettingsValidationError[];
  /** Number of problems when `errors` is not passed */
  count?: number;
  /** `error` renders a red alert, `warning` a yellow one; derived from `errors` by default */
  severity?: SettingsValidationSeverity;
  /** Overrides the title */
  title?: React.ReactNode;
  /** Overrides the description */
  description?: React.ReactNode;
  /** Adds "Continue without this file"; the button shows a loader until the promise settles */
  onContinueWithout?: () => void | Promise<void>;
  /** Adds "Open file" */
  onOpenFile?: (file: string) => void;
  /** Renders a close button */
  onDismiss?: () => void;
  /** Shows the error list expanded initially */
  defaultExpanded?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<InvalidSettingsNoticeLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const DEFAULT_INVALID_SETTINGS_NOTICE_LABELS: InvalidSettingsNoticeLabels = {
  title: 'Settings file is invalid',
  descriptionOne: '{file} has a problem and is ignored until it is fixed.',
  descriptionMany: '{file} has {count} problems and is ignored until they are fixed.',
  descriptionUnknown: '{file} has problems and is ignored until they are fixed.',
  continueWithout: 'Continue without this file',
  openFile: 'Open file',
  showDetails: 'Show details',
  hideDetails: 'Hide details',
  error: 'Something went wrong',
  close: 'Dismiss',
  list: {},
};

/** Alert telling that a settings file failed validation, with the problems and recovery actions */
export const InvalidSettingsNotice = memo(function InvalidSettingsNotice({
  file,
  errors,
  count,
  severity,
  title,
  description,
  onContinueWithout,
  onOpenFile,
  onDismiss,
  defaultExpanded = false,
  labels: labelsProp,
  className,
  style,
}: InvalidSettingsNoticeProps) {
  const labels = { ...DEFAULT_INVALID_SETTINGS_NOTICE_LABELS, ...labelsProp };
  const [expanded, setExpanded] = useState(defaultExpanded);
  const actions = usePendingActions(labels.error);
  const problems = errors
    ? groupValidationErrors(errors).reduce((sum, group) => sum + group.errors.length, 0)
    : count;
  const tone = severity ?? (errors ? getValidationSeverity(errors) : 'error');
  const color = tone === 'warning' ? 'yellow' : 'red';
  const hasDetails = !!errors && errors.length > 0;
  const pending = actions.isPending('continue');

  const defaultDescription =
    problems === undefined
      ? fillValidationTemplate(labels.descriptionUnknown, { file })
      : problems === 1
        ? fillValidationTemplate(labels.descriptionOne, { file })
        : fillValidationTemplate(labels.descriptionMany, {
            file,
            count: String(problems),
          });

  return (
    <Alert
      variant="light"
      color={color}
      radius="md"
      icon={tone === 'warning' ? <IconAlertTriangle size={18} /> : <IconFileAlert size={18} />}
      title={title ?? labels.title}
      withCloseButton={!!onDismiss}
      onClose={onDismiss}
      closeButtonLabel={labels.close}
      className={className}
      style={style}
    >
      <Stack gap="xs">
        <Text size="sm" component="div">
          {description ?? defaultDescription}
        </Text>
        {hasDetails && (
          <Collapse expanded={expanded}>
            <ValidationErrorsList errors={errors} withFileHeaders={false} labels={labels.list} />
          </Collapse>
        )}
        {actions.error && (
          <Text size="sm" c="var(--ae-danger)" role="alert">
            {actions.error}
          </Text>
        )}
        {(onContinueWithout || onOpenFile || hasDetails) && (
          <Group gap="xs">
            {onOpenFile && (
              <Button
                size="compact-sm"
                variant="filled"
                color={color}
                onClick={() => onOpenFile(file)}
              >
                {labels.openFile}
              </Button>
            )}
            {onContinueWithout && (
              <Button
                size="compact-sm"
                variant="default"
                loading={pending}
                onClick={() => actions.run('continue', onContinueWithout)}
              >
                {labels.continueWithout}
              </Button>
            )}
            {hasDetails && (
              <Button
                size="compact-sm"
                variant="subtle"
                color="gray"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? labels.hideDetails : labels.showDetails}
              </Button>
            )}
          </Group>
        )}
      </Stack>
    </Alert>
  );
});

InvalidSettingsNotice.displayName = 'InvalidSettingsNotice';
