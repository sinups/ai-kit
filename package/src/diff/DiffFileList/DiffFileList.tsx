import React, { memo, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  EmptyState,
  Group,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Tooltip,
  Tree,
  useTree,
  VisuallyHidden,
  type RenderTreeNodePayload,
  type TreeNodeData,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconBinaryTree2,
  IconCheck,
  IconChevronRight,
  IconFileDiff,
  IconFolder,
  IconList,
  IconSearch,
} from '@tabler/icons-react';
import { useOverlayAutofocus } from '../../hooks/use-overlay-autofocus';
import { CompactSearch } from '../../primitives/CompactSearch/CompactSearch';
import { EntityList } from '../../primitives/EntityList/EntityList';
import { EntityListItem } from '../../primitives/EntityList/EntityListItem';
import { cx } from '../../utils/cx';
import { DiffStats, FileIcon, FileStatusBadge, getFileStatusLabel } from '../DiffMeta';
import {
  buildFileTree,
  computeFileStats,
  countChangesByStatus,
  filterChanges,
  splitPath,
  type FileTreeNode,
} from '../file-tree';
import { resolveDiffLabels } from '../labels';
import type { DiffLabels, FileChange, FileChangeStatus, FileDecision, FileStats } from '../types';
import classes from './DiffFileList.module.css';

export type DiffFileListView = 'list' | 'tree';

export interface DiffFileListProps {
  /** Changed files */
  changes: FileChange[];
  /** Path of the selected file */
  selectedPath?: string | null;
  /** Called when a file is clicked or chosen with Enter */
  onSelect?: (change: FileChange) => void;
  /** Paths marked as viewed, shown with a check */
  viewedPaths?: string[];
  /** Accept or reject decision per path */
  decisions?: Record<string, FileDecision>;
  /** Layout, controlled */
  view?: DiffFileListView;
  /** Initial layout when uncontrolled, `list` by default */
  defaultView?: DiffFileListView;
  /** Called when the user switches between list and tree */
  onViewChange?: (view: DiffFileListView) => void;
  /** One toolbar row: search behind an icon, ghost status filter and view toggles */
  compact?: boolean;
  /** Marks the search field, or the search button when compact, with `data-autofocus` for an enclosing Drawer or Modal */
  searchAutofocus?: boolean;
  /** Shows skeleton rows */
  loading?: boolean;
  /** Error message shown instead of the files */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetry?: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<DiffLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const STATUS_ORDER: FileChangeStatus[] = ['modified', 'added', 'deleted', 'renamed'];

function toTreeData(nodes: FileTreeNode[]): TreeNodeData[] {
  return nodes.map((node) => ({
    value: node.type === 'folder' ? `folder:${node.path}` : node.path,
    label: node.name,
    children: node.type === 'folder' ? toTreeData(node.children) : undefined,
    nodeProps: { node },
  }));
}

function collectFolderValues(nodes: FileTreeNode[]): string[] {
  return nodes.flatMap((node) =>
    node.type === 'folder' ? [`folder:${node.path}`, ...collectFolderValues(node.children)] : []
  );
}

/** Changed files as a list or a folder tree with status, line counts, search and a status filter */
export const DiffFileList = memo(function DiffFileList({
  changes,
  selectedPath,
  onSelect,
  viewedPaths,
  decisions,
  view: viewProp,
  defaultView = 'list',
  onViewChange,
  compact = false,
  searchAutofocus = false,
  loading,
  error,
  onRetry,
  labels: labelsProp,
  className,
  style,
}: DiffFileListProps) {
  const labels = useMemo(() => resolveDiffLabels(labelsProp), [labelsProp]);
  const [innerView, setInnerView] = useState(defaultView);
  const view = viewProp ?? innerView;
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useOverlayAutofocus(rootRef, searchAutofocus);
  const [selectedStatus, setStatus] = useState<FileChangeStatus | 'all'>('all');

  const statsByPath = useMemo(
    () => new Map(changes.map((change) => [change.path, computeFileStats(change)])),
    [changes]
  );
  const summary = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    for (const stats of statsByPath.values()) {
      additions += stats.additions;
      deletions += stats.deletions;
    }
    return { files: changes.length, additions, deletions };
  }, [statsByPath, changes.length]);
  const statusCounts = useMemo(() => countChangesByStatus(changes), [changes]);
  const statusOptions = STATUS_ORDER.filter((item) => statusCounts[item] > 0);
  const status =
    selectedStatus !== 'all' && statusOptions.length > 1 && statusOptions.includes(selectedStatus)
      ? selectedStatus
      : 'all';
  const visible = useMemo(() => filterChanges(changes, query, status), [changes, query, status]);
  const viewed = useMemo(() => new Set(viewedPaths), [viewedPaths]);

