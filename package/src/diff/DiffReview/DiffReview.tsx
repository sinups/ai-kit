import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  EmptyState,
  Group,
  Progress,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { getHotkeyHandler, useElementSize } from '@mantine/hooks';
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconFileDiff,
  IconX,
} from '@tabler/icons-react';
import { MasterDetail } from '../../primitives/MasterDetail/MasterDetail';
import { ShortcutHint } from '../../primitives/ShortcutHint/ShortcutHint';
import { cx } from '../../utils/cx';
import { DiffFileList, type DiffFileListView } from '../DiffFileList/DiffFileList';
import { DiffFileView, type DiffViewMode } from '../DiffFileView/DiffFileView';
import { buildFileTree, flattenFileTree } from '../file-tree';
import { resolveDiffLabels } from '../labels';
import type { SyntaxHighlighter } from '../../utils/highlighter';
import type { DiffLabels, DiffSource, FileChange, FileDecision } from '../types';
import { usePendingActions } from '../../hooks/use-pending-actions';
import classes from './DiffReview.module.css';

export type FileChangeAction = (change: FileChange) => void | Promise<void>;

export interface DiffReviewProps {
  /** Changed files in review order, ignored when `sources` is set */
  changes?: FileChange[];
  /** Alternative change sets, for example uncommitted changes and each agent turn, switched above the list */
  sources?: DiffSource[];
  /** Id of the shown source, controlled */
  sourceId?: string;
  /** Initial source id when uncontrolled, the first source by default */
  defaultSourceId?: string;
  /** Called when another source is picked; the first file of that source is opened */
  onSourceChange?: (id: string) => void;
  /** Path of the open file, controlled */
  selectedPath?: string | null;
  /** Initial open file when uncontrolled, the first file by default */
  defaultSelectedPath?: string | null;
  /** Called when another file is opened */
  onSelectedPathChange?: (path: string | null) => void;
  /** Paths marked as viewed, controlled */
  viewedPaths?: string[];
  /** Initial viewed paths when uncontrolled */
  defaultViewedPaths?: string[];
  /** Called when a file is marked or unmarked as viewed */
  onViewedPathsChange?: (paths: string[]) => void;
  /** Accept or reject decision per path, shown in the list and on the buttons */
  decisions?: Record<string, FileDecision>;
  /** Accepts one file, renders the Accept button when set */
  onAccept?: FileChangeAction;
  /** Rejects one file, renders the Reject button when set */
  onReject?: FileChangeAction;
  /** Accepts every file, renders the Accept all button when set */
  onAcceptAll?: () => void | Promise<void>;
  /** Rejects every file, renders the Reject all button when set */
  onRejectAll?: () => void | Promise<void>;
  /** Initial file list layout, `list` by default; Prev/Next follow the order of the shown layout */
  defaultView?: DiffFileListView;
  /** Colors the diff with this highlighter */
  highlighter?: SyntaxHighlighter;
  /** Initial diff layout, `unified` by default */
  defaultMode?: DiffViewMode;
  /** Content at the start of the first row, on the same inner edge as the controls, for example a panel title */
  header?: React.ReactNode;
  /** Lighter controls for side panels: ghost buttons and the file search behind an icon; follows the width when omitted */
  compact?: boolean;
  /** Marks the file search with `data-autofocus` so an enclosing Drawer or Modal focuses it, `true` by default */
  searchAutofocus?: boolean;
  /** Enables `j`/`k` to move between files while focus is inside the review, `true` by default */
  withHotkeys?: boolean;
  /** Shows skeleton rows in the file list */
  loading?: boolean;
  /** Error message shown instead of the file list */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetry?: () => void;
  /** File list width in px when wide, `320` by default */
  listWidth?: number;
  /** Component width in px from which the list and the diff sit side by side, `900` by default */
  breakpoint?: number;
  /** Overrides of the default English labels */
  labels?: Partial<DiffLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const NON_TYPING_INPUTS = new Set(['checkbox', 'radio', 'button', 'submit', 'reset']);

function isTypingTarget(target: HTMLElement) {
  if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
    return true;
  }
  return target.tagName === 'INPUT' && !NON_TYPING_INPUTS.has((target as HTMLInputElement).type);
}

