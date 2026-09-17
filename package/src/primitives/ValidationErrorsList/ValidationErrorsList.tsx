import React, { Fragment, memo, useMemo, useState } from 'react';
import { Anchor, Badge, Button, Code, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconExternalLink,
  IconFile,
} from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import { isSafeHttpUrl } from '../../utils/safe-url';
import {
  fillValidationTemplate,
  getValidationErrorKey,
  groupValidationErrors,
  type SettingsValidationError,
  type ValidationErrorGroup,
} from './validation-errors';
import classes from './ValidationErrorsList.module.css';

export interface ValidationErrorsListLabels {
  /** Link to the documentation of a field */
  docs: string;
  /** Opens a file from its group header */
  openFile: string;
  /** `{count}` is replaced with the number of hidden rows */
  showMore: string;
  showLess: string;
  /** Group counter, `{count}` is replaced */
  problems: string;
}

export interface ValidationErrorsListProps {
  /** Errors of one or more settings files; identical errors are shown once */
  errors: SettingsValidationError[];
  /** Adds an open button to each file header */
  onOpenFile?: (file: string) => void;
  /** Rows shown per file before a "Show more" button, all rows by default */
  maxItems?: number;
  /** Renders file headers, `true` by default; hide them when the file is already named nearby */
  withFileHeaders?: boolean;
  /** Shown when there are no errors, nothing is rendered by default */
  emptyLabel?: React.ReactNode;
  /** Overrides of the default English labels */
  labels?: Partial<ValidationErrorsListLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const DEFAULT_VALIDATION_ERRORS_LIST_LABELS: ValidationErrorsListLabels = {
  docs: 'Docs',
  openFile: 'Open file',
  showMore: 'Show {count} more',
  showLess: 'Show less',
  problems: '{count}',
};

function ErrorRow({ error, docsLabel }: { error: SettingsValidationError; docsLabel: string }) {
  const warning = error.severity === 'warning';
  const Icon = warning ? IconAlertTriangle : IconAlertCircle;
  const docsUrl = error.docsUrl && isSafeHttpUrl(error.docsUrl) ? error.docsUrl : undefined;
  return (
    <Group
      gap="xs"
      wrap="nowrap"
      align="flex-start"
      className={classes.row}
      data-severity={warning ? 'warning' : 'error'}
    >
      <Icon size={16} className={classes.icon} aria-hidden />
      <Stack gap={2} className={classes.body}>
        {error.path && <Code className={classes.path}>{error.path}</Code>}
        <Text size="sm" className={classes.message}>
          {error.message}
        </Text>
        {(error.suggestion || docsUrl) && (
          <Group gap="xs" wrap="wrap">
            {error.suggestion && (
              <Text size="xs" c="dimmed">
                {error.suggestion}
              </Text>
            )}
            {docsUrl && (
              <Anchor href={docsUrl} target="_blank" rel="noopener noreferrer" size="xs">
                <Group gap={2} wrap="nowrap" component="span">
                  {docsLabel}
                  <IconExternalLink size={12} aria-hidden />
                </Group>
              </Anchor>
            )}
          </Group>
        )}
      </Stack>
    </Group>
  );
}

function FileGroup({
  group,
  onOpenFile,
  maxItems,
  withHeader,
  labels,
}: {
  group: ValidationErrorGroup;
  onOpenFile?: (file: string) => void;
  maxItems?: number;
  withHeader: boolean;
  labels: ValidationErrorsListLabels;
}) {
  const [expanded, setExpanded] = useState(false);
  const limit = maxItems !== undefined && maxItems > 0 ? maxItems : Infinity;
  const hidden = Math.max(0, group.errors.length - limit);
  const visible = expanded ? group.errors : group.errors.slice(0, limit);
  const count = group.errors.length;

  return (
    <Paper
      withBorder={withHeader}
      bg={withHeader ? undefined : 'transparent'}
      radius="md"
      component="section"
      className={classes.group}
      aria-label={group.file}
    >
      {withHeader && (
        <>
          <Group justify="space-between" wrap="nowrap" gap="xs" px="md" py="xs">
            <Group gap="xs" wrap="nowrap" miw={0}>
              <IconFile size={16} className={classes.fileIcon} aria-hidden />
              <Text size="sm" fw={500} ff="monospace" truncate="start" miw={0} title={group.file}>
                <bdi>{group.file}</bdi>
              </Text>
              <Badge
                size="xs"
                variant="light"
                color={group.errorCount > 0 ? 'red' : 'yellow'}
                className={classes.badge}
              >
                {fillValidationTemplate(labels.problems, { count: String(count) })}
              </Badge>
            </Group>
            {onOpenFile && (
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                className={classes.badge}
                onClick={() => onOpenFile(group.file)}
              >
                {labels.openFile}
              </Button>
            )}
          </Group>
          <Divider />
        </>
      )}
      <Stack gap="xs" px={withHeader ? 'md' : 0} py={withHeader ? 'xs' : 0}>
        {visible.map((error, index) => (
          <Fragment key={getValidationErrorKey(error)}>
            {index > 0 && <Divider />}
            <ErrorRow error={error} docsLabel={labels.docs} />
          </Fragment>
        ))}
        {hidden > 0 && (
          <Group>
            <Button
              size="compact-xs"
              variant="subtle"
              color="gray"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded
                ? labels.showLess
                : fillValidationTemplate(labels.showMore, {
                    count: String(hidden),
                  })}
            </Button>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

/** Settings validation errors grouped by file, with field paths, suggestions and documentation links */
export const ValidationErrorsList = memo(function ValidationErrorsList({
  errors,
  onOpenFile,
  maxItems,
  withFileHeaders = true,
  emptyLabel,
  labels: labelsProp,
  className,
  style,
}: ValidationErrorsListProps) {
  const labels = { ...DEFAULT_VALIDATION_ERRORS_LIST_LABELS, ...labelsProp };
  const groups = useMemo(() => groupValidationErrors(errors), [errors]);

  if (groups.length === 0) {
    return emptyLabel ? (
      <Text size="sm" c="dimmed" className={className} style={style}>
        {emptyLabel}
      </Text>
    ) : null;
  }

  return (
    <Stack gap="sm" className={cx(classes.root, className)} style={style}>
      {groups.map((group) => (
        <FileGroup
          key={group.file}
          group={group}
          onOpenFile={onOpenFile}
          maxItems={maxItems}
          withHeader={withFileHeaders}
          labels={labels}
        />
      ))}
    </Stack>
  );
});

ValidationErrorsList.displayName = 'ValidationErrorsList';