  const changeView = (next: string) => {
    setInnerView(next as DiffFileListView);
    onViewChange?.(next as DiffFileListView);
  };

  const renderBadges = (change: FileChange) => {
    const decision = decisions?.[change.path];
    return (
      <>
        {viewed.has(change.path) && (
          <IconCheck size={14} className={classes.viewed} aria-label={labels.viewed} />
        )}
        {decision && (
          <Badge
            size="xs"
            variant="light"
            color={decision === 'accepted' ? 'green' : 'red'}
            tt="none"
          >
            {decision === 'accepted' ? labels.accepted : labels.rejected}
          </Badge>
        )}
      </>
    );
  };

  let body: React.ReactNode;
  if (loading) {
    body = (
      <Stack gap="xs" aria-busy="true" px="xs">
        {Array.from({ length: 5 }, (_, index) => (
          <Group key={index} gap="sm" wrap="nowrap">
            <Skeleton height={16} width={16} radius="sm" />
            <Skeleton height={10} width={`${50 + ((index * 13) % 35)}%`} radius="sm" />
          </Group>
        ))}
      </Stack>
    );
  } else if (error) {
    body = (
      <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error}</Text>
          {onRetry && (
            <Button size="xs" variant="light" color="red" onClick={onRetry}>
              {labels.retry}
            </Button>
          )}
        </Stack>
      </Alert>
    );
  } else if (changes.length === 0) {
    body = <EmptyState size="sm" py="lg" icon={<IconFileDiff />} title={labels.noFiles} />;
  } else if (visible.length === 0) {
    body = (
      <Text size="sm" c="dimmed" ta="center" py="lg">
        {labels.noMatchingFiles}
      </Text>
    );
  } else if (view === 'tree') {
    body = (
      <FileTree
        changes={visible}
        selectedPath={selectedPath}
        onSelect={onSelect}
        labels={labels}
        renderBadges={renderBadges}
        statsByPath={statsByPath}
      />
    );
  } else {
    body = (
      <EntityList<FileChange>
        items={visible}
        getId={(change) => change.path}
        selectedId={selectedPath}
        onSelect={onSelect}
        ariaLabel={labels.filesChanged(visible.length)}
        renderItem={(change, { selected }) => {
          const { directory, name } = splitPath(change.path);
          const stats = statsByPath.get(change.path) ?? computeFileStats(change);
          return (
            <EntityListItem
              selected={selected}
              icon={<FileIcon path={change.path} />}
              title={
                <Text span inherit td={change.status === 'deleted' ? 'line-through' : undefined}>
                  {name}
                </Text>
              }
              description={
                change.previousPath && change.previousPath !== change.path
                  ? `${change.previousPath} → ${directory || './'}`
                  : directory || undefined
              }
              descriptionLines={1}
              status={
                <FileStatusBadge
                  status={change.status}
                  untracked={change.untracked}
                  label={getFileStatusLabel(change.status, labels, change.untracked)}
                />
              }
              badges={renderBadges(change)}
              meta={
                change.binary ? undefined : (
                  <DiffStats additions={stats.additions} deletions={stats.deletions} />
                )
              }
            />
          );
        }}
      />
    );
  }

  const statusSelectData = [
    { value: 'all', label: `${labels.allStatuses} (${changes.length})` },
    ...statusOptions.map((item) => ({
      value: item,
      label: `${getFileStatusLabel(item, labels)} (${statusCounts[item]})`,
    })),
  ];
  const hasData = changes.length > 0 && !loading && !error;

  const closeSearch = () => {
    setQuery('');
    setSearchOpen(false);
  };

  if (compact) {
    return (
      <Stack
        ref={rootRef}
        gap={4}
        tabIndex={searchAutofocus ? -1 : undefined}
        data-autofocus={searchAutofocus || undefined}
        className={cx(classes.focusTarget, className)}
        style={style}
      >
        <Group gap={4} wrap="nowrap" mih={30}>
          <CompactSearch
            opened={searchOpen}
            onOpen={() => setSearchOpen(true)}
            onClose={closeSearch}
            value={query}
            onChange={setQuery}
            labels={{ search: labels.searchFiles, close: labels.closeSearch }}
          />
          {!searchOpen && (
            <Group gap={6} wrap="nowrap" miw={0} flex={1}>
              {hasData && (
                <>
                  <Text size="xs" c="dimmed" truncate>
                    {labels.filesChanged(summary.files)}
                  </Text>
                  <DiffStats additions={summary.additions} deletions={summary.deletions} />
                </>
              )}
            </Group>
          )}
          {hasData && statusOptions.length > 1 && (
            <Select
              size="xs"
              variant="unstyled"
              w={120}
              aria-label={labels.statusFilter}
              allowDeselect={false}
              value={status}
              onChange={(value) => value && setStatus(value as FileChangeStatus | 'all')}
              data={statusSelectData}
              classNames={{ input: classes.ghostSelect }}
            />
          )}
          <ActionIcon.Group>
            {(['list', 'tree'] as const).map((item) => (
              <Tooltip
                key={item}
                label={item === 'list' ? labels.viewList : labels.viewTree}
                withArrow
              >
                <ActionIcon
                  variant={view === item ? 'light' : 'subtle'}
                  color="gray"
                  size="sm"
                  aria-label={item === 'list' ? labels.viewList : labels.viewTree}
                  aria-pressed={view === item}
                  onClick={() => changeView(item)}
                >
                  {item === 'list' ? <IconList size={14} /> : <IconBinaryTree2 size={14} />}
                </ActionIcon>
              </Tooltip>
            ))}
          </ActionIcon.Group>
        </Group>
        {body}
      </Stack>
    );
  }

  return (
    <Stack ref={rootRef} gap="xs" className={className} style={style}>
      <Group gap="xs" wrap="nowrap">
        <TextInput
          flex={1}
          miw={0}
          size="xs"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder={labels.searchFiles}
          aria-label={labels.searchFiles}
          data-autofocus={searchAutofocus || undefined}
          leftSection={<IconSearch size={14} />}
        />
        <SegmentedControl
          size="xs"
          value={view}
          onChange={changeView}
          data={[
            {
              value: 'list',
              label: (
                <Tooltip label={labels.viewList} withArrow>
                  <Group gap={0} wrap="nowrap" justify="center">
                    <IconList size={14} />
                    <VisuallyHidden>{labels.viewList}</VisuallyHidden>
                  </Group>
                </Tooltip>
              ),
            },
            {
              value: 'tree',
              label: (
                <Tooltip label={labels.viewTree} withArrow>
                  <Group gap={0} wrap="nowrap" justify="center">
                    <IconBinaryTree2 size={14} />
                    <VisuallyHidden>{labels.viewTree}</VisuallyHidden>
                  </Group>
                </Tooltip>
              ),
            },
          ]}
        />
      </Group>
      {hasData && (
        <Group gap="xs" wrap="nowrap" justify="space-between">
          <Group gap={6} wrap="nowrap" miw={0}>
            <Text size="xs" c="dimmed" truncate>
              {labels.filesChanged(summary.files)}
            </Text>
            <DiffStats additions={summary.additions} deletions={summary.deletions} />
          </Group>
          {statusOptions.length > 1 && (
            <Select
              size="xs"
              w={140}
              aria-label={labels.statusFilter}
              allowDeselect={false}
              value={status}
              onChange={(value) => value && setStatus(value as FileChangeStatus | 'all')}
              data={statusSelectData}
            />
          )}
        </Group>
      )}
      {body}
    </Stack>
  );
});

