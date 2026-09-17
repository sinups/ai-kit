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
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconBraces, IconChevronRight } from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import {
  flattenSchema,
  getDefaultExpandedPaths,
  getVisibleSchemaRows,
  type JsonSchema,
  type SchemaRow,
} from './schema';
import classes from './SchemaView.module.css';

export type SchemaViewLabels = {
  /** Name column header, `Name` by default */
  name: string;
  /** Type column header, `Type` by default */
  type: string;
  /** Description column header, `Description` by default */
  description: string;
  /** Default column header and narrow prefix, `Default` by default */
  default: string;
  /** Badge on required parameters, `required` by default */
  required: string;
  /** Prefix of allowed values, `One of` by default */
  oneOf: string;
  /** Accessible label prefix of the expand button, `Expand` by default */
  expand: string;
  /** Accessible label prefix of the collapse button, `Collapse` by default */
  collapse: string;
};

export interface SchemaViewProps {
  /** JSON Schema of an object, for example a tool `inputSchema` */
  schema: JsonSchema;
  /** Shown when the schema has no properties, `No parameters` by default */
  emptyLabel?: React.ReactNode;
  /** Nesting levels expanded initially, `1` by default (top-level objects open, deeper ones closed) */
  defaultExpandedDepth?: number;
  /** Component width in px from which parameters are shown as a table, `560` by default */
  breakpoint?: number;
  /** Column headers and accessible labels */
  labels?: Partial<SchemaViewLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const DEFAULT_LABELS: SchemaViewLabels = {
  name: 'Name',
  type: 'Type',
  description: 'Description',
  default: 'Default',
  required: 'required',
  oneOf: 'One of',
  expand: 'Expand',
  collapse: 'Collapse',
};

function formatRange(row: SchemaRow): string | null {
  if (row.minimum !== undefined && row.maximum !== undefined) {
    return `${row.minimum} – ${row.maximum}`;
  }
  if (row.minimum !== undefined) {
    return `≥ ${row.minimum}`;
  }
  if (row.maximum !== undefined) {
    return `≤ ${row.maximum}`;
  }
  return null;
}

type RowPartProps = {
  row: SchemaRow;
  labels: SchemaViewLabels;
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
      className={classes.name}
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
            className={classes.chevron}
            data-expanded={expanded || undefined}
          />
        </ActionIcon>
      ) : (
        withToggleSpace && <Box className={classes.toggleSpace} />
      )}
      <Text size="sm" ff="monospace" fw={500} className={classes.breakAll}>
        {row.name}
      </Text>
      {row.required && (
        <Badge size="xs" variant="light" color="red" className={classes.badge}>
          {labels.required}
        </Badge>
      )}
    </Group>
  );
}

function TypeCell({ row }: { row: SchemaRow }) {
  return (
    <Group gap={4} wrap="wrap">
      <Code>{row.type}</Code>
      {row.format && (
        <Text size="xs" c="dimmed">
          {row.format}
        </Text>
      )}
    </Group>
  );
}

function DescriptionCell({ row, labels }: RowPartProps) {
  const range = formatRange(row);
  return (
    <Stack gap={4}>
      {row.description && <Text size="sm">{row.description}</Text>}
      {row.enum && (
        <Group gap={4} wrap="wrap">
          <Text size="xs" c="dimmed">
            {labels.oneOf}
          </Text>
          {row.enum.map((value, index) => (
            <Code key={index}>{JSON.stringify(value)}</Code>
          ))}
        </Group>
      )}
      {range && (
        <Text size="xs" c="dimmed">
          {range}
        </Text>
      )}
    </Stack>
  );
}

/** JSON Schema as a parameter reference: a table when wide, stacked rows when narrow, nested objects collapsible */
export const SchemaView = memo(function SchemaView({
  schema,
  emptyLabel = 'No parameters',
  defaultExpandedDepth = 1,
  breakpoint = 560,
  labels: labelsOverride,
  className,
  style,
}: SchemaViewProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsOverride };
  const { ref, width } = useElementSize();
  const isWide = width >= breakpoint;
  const rows = useMemo(() => flattenSchema(schema), [schema]);
  const [state, setState] = useState(() => ({
    rows,
    expanded: getDefaultExpandedPaths(rows, defaultExpandedDepth),
  }));
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

  const nameCell = (row: SchemaRow) => (
    <NameCell
      row={row}
      labels={labels}
      expanded={state.expanded.has(row.path)}
      withToggleSpace={withToggleSpace}
      onToggle={() => toggle(row.path)}
    />
  );

  let content: React.ReactNode;
  if (rows.length === 0) {
    content = <EmptyState size="sm" icon={<IconBraces />} title={emptyLabel} />;
  } else if (isWide) {
    content = (
      <Table verticalSpacing="xs" className={classes.table}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{labels.name}</Table.Th>
            <Table.Th>{labels.type}</Table.Th>
            <Table.Th>{labels.description}</Table.Th>
            <Table.Th>{labels.default}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visible.map((row) => (
            <Table.Tr key={row.path}>
              <Table.Td>{nameCell(row)}</Table.Td>
              <Table.Td>
                <TypeCell row={row} />
              </Table.Td>
              <Table.Td>
                <DescriptionCell row={row} labels={labels} />
              </Table.Td>
              <Table.Td>
                {row.default !== undefined && <Code>{JSON.stringify(row.default)}</Code>}
              </Table.Td>
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
                className={classes.detail}
                data-with-toggle={withToggleSpace || undefined}
                style={{ '--schema-depth': row.depth } as React.CSSProperties}
              >
                <DescriptionCell row={row} labels={labels} />
                {row.default !== undefined && (
                  <Group gap={4} mt={4}>
                    <Text size="xs" c="dimmed">
                      {labels.default}
                    </Text>
                    <Code>{JSON.stringify(row.default)}</Code>
                  </Group>
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
      className={cx(classes.root, className)}
      style={style}
      data-measuring={width === 0 || undefined}
    >
      {content}
    </Box>
  );
});
