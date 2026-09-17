import React, { Fragment, memo, useMemo, useState } from 'react';
import {
  ActionIcon,
  Box,
  Button,
  CopyButton,
  Divider,
  EmptyState,
  Group,
  Paper,
  SegmentedControl,
  Table,
  Text,
  Tooltip,
  VisuallyHidden,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import {
  IconBinary,
  IconCheck,
  IconCopy,
  IconFileAlert,
  IconFileMinus,
  IconFilePlus,
  IconFileDiff,
  IconSelector,
} from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import { DiffStats, FileIcon, FileStatusBadge, getFileStatusLabel } from '../DiffMeta';
import {
  buildDiffRows,
  collapseUnchanged,
  toSplitRows,
  type CollapsedItem,
  type DiffRow,
  type SplitDiffRow,
} from '../diff-rows';
import { formatBytes } from '../../utils/shell-output';
import { overlaySegments } from '../../utils/highlight-overlay';
import {
  getTokenStyle,
  useHighlightedLines,
  type HighlightedLines,
  type HighlightToken,
  type SyntaxHighlighter,
} from '../../utils/highlighter';
import {
  computeFileStats,
  countLines,
  getFileSize,
  splitPath,
  stripTrailingNewline,
} from '../file-tree';
import { resolveDiffLabels } from '../labels';
import type { DiffLabels, FileChange, WordSegment } from '../types';
import classes from './DiffFileView.module.css';

export type DiffViewMode = 'unified' | 'split';

export interface DiffFileViewProps {
  /** File change to show */
  change: FileChange;
  /** Layout, controlled */
  mode?: DiffViewMode;
  /** Initial layout when uncontrolled, `unified` by default */
  defaultMode?: DiffViewMode;
  /** Called when the user switches the layout */
  onModeChange?: (mode: DiffViewMode) => void;
  /** Unchanged lines kept around each change, `3` by default */
  contextLines?: number;
  /** Component width in px from which the split layout is available, `720` by default */
  splitMinWidth?: number;
  /** Colors the code with this highlighter; the language is `change.language` or the file extension */
  highlighter?: SyntaxHighlighter;
  /** Files larger than this many bytes show a stub with a Show anyway button, `512000` by default */
  maxBytes?: number;
  /** Content rendered at the end of the header, for example a Viewed checkbox */
  headerActions?: React.ReactNode;
  /** Overrides of the default English labels */
  labels?: Partial<DiffLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const MARKERS = { add: '+', remove: '−', context: ' ' } as const;

function WordChange({
  type,
  children,
  style,
}: {
  type: 'added' | 'removed';
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Box
      component={type === 'added' ? 'ins' : 'del'}
      className={classes.word}
      data-type={type}
      style={style}
    >
      {children}
    </Box>
  );
}

function LineChangeLabel({ type, labels }: { type?: DiffRow['type']; labels: DiffLabels }) {
  if (type === 'add') {
    return <VisuallyHidden>{labels.lineAdded}</VisuallyHidden>;
  }
  return type === 'remove' ? <VisuallyHidden>{labels.lineRemoved}</VisuallyHidden> : null;
}

interface RevealState {
  path: string;
  gaps: ReadonlySet<number>;
  deleted: boolean;
  large: boolean;
  untracked: boolean;
}

const NO_GAPS: ReadonlySet<number> = new Set();

function hiddenReveal(path: string): RevealState {
  return { path, gaps: NO_GAPS, deleted: false, large: false, untracked: false };
}

function Segments({ segments, tokens }: { segments: WordSegment[]; tokens?: HighlightToken[] }) {
  if (tokens) {
    return (
      <>
        {overlaySegments(
          tokens,
          segments.map((segment) => ({ text: segment.text, mark: segment.type }))
        ).map((piece, index) => {
          const tokenStyle = piece.token ? getTokenStyle(piece.token) : undefined;
          return piece.mark === 'equal' ? (
            <span key={index} style={tokenStyle}>
              {piece.text}
            </span>
          ) : (
            <WordChange key={index} type={piece.mark} style={tokenStyle}>
              {piece.text}
            </WordChange>
          );
        })}
      </>
    );
  }
  return (
    <>
      {segments.map((segment, index) =>
        segment.type === 'equal' ? (
          <Fragment key={index}>{segment.text}</Fragment>
        ) : (
          <WordChange key={index} type={segment.type}>
            {segment.text}
          </WordChange>
        )
      )}
    </>
  );
}

interface CodeLines {
  old: HighlightedLines | null;
  new: HighlightedLines | null;
}

function lineTokens(row: DiffRow | undefined, code: CodeLines): HighlightToken[] | undefined {
  if (!row) {
    return undefined;
  }
  if (row.type === 'remove') {
    return row.oldNumber ? code.old?.[row.oldNumber - 1] : undefined;
  }
  return row.newNumber ? code.new?.[row.newNumber - 1] : undefined;
}

function GapRow({
  count,
  colSpan,
  onExpand,
  labels,
}: {
  count: number;
  colSpan: number;
  onExpand: () => void;
  labels: DiffLabels;
}) {
  return (
    <Table.Tr className={classes.gap}>
      <Table.Td colSpan={colSpan}>
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          fullWidth
          leftSection={<IconSelector size={12} />}
          onClick={onExpand}
        >
          {labels.showUnchanged(count)}
        </Button>
      </Table.Td>
    </Table.Tr>
  );
}

function UnifiedRow({ row, code, labels }: { row: DiffRow; code: CodeLines; labels: DiffLabels }) {
  return (
    <Table.Tr data-type={row.type}>
      <Table.Td className={classes.number}>{row.oldNumber}</Table.Td>
      <Table.Td className={classes.number}>{row.newNumber}</Table.Td>
      <Table.Td className={classes.marker}>
        <span aria-hidden>{MARKERS[row.type]}</span>
        <LineChangeLabel type={row.type} labels={labels} />
      </Table.Td>
      <Table.Td className={classes.code}>
        <Segments segments={row.segments} tokens={lineTokens(row, code)} />
      </Table.Td>
    </Table.Tr>
  );
}

function SplitRow({
  row,
  code,
  labels,
}: {
  row: SplitDiffRow;
  code: CodeLines;
  labels: DiffLabels;
}) {
  const { left, right } = row;
  return (
    <Table.Tr>
      <Table.Td className={classes.number} data-type={left?.type ?? 'empty'}>
        {left?.oldNumber}
        <LineChangeLabel type={left?.type} labels={labels} />
      </Table.Td>
      <Table.Td className={cx(classes.code, classes.splitLeft)} data-type={left?.type ?? 'empty'}>
        {left && <Segments segments={left.segments} tokens={lineTokens(left, code)} />}
      </Table.Td>
      <Table.Td className={classes.number} data-type={right?.type ?? 'empty'}>
        {right?.newNumber}
        <LineChangeLabel type={right?.type} labels={labels} />
      </Table.Td>
      <Table.Td className={classes.code} data-type={right?.type ?? 'empty'}>
        {right && <Segments segments={right.segments} tokens={lineTokens(right, code)} />}
      </Table.Td>
    </Table.Tr>
  );
}

/** Diff of one file: unified or split rows with word highlights, collapsed unchanged runs and stubs for binary, deleted and empty files */
export const DiffFileView = memo(function DiffFileView({
  change,
  mode: modeProp,
  defaultMode = 'unified',
  onModeChange,
  contextLines = 3,
  splitMinWidth = 720,
  maxBytes = 512_000,
  highlighter,
  headerActions,
  labels: labelsProp,
  className,
  style,
}: DiffFileViewProps) {
  const labels = useMemo(() => resolveDiffLabels(labelsProp), [labelsProp]);
  const { ref, width } = useElementSize();
  const [innerMode, setInnerMode] = useState(defaultMode);
  const [revealState, setRevealState] = useState(() => hiddenReveal(change.path));
  const reveal = revealState.path === change.path ? revealState : hiddenReveal(change.path);
  const {
    gaps: expandedGaps,
    deleted: showDeleted,
    large: showLarge,
    untracked: showUntracked,
  } = reveal;
  const updateReveal = (patch: Partial<Omit<RevealState, 'path'>>) =>
    setRevealState({ ...reveal, ...patch });

  const canSplit = width >= splitMinWidth;
  const measuring = width === 0 && (modeProp ?? innerMode) === 'split';
  const mode = canSplit ? (modeProp ?? innerMode) : 'unified';
  const size = useMemo(() => getFileSize(change), [change]);
  const hideLarge = !change.binary && size > maxBytes && !showLarge;
  const stats = useMemo(
    () =>
      hideLarge
        ? { additions: change.additions ?? 0, deletions: change.deletions ?? 0 }
        : computeFileStats(change),
    [change, hideLarge]
  );
  const { directory, name } = splitPath(change.path);

  const unchangedRename =
    change.status === 'renamed' && (change.oldContent ?? '') === (change.newContent ?? '');
  const hideDeleted = change.status === 'deleted' && !showDeleted;
  const hideUntracked = Boolean(change.untracked) && !showUntracked;
  const showsRows =
    !change.binary && !hideLarge && !hideUntracked && !unchangedRename && !hideDeleted;

  const rows = useMemo(
    () => (showsRows ? buildDiffRows(change.oldContent ?? '', change.newContent ?? '') : []),
    [showsRows, change.oldContent, change.newContent]
  );
  const language = change.language ?? change.path.split('.').pop();
  const { lines: oldHighlighted } = useHighlightedLines(
    stripTrailingNewline(showsRows ? (change.oldContent ?? '') : ''),
    language,
    showsRows ? highlighter : undefined
  );
  const { lines: newHighlighted } = useHighlightedLines(
    stripTrailingNewline(showsRows ? (change.newContent ?? '') : ''),
    language,
    showsRows ? highlighter : undefined
  );
  const code = useMemo<CodeLines>(
    () => ({ old: oldHighlighted, new: newHighlighted }),
    [oldHighlighted, newHighlighted]
  );

  const splitRows = useMemo(() => (mode === 'split' ? toSplitRows(rows) : []), [mode, rows]);
  const collapsible = change.status === 'modified' || change.status === 'renamed';

  const unifiedItems = useMemo<CollapsedItem<DiffRow>[]>(
    () =>
      collapsible
        ? collapseUnchanged(rows, (row) => row.type === 'context', contextLines, expandedGaps)
        : rows.map((row, index) => ({ kind: 'row', row, index })),
    [collapsible, rows, contextLines, expandedGaps]
  );
  const splitItems = useMemo<CollapsedItem<SplitDiffRow>[]>(
    () =>
      collapsible
        ? collapseUnchanged(
            splitRows,
            (row) => row.left?.type === 'context',
            contextLines,
            expandedGaps
          )
        : splitRows.map((row, index) => ({ kind: 'row', row, index })),
    [collapsible, splitRows, contextLines, expandedGaps]
  );

  const digits = String(
    Math.max(countLines(change.oldContent), countLines(change.newContent), 1)
  ).length;

  const expandGap = (start: number) => updateReveal({ gaps: new Set(expandedGaps).add(start) });

  const changeMode = (value: string) => {
    updateReveal({ gaps: NO_GAPS });
    setInnerMode(value as DiffViewMode);
    onModeChange?.(value as DiffViewMode);
  };

  let body: React.ReactNode;
  if (change.binary) {
    body = (
      <EmptyState
        size="sm"
        py="xl"
        icon={<IconBinary />}
        title={labels.binaryFile}
        description={labels.binaryFileDescription}
      />
    );
  } else if (hideLarge) {
    body = (
      <EmptyState
        size="sm"
        py="xl"
        icon={<IconFileAlert />}
        title={labels.fileTooLarge}
        description={labels.fileTooLargeDescription(formatBytes(size), formatBytes(maxBytes))}
      >
        <EmptyState.Actions>
          <Button size="xs" variant="default" onClick={() => updateReveal({ large: true })}>
            {labels.showAnyway}
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    );
  } else if (hideUntracked) {
    body = (
      <EmptyState
        size="sm"
        py="xl"
        icon={<IconFilePlus />}
        title={labels.untrackedFile}
        description={labels.untrackedFileDescription(countLines(change.newContent))}
      >
        {change.newContent && (
          <EmptyState.Actions>
            <Button size="xs" variant="default" onClick={() => updateReveal({ untracked: true })}>
              {labels.showContent}
            </Button>
          </EmptyState.Actions>
        )}
      </EmptyState>
    );
  } else if (unchangedRename) {
    body = (
      <EmptyState
        size="sm"
        py="xl"
        icon={<IconFileDiff />}
        title={labels.renamedWithoutChanges}
        description={`${change.previousPath ?? ''} → ${change.path}`}
      />
    );
  } else if (hideDeleted) {
    const lines = stats.deletions || countLines(change.oldContent);
    body = (
      <EmptyState
        size="sm"
        py="xl"
        icon={<IconFileMinus />}
        title={labels.deletedFile}
        description={labels.deletedFileDescription(lines)}
      >
        {change.oldContent && (
          <EmptyState.Actions>
            <Button size="xs" variant="default" onClick={() => updateReveal({ deleted: true })}>
              {labels.showContent}
            </Button>
          </EmptyState.Actions>
        )}
      </EmptyState>
    );
  } else if (rows.length === 0) {
    body = <EmptyState size="sm" py="xl" icon={<IconFileDiff />} title={labels.emptyFile} />;
  } else {
    body = (
      <Table
        layout="fixed"
        withRowBorders={false}
        horizontalSpacing={0}
        verticalSpacing={0}
        className={cx(classes.table, classes.measured)}
        data-mode={mode}
        data-measuring={measuring || undefined}
        style={{ '--ae-diff-digits': digits } as React.CSSProperties}
      >
        <colgroup>
          {mode === 'split' ? (
            <>
              <col className={classes.numberCol} />
              <col />
              <col className={classes.numberCol} />
              <col />
            </>
          ) : (
            <>
              <col className={classes.numberCol} />
              <col className={classes.numberCol} />
              <col className={classes.markerCol} />
              <col />
            </>
          )}
        </colgroup>
        <Table.Tbody>
          {mode === 'split'
            ? splitItems.map((item) =>
                item.kind === 'gap' ? (
                  <GapRow
                    key={`gap-${item.start}`}
                    count={item.count}
                    colSpan={4}
                    labels={labels}
                    onExpand={() => expandGap(item.start)}
                  />
                ) : (
                  <SplitRow key={item.index} row={item.row} code={code} labels={labels} />
                )
              )
            : unifiedItems.map((item) =>
                item.kind === 'gap' ? (
                  <GapRow
                    key={`gap-${item.start}`}
                    count={item.count}
                    colSpan={4}
                    labels={labels}
                    onExpand={() => expandGap(item.start)}
                  />
                ) : (
                  <UnifiedRow key={item.index} row={item.row} code={code} labels={labels} />
                )
              )}
        </Table.Tbody>
      </Table>
    );
  }

  return (
    <Paper
      ref={ref}
      withBorder
      radius="md"
      className={cx(classes.root, className)}
      style={style}
      data-mode={mode}
    >
      <Group gap="xs" px="sm" py={6} justify="space-between" wrap="wrap" className={classes.header}>
        <Group gap={6} wrap="nowrap" miw={0} flex="1 1 16rem">
          <FileIcon path={change.path} />
          <FileStatusBadge
            status={change.status}
            untracked={change.untracked}
            label={getFileStatusLabel(change.status, labels, change.untracked)}
          />
          <Text size="sm" truncate="start" miw={0} className={classes.path} title={change.path}>
            {change.previousPath && change.previousPath !== change.path && (
              <Text span inherit c="dimmed">
                {change.previousPath} →{' '}
              </Text>
            )}
            <Text span inherit c="dimmed">
              {directory}
            </Text>
            <Text span inherit fw={500}>
              {name}
            </Text>
          </Text>
          <CopyButton value={change.path}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? labels.pathCopied : labels.copyPath} withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={copied ? labels.pathCopied : labels.copyPath}
                  onClick={copy}
                >
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
        <Group gap="xs" wrap="wrap" ml="auto" justify="flex-end">
          {!change.binary && <DiffStats additions={stats.additions} deletions={stats.deletions} />}
          {canSplit && showsRows && (
            <SegmentedControl
              size="xs"
              value={mode}
              onChange={changeMode}
              data={[
                { value: 'unified', label: labels.unified },
                { value: 'split', label: labels.split },
              ]}
            />
          )}
          {headerActions}
        </Group>
      </Group>
      <Divider />
      <Box className={classes.body}>{body}</Box>
    </Paper>
  );
});

DiffFileView.displayName = 'DiffFileView';