DiffFileList.displayName = 'DiffFileList';

interface FileTreeProps {
  changes: FileChange[];
  selectedPath?: string | null;
  onSelect?: (change: FileChange) => void;
  labels: DiffLabels;
  renderBadges: (change: FileChange) => React.ReactNode;
  statsByPath: ReadonlyMap<string, FileStats>;
}

function FileTree({
  changes,
  selectedPath,
  onSelect,
  labels,
  renderBadges,
  statsByPath,
}: FileTreeProps) {
  const nodes = useMemo(() => buildFileTree(changes), [changes]);
  const data = useMemo(() => toTreeData(nodes), [nodes]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const expandedState = useMemo(() => {
    const state: Record<string, boolean> = {};
    for (const value of collectFolderValues(nodes)) {
      state[value] = !collapsed.has(value);
    }
    return state;
  }, [nodes, collapsed]);

  const tree = useTree({
    expandedState,
    onExpandedStateChange: (state) =>
      setCollapsed(
        new Set(
          Object.entries(state)
            .filter(([, expanded]) => !expanded)
            .map(([value]) => value)
        )
      ),
    selectedState: selectedPath ? [selectedPath] : [],
  });

  const byPath = useMemo(() => new Map(changes.map((change) => [change.path, change])), [changes]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const target = event.target as HTMLElement;
    const change = target.dataset.value ? byPath.get(target.dataset.value) : undefined;
    if (event.key === 'Enter' && target.getAttribute('role') === 'treeitem' && change) {
      event.preventDefault();
      onSelect?.(change);
    }
  };

  const renderNode = ({ node, expanded, selected, elementProps }: RenderTreeNodePayload) => {
    const item = node.nodeProps?.node as FileTreeNode;
    if (item.type === 'folder') {
      return (
        <Group
          {...elementProps}
          gap={6}
          wrap="nowrap"
          className={cx(elementProps.className, classes.node)}
          onClick={(event: React.MouseEvent) => {
            elementProps.onClick(event);
            tree.toggleExpanded(node.value);
          }}
        >
          <ActionIcon
            component="span"
            variant="transparent"
            color="gray"
            size="xs"
            className={classes.chevron}
            data-expanded={expanded || undefined}
            aria-hidden
          >
            <IconChevronRight size={12} />
          </ActionIcon>
          <IconFolder size={16} className={classes.folderIcon} aria-hidden />
          <Text size="sm" c="dimmed" truncate="end" miw={0}>
            {item.name}
          </Text>
        </Group>
      );
    }

    const stats = statsByPath.get(item.path) ?? computeFileStats(item.change);
    return (
      <Group
        {...elementProps}
        gap={6}
        wrap="nowrap"
        className={cx(elementProps.className, classes.node)}
        data-selected={selected || undefined}
        onClick={(event: React.MouseEvent) => {
          elementProps.onClick(event);
          onSelect?.(item.change);
        }}
      >
        <FileIcon path={item.path} />
        <Text
          size="sm"
          truncate="end"
          miw={0}
          flex={1}
          td={item.change.status === 'deleted' ? 'line-through' : undefined}
        >
          {item.name}
        </Text>
        {renderBadges(item.change)}
        <FileStatusBadge
          status={item.change.status}
          untracked={item.change.untracked}
          label={getFileStatusLabel(item.change.status, labels, item.change.untracked)}
        />
        {!item.change.binary && (
          <DiffStats additions={stats.additions} deletions={stats.deletions} />
        )}
      </Group>
    );
  };

  return (
    <Tree
      data={data}
      tree={tree}
      expandOnClick={false}
      levelOffset="sm"
      renderNode={renderNode}
      onKeyDown={handleKeyDown}
      aria-label={labels.filesChanged(changes.length)}
    />
  );
}