const EMPTY_CHANGES: FileChange[] = [];
const SEGMENTED_SOURCES_WIDTH = 560;

/** Multi-file change review: file list and diff, file navigation with j/k, viewed marks and accept/reject */
export const DiffReview = memo(function DiffReview({
  changes: changesProp,
  sources,
  sourceId: sourceIdProp,
  defaultSourceId,
  onSourceChange,
  selectedPath: selectedPathProp,
  defaultSelectedPath,
  onSelectedPathChange,
  viewedPaths: viewedPathsProp,
  defaultViewedPaths = [],
  onViewedPathsChange,
  decisions,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  defaultView = 'list',
  defaultMode,
  highlighter,
  header,
  compact: compactProp,
  searchAutofocus = true,
  withHotkeys = true,
  loading,
  error,
  onRetry,
  listWidth = 320,
  breakpoint = 900,
  labels: labelsProp,
  className,
  style,
}: DiffReviewProps) {
  const [innerSourceId, setInnerSourceId] = useState(defaultSourceId ?? sources?.[0]?.id);
  const activeSourceId = sourceIdProp ?? innerSourceId;
  const activeSource = sources?.find((source) => source.id === activeSourceId) ?? sources?.[0];
  const changes = useMemo(
    () => activeSource?.changes ?? changesProp ?? EMPTY_CHANGES,
    [activeSource, changesProp]
  );
  const { ref: rootRef, width } = useElementSize<HTMLDivElement>();
  const measuring = width === 0;
  const compact = compactProp ?? width < breakpoint;
  const labels = useMemo<DiffLabels>(() => resolveDiffLabels(labelsProp), [labelsProp]);
  const [innerSelected, setInnerSelected] = useState<string | null>(
    defaultSelectedPath !== undefined ? defaultSelectedPath : (changes[0]?.path ?? null)
  );
  const [innerViewed, setInnerViewed] = useState(defaultViewedPaths);
  const [detailOpen, setDetailOpen] = useState(false);
  const [view, setView] = useState<DiffFileListView>(defaultView);
  const [mode, setMode] = useState<DiffViewMode>(defaultMode ?? 'unified');
  const actions = usePendingActions();
  const topRef = useRef<HTMLDivElement>(null);

  const viewedPaths = viewedPathsProp ?? innerViewed;
  const viewed = useMemo(() => new Set(viewedPaths), [viewedPaths]);
  const order = useMemo(
    () => (view === 'tree' ? flattenFileTree(buildFileTree(changes)) : changes),
    [view, changes]
  );
  const innerSelectedMissing =
    (innerSelected !== null || defaultSelectedPath === undefined) &&
    !order.some((change) => change.path === innerSelected);
  const selectedPath =
    selectedPathProp !== undefined
      ? selectedPathProp
      : innerSelectedMissing
        ? (order[0]?.path ?? null)
        : innerSelected;
  const index = order.findIndex((change) => change.path === selectedPath);
  const selected = index === -1 ? undefined : order[index];

  useEffect(() => {
    topRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedPath]);

  const select = (path: string | null) => {
    setInnerSelected(path);
    onSelectedPathChange?.(path);
  };

  const changeSource = (id: string | null) => {
    const next = sources?.find((source) => source.id === id);
    if (!next || next.id === activeSource?.id) {
      return;
    }
    setInnerSourceId(next.id);
    onSourceChange?.(next.id);
    select(next.changes[0]?.path ?? null);
    setDetailOpen(false);
  };

  const sourceOptions = sources?.map((source) => ({
    value: source.id,
    label: `${source.label} (${source.changes.length})`,
  }));
  const sourceSwitcher =
    sourceOptions && sourceOptions.length > 1 ? (
      width >= SEGMENTED_SOURCES_WIDTH && sourceOptions.length <= 4 ? (
        <SegmentedControl
          className={classes.measured}
          data-measuring={width === 0 || undefined}
          size="xs"
          aria-label={labels.changesSource}
          value={activeSource?.id}
          onChange={changeSource}
          data={sourceOptions}
        />
      ) : (
        <Select
          className={classes.measured}
          data-measuring={width === 0 || undefined}
          size="xs"
          w={180}
          aria-label={labels.changesSource}
          allowDeselect={false}
          value={activeSource?.id ?? null}
          onChange={changeSource}
          data={sourceOptions}
        />
      )
    ) : null;

  const go = (step: 1 | -1) => {
    if (order.length === 0) {
      return;
    }
    const next = index === -1 ? (step === 1 ? 0 : order.length - 1) : index + step;
    if (next >= 0 && next < order.length) {
      select(order[next].path);
    }
  };

  const hotkeys = getHotkeyHandler([
    ['j', () => go(1)],
    ['k', () => go(-1)],
  ]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!withHotkeys || isTypingTarget(event.target as HTMLElement)) {
      return;
    }
    hotkeys(event);
  };

  const toggleViewed = (path: string, checked: boolean) => {
    const next = checked
      ? [...viewedPaths.filter((item) => item !== path), path]
      : viewedPaths.filter((item) => item !== path);
    setInnerViewed(next);
    onViewedPathsChange?.(next);
  };

  const viewedCount = changes.filter((change) => viewed.has(change.path)).length;
  const bulkPending = actions.isPending('acceptAll') || actions.isPending('rejectAll');

  const fileActions = selected && (
    <Group gap="xs" wrap="nowrap">
      <Checkbox
        size="xs"
        label={labels.viewed}
        checked={viewed.has(selected.path)}
        onChange={(event) => toggleViewed(selected.path, event.currentTarget.checked)}
      />
      {onReject && (
        <Button
          size="compact-xs"
          color="red"
          variant={decisions?.[selected.path] === 'rejected' ? 'filled' : 'light'}
          leftSection={<IconX size={12} />}
          loading={actions.isPending(`reject:${selected.path}`)}
          disabled={bulkPending}
          onClick={() => actions.run(`reject:${selected.path}`, () => onReject(selected))}
        >
          {labels.reject}
        </Button>
      )}
      {onAccept && (
        <Button
          size="compact-xs"
          color="green"
          variant={decisions?.[selected.path] === 'accepted' ? 'filled' : 'light'}
          leftSection={<IconCheck size={12} />}
          loading={actions.isPending(`accept:${selected.path}`)}
          disabled={bulkPending}
          onClick={() => actions.run(`accept:${selected.path}`, () => onAccept(selected))}
        >
          {labels.accept}
        </Button>
      )}
    </Group>
  );

  return (
    <Stack
      gap={0}
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cx(classes.root, className)}
      style={style}
    >
      {header !== undefined && !compact && (
        <Group
          gap="xs"
          wrap="nowrap"
          className={cx(classes.measured, classes.inset, classes.panelHeader)}
          data-measuring={(compactProp === undefined && measuring) || undefined}
        >
          {header}
        </Group>
      )}
      <Group
        gap="xs"
        py={compact ? 4 : 6}
        justify="space-between"
        wrap="wrap"
        className={cx(
          classes.measured,
          classes.inset,
          compact && header !== undefined && classes.panelHeader
        )}
        data-measuring={(compactProp === undefined && measuring) || undefined}
        data-compact={compact || undefined}
      >
        {compact && header !== undefined && (
          <Box flex={1} miw={0}>
            {header}
          </Box>
        )}
        {sourceSwitcher}
        <Group gap={compact ? 4 : 'xs'} wrap="nowrap">
          <Tooltip label={<ShortcutHint label={labels.previousFile} keys="k" />} withArrow>
            <ActionIcon
              variant={compact ? 'subtle' : 'default'}
              color={compact ? 'gray' : undefined}
              className={compact ? classes.ghostNav : undefined}
              size="sm"
              aria-label={labels.previousFile}
              disabled={index <= 0}
              onClick={() => go(-1)}
            >
              <IconChevronUp size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={<ShortcutHint label={labels.nextFile} keys="j" />} withArrow>
            <ActionIcon
              variant={compact ? 'subtle' : 'default'}
              color={compact ? 'gray' : undefined}
              className={compact ? classes.ghostNav : undefined}
              size="sm"
              aria-label={labels.nextFile}
              disabled={index === order.length - 1 || order.length === 0}
              onClick={() => go(1)}
            >
              <IconChevronDown size={14} />
            </ActionIcon>
          </Tooltip>
          <Stack gap={2} miw={0}>
            <Text size="xs" c="dimmed" className={classes.counter} aria-live="polite">
              {labels.viewedCount(viewedCount, changes.length)}
            </Text>
            <Progress
              size={compact ? 2 : 3}
              w={compact ? 64 : 96}
              value={changes.length ? (viewedCount / changes.length) * 100 : 0}
              aria-label={labels.viewedCount(viewedCount, changes.length)}
            />
          </Stack>
        </Group>
        {(onAcceptAll || onRejectAll) && (
          <Group gap="xs" wrap="nowrap">
            {onRejectAll && (
              <Button
                size={compact ? 'compact-xs' : 'xs'}
                variant={compact ? 'subtle' : 'default'}
                color={compact ? 'gray' : undefined}
                loading={actions.isPending('rejectAll')}
                disabled={actions.isPending('acceptAll') || changes.length === 0}
                onClick={() => actions.run('rejectAll', onRejectAll)}
              >
                {labels.rejectAll}
              </Button>
            )}
            {onAcceptAll && (
              <Button
                size={compact ? 'compact-xs' : 'xs'}
                variant={compact ? 'light' : undefined}
                loading={actions.isPending('acceptAll')}
                disabled={actions.isPending('rejectAll') || changes.length === 0}
                onClick={() => actions.run('acceptAll', onAcceptAll)}
              >
                {labels.acceptAll}
              </Button>
            )}
          </Group>
        )}
      </Group>
      {actions.error && (
        <Alert
          mx="sm"
          mb="xs"
          color="red"
          variant="light"
          icon={<IconAlertCircle size={16} />}
          withCloseButton
          closeButtonLabel={labels.dismiss}
          onClose={() => actions.clearError()}
        >
          {actions.error}
        </Alert>
      )}
      {header === undefined && <Divider />}
      <Box className={classes.body}>
        <MasterDetail
          listWidth={listWidth}
          breakpoint={breakpoint}
          labels={{ back: labels.back }}
          onBack={() => setDetailOpen(false)}
          detailOpened={detailOpen}
          emptyDetail={
            <EmptyState h="100%" p="xl" icon={<IconFileDiff />} title={labels.selectFile} />
          }
          list={
            <Box py="xs" className={classes.inset}>
              <DiffFileList
                changes={changes}
                compact={compact}
                searchAutofocus={searchAutofocus}
                view={view}
                onViewChange={setView}
                selectedPath={selectedPath}
                onSelect={(change) => {
                  select(change.path);
                  setDetailOpen(true);
                }}
                viewedPaths={viewedPaths}
                decisions={decisions}
                loading={loading}
                error={error}
                onRetry={onRetry}
                labels={labelsProp}
              />
            </Box>
          }
          detail={
            selected ? (
              <Box py="xs" className={classes.inset} ref={topRef}>
                <DiffFileView
                  change={selected}
                  mode={mode}
                  onModeChange={setMode}
                  headerActions={fileActions}
                  highlighter={highlighter}
                  labels={labelsProp}
                />
              </Box>
            ) : null
          }
        />
      </Box>
    </Stack>
  );
});

DiffReview.displayName = 'DiffReview';
