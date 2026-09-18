import React, { Fragment, memo, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Box,
  Code,
  Divider,
  EmptyState,
  Group,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconBraces, IconChevronRight, IconEye, IconEyeOff } from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import { fillTemplate } from '../../utils/fill-template';
import {
  flattenSchemaValues,
  formatSchemaValue,
  isLikelySecretKey,
  type SchemaValueRow,
} from './schema-values';
import { getDefaultExpandedPaths, getVisibleSchemaRows, type JsonSchema } from './schema';
import schemaClasses from './SchemaView.module.css';
import classes from './SchemaValues.module.css';

export type SchemaValuesLabels = {
  /** Name column header, `Name` by default */
  name: string;
  /** Type column header, `Type` by default */
  type: string;
  /** Value column header, `Value` by default */
  value: string;
  /** Description column header, `Description` by default */
  description: string;
  /** Badge on required fields, `required` by default */
  required: string;
  /** Badge on keys the schema does not describe, `extra` by default */
  extra: string;
  /** Shown instead of the value of a missing optional field, `Not set` by default */
  notSet: string;
  /** Shown when there is nothing to render, `No values` by default */
  empty: string;
  /** Accessible label prefix of the expand button, `Expand` by default */
  expand: string;
  /** Accessible label prefix of the collapse button, `Collapse` by default */
  collapse: string;
  /** Accessible label prefix of the reveal button, `Show value` by default */
  show: string;
  /** Accessible label prefix of the mask button, `Hide value` by default */
  hide: string;
  /** Button that reveals the rest of a long value, `Show more` by default */
  more: string;
  /** Button that truncates a long value again, `Show less` by default */
  less: string;
  /** Summary of an object value, `{count}` is replaced with the number of keys */
  objectSummary: string;
  /** Summary of an array value, `{count}` is replaced with the number of items */
  arraySummary: string;
};

export const DEFAULT_SCHEMA_VALUES_LABELS: SchemaValuesLabels = {
  name: 'Name',
  type: 'Type',
  value: 'Value',
  description: 'Description',
  required: 'required',
  extra: 'extra',
  notSet: 'Not set',
  empty: 'No values',
  expand: 'Expand',
  collapse: 'Collapse',
  show: 'Show value',
  hide: 'Hide value',
  more: 'Show more',
  less: 'Show less',
  objectSummary: '{count} keys',
  arraySummary: '{count} items',
};

