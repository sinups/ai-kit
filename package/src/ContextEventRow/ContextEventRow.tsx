import React, { memo } from 'react';
import { Code, Stack } from '@mantine/core';
import {
  IconBookmark,
  IconFile,
  IconFolder,
  IconPlug,
  IconSparkles,
  IconStethoscope,
  type Icon,
} from '@tabler/icons-react';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { ContextEventKind, ContextEventPart } from '../types';
import classes from './ContextEventRow.module.css';

export type ContextEventLabels = Record<ContextEventKind, string>;

const DEFAULT_LABELS: ContextEventLabels = {
  file: 'Read',
  directory: 'Listed',
  memory: 'Loaded memory',
  'mcp-resource': 'Attached',
  skill: 'Loaded skill',
  diagnostics: 'Found diagnostics in',
};

const KIND_ICON: Record<ContextEventKind, Icon> = {
  file: IconFile,
  directory: IconFolder,
  memory: IconBookmark,
  'mcp-resource': IconPlug,
  skill: IconSparkles,
  diagnostics: IconStethoscope,
};

export interface ContextEventRowProps extends Omit<ContextEventPart, 'type'> {
  /** Initial expanded state when `items` are given, `false` by default */
  defaultExpanded?: boolean;
  /** Verbs per kind, for example `{ file: 'Opened' }` */
  labels?: Partial<ContextEventLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Compact row for something added to the context: icon, verb and object, expandable to its items */
export const ContextEventRow = memo(function ContextEventRow({
  kind,
  label,
  detail,
  items,
  defaultExpanded = false,
  labels,
  className,
  style,
}: ContextEventRowProps) {
  const KindIcon = KIND_ICON[kind] ?? IconFile;
  const verb = { ...DEFAULT_LABELS, ...labels }[kind] ?? kind;
  const hasItems = Boolean(items && items.length > 0);

  return (
    <ToolRowBase
      icon={<KindIcon size={12} aria-hidden />}
      completeLabel={verb}
      detail={detail ? `${label} · ${detail}` : label}
      isAnimating={false}
      expandable={hasItems}
      defaultOpen={defaultExpanded}
      className={className}
      style={style}
      data-context-kind={kind}
    >
      {hasItems && (
        <Stack gap={2} className={classes.items}>
          {items!.map((item, index) => (
            <Code key={`${item}-${index}`} className={classes.item}>
              {item}
            </Code>
          ))}
        </Stack>
      )}
    </ToolRowBase>
  );
});

ContextEventRow.displayName = 'ContextEventRow';