export interface SchemaValuesProps {
  /** JSON Schema that describes the values, for example a tool `inputSchema` */
  schema: JsonSchema;
  /** Values to render, usually the arguments of a tool call */
  values: unknown;
  /** Nesting levels expanded initially, `2` by default */
  defaultExpandedDepth?: number;
  /** Component width in px from which values are shown as a table, `560` by default */
  breakpoint?: number;
  /** Characters after which a value is truncated behind a "Show more" button, `160` by default */
  maxValueLength?: number;
  /** Masks values of fields that read like credentials behind a reveal button, `true` by default */
  maskSecrets?: boolean;
  /** Decides which fields are masked, by default field names such as `token` or `password` */
  isSecret?: (name: string, path: string) => boolean;
  /** Hides rows of optional fields that are missing from `values`, `false` by default */
  hideMissing?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<SchemaValuesLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const MASK = '••••••••';

function defaultIsSecret(name: string): boolean {
  return isLikelySecretKey(name);
}

type RowPartProps = {
  row: SchemaValueRow;
  labels: SchemaValuesLabels;
};

function NameCell({
  row,
  labels,
  expanded,
  withToggleSpace,
  onToggle,
}: RowPartProps & {
  expanded: boolean;
  withToggleSpace: boolean;
  onToggle: () => void;
}) {
  const toggleLabel = `${expanded ? labels.collapse : labels.expand} ${row.name}`;
  return (
    <Group
      gap={4}
      wrap="nowrap"
      className={schemaClasses.name}
      style={{ '--schema-depth': row.depth } as React.CSSProperties}
    >
      {row.hasChildren ? (
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          aria-label={toggleLabel}
          aria-expanded={expanded}
          onClick={onToggle}
        >
          <IconChevronRight
            size={14}
            className={schemaClasses.chevron}
            data-expanded={expanded || undefined}
          />
        </ActionIcon>
      ) : (
        withToggleSpace && <Box className={schemaClasses.toggleSpace} />
      )}
      <Text size="sm" ff="monospace" fw={500} className={schemaClasses.breakAll}>
        {row.name}
      </Text>
      {row.required && (
        <Badge size="xs" variant="light" color="red" className={schemaClasses.badge}>
          {labels.required}
        </Badge>
      )}
      {!row.known && (
        <Badge size="xs" variant="default" className={schemaClasses.badge}>
          {labels.extra}
        </Badge>
      )}
    </Group>
  );
}

function TypeCell({ row }: { row: SchemaValueRow }) {
  return row.type ? <Code>{row.type}</Code> : null;
}

function ValueCell({
  row,
  labels,
  secret,
  revealed,
  expandedText,
  maxValueLength,
  onReveal,
  onExpandText,
}: RowPartProps & {
  secret: boolean;
  revealed: boolean;
  expandedText: boolean;
  maxValueLength: number;
  onReveal: () => void;
  onExpandText: () => void;
}) {
  if (!row.present) {
    return (
      <Text size="sm" c="dimmed">
        {labels.notSet}
      </Text>
    );
  }

  if (row.kind !== 'leaf') {
    const template = row.kind === 'array' ? labels.arraySummary : labels.objectSummary;
    return (
      <Text size="sm" c="dimmed">
        {fillTemplate(template, { count: row.size })}
      </Text>
    );
  }

  const text = formatSchemaValue(row.value);
  const truncated = !expandedText && text.length > maxValueLength;
  const shown = secret && !revealed ? MASK : truncated ? `${text.slice(0, maxValueLength)}…` : text;
  const revealLabel = `${revealed ? labels.hide : labels.show}: ${row.name}`;

  return (
    <Stack gap={2} className={classes.valueCell}>
      <Group gap={6} wrap="nowrap" align="flex-start">
        <Text size="sm" ff="monospace" className={classes.value}>
          {shown}
        </Text>
        {secret && (
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            aria-label={revealLabel}
            onClick={onReveal}
          >
            {revealed ? <IconEyeOff size={14} /> : <IconEye size={14} />}
          </ActionIcon>
        )}
      </Group>
      {text.length > maxValueLength && (!secret || revealed) && (
        <UnstyledButton className={classes.toggleText} onClick={onExpandText}>
          <Text size="xs" c="dimmed">
            {expandedText ? labels.less : labels.more}
          </Text>
        </UnstyledButton>
      )}
    </Stack>
  );
}

/** Values rendered against their JSON Schema: names, types, required marks and descriptions with the actual data */
export const SchemaValues = memo(function SchemaValues({
  schema,
  values,
  defaultExpandedDepth = 2,
  breakpoint = 560,
  maxValueLength = 160,
  maskSecrets = true,
  isSecret = defaultIsSecret,
  hideMissing = false,
  labels: labelsOverride,
  className,
  style,
}: SchemaValuesProps) {
  const labels = { ...DEFAULT_SCHEMA_VALUES_LABELS, ...labelsOverride };
  const { ref, width } = useElementSize();
  const isWide = width >= breakpoint;
  const allRows = useMemo(() => flattenSchemaValues(schema, values), [schema, values]);
  const rows = useMemo(
    () => (hideMissing ? allRows.filter((row) => row.present) : allRows),
    [allRows, hideMissing]
  );
  const [state, setState] = useState(() => ({
    rows,
    expanded: getDefaultExpandedPaths(rows, defaultExpandedDepth),
  }));
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const [expandedText, setExpandedText] = useState<ReadonlySet<string>>(new Set());
  if (state.rows !== rows) {
    setState({ rows, expanded: getDefaultExpandedPaths(rows, defaultExpandedDepth) });
  }

  const visible = getVisibleSchemaRows(rows, state.expanded);
  const withToggleSpace = rows.some((row) => row.hasChildren);

  const toggle = (path: string) => {
    setState((prev) => {
      const expanded = new Set(prev.expanded);
      if (expanded.has(path)) {
        expanded.delete(path);
      } else {
        expanded.add(path);
      }
      return { ...prev, expanded };
    });
  };

  const togglePath = (prev: ReadonlySet<string>, path: string) => {
    const next = new Set(prev);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    return next;
  };

  const nameCell = (row: SchemaValueRow) => (
    <NameCell
      row={row}
      labels={labels}
      expanded={state.expanded.has(row.path)}
      withToggleSpace={withToggleSpace}
      onToggle={() => toggle(row.path)}
    />
  );

  const valueCell = (row: SchemaValueRow) => (
    <ValueCell
      row={row}
      labels={labels}
      secret={maskSecrets && row.kind === 'leaf' && row.present && isSecret(row.name, row.path)}
      revealed={revealed.has(row.path)}
      expandedText={expandedText.has(row.path)}
      maxValueLength={maxValueLength}
      onReveal={() => setRevealed((prev) => togglePath(prev, row.path))}
      onExpandText={() => setExpandedText((prev) => togglePath(prev, row.path))}
    />
  );

  let content: React.ReactNode;
  if (rows.length === 0) {
    content = <EmptyState size="sm" icon={<IconBraces />} title={labels.empty} />;
  } else if (isWide) {
    content = (
      <Table verticalSpacing="xs" className={schemaClasses.table}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{labels.name}</Table.Th>
            <Table.Th>{labels.type}</Table.Th>
            <Table.Th>{labels.value}</Table.Th>
            <Table.Th>{labels.description}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visible.map((row) => (
            <Table.Tr key={row.path}>
              <Table.Td>{nameCell(row)}</Table.Td>
              <Table.Td>
                <TypeCell row={row} />
              </Table.Td>
              <Table.Td>{valueCell(row)}</Table.Td>
              <Table.Td>{row.description && <Text size="sm">{row.description}</Text>}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  } else {
    content = (
      <Stack gap={0}>
        {visible.map((row, index) => (
          <Fragment key={row.path}>
            {index > 0 && <Divider />}
            <Stack gap={4} py="xs" data-path={row.path}>
              <Group justify="space-between" gap="xs" wrap="nowrap" align="flex-start">
                {nameCell(row)}
                <TypeCell row={row} />
              </Group>
              <Box
                className={schemaClasses.detail}
                data-with-toggle={withToggleSpace || undefined}
                style={{ '--schema-depth': row.depth } as React.CSSProperties}
              >
                {valueCell(row)}
                {row.description && (
                  <Text size="xs" c="dimmed" mt={4}>
                    {row.description}
                  </Text>
                )}
              </Box>
            </Stack>
          </Fragment>
        ))}
      </Stack>
    );
  }

  return (
    <Box
      ref={ref}
      className={cx(schemaClasses.root, className)}
      style={style}
      data-measuring={width === 0 || undefined}
    >
      {content}
    </Box>
  );
});

SchemaValues.displayName = 'SchemaValues';
