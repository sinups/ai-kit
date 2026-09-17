import React, { memo, useMemo, useState } from 'react';
import { Box, EmptyState, Group, Stack } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconListDetails } from '@tabler/icons-react';
import { MasterDetail } from '../../primitives/MasterDetail/MasterDetail';
import { TaskDetail } from '../TaskDetail/TaskDetail';
import { TaskList, type TaskAction } from '../TaskList/TaskList';
import { DEFAULT_TASK_LABELS, findParentTask, findTask } from '../task-utils';
import type { BackgroundTask, BackgroundTaskLabels } from '../types';
import { cx } from '../../utils/cx';
import classes from './BackgroundTasksPanel.module.css';

export interface BackgroundTasksPanelProps {
  /** Top-level tasks with nested `children` */
  tasks: BackgroundTask[];
  /** Id of the task shown in the detail, controlled; may point at a subtask */
  selectedId?: string | null;
  /** Initial selected task id when uncontrolled */
  defaultSelectedId?: string | null;
  /** Called when the selected task changes */
  onSelectedIdChange?: (id: string | null) => void;
  /** Stops a queued or running task */
  onStop?: TaskAction;
  /** Retries a failed or cancelled task */
  onRetry?: TaskAction;
  /** Removes a finished task */
  onRemove?: TaskAction;
  /** Shows skeleton rows in the list */
  loading?: boolean;
  /** Error message shown instead of the list */
  error?: React.ReactNode;
  /** Called by the retry button of the error alert */
  onRetryLoad?: () => void;
  /** Sends an instruction to a running agent task from its detail */
  onSteer?: (taskId: string, text: string) => void | Promise<void>;
  /** Shows at most this many tasks in the list with a summary of the rest */
  maxVisible?: number;
  /** Marks the task search input with `data-autofocus` so an enclosing Drawer or Modal focuses it on open */
  searchAutofocus?: boolean;
  /** Content at the start of the first row, on the same inner edge as the list, for example a panel title */
  header?: React.ReactNode;
  /** Ghost list toolbar with the search behind an icon; follows the width when omitted */
  compact?: boolean;
  /** List pane width in px when wide, `340` by default */
  listWidth?: number;
  /** Component width in px from which list and detail sit side by side, `720` by default */
  breakpoint?: number;
  /** Overrides of the default English labels */
  labels?: Partial<BackgroundTaskLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const DEFAULT_BREAKPOINT = 720;

/** Background tasks as list and detail: side by side when wide, stacked with a back action when narrow */
export const BackgroundTasksPanel = memo(function BackgroundTasksPanel({
  tasks,
  selectedId: selectedIdProp,
  defaultSelectedId = null,
  onSelectedIdChange,
  onStop,
  onRetry,
  onRemove,
  loading,
  error,
  onRetryLoad,
  searchAutofocus,
  onSteer,
  maxVisible,
  header,
  compact: compactProp,
  listWidth = 340,
  breakpoint,
  labels: labelsProp,
  className,
  style,
}: BackgroundTasksPanelProps) {
  const { ref, width } = useElementSize<HTMLDivElement>();
  const measuring = compactProp === undefined && width === 0;
  const compact = compactProp ?? width < (breakpoint ?? DEFAULT_BREAKPOINT);
  const labels = useMemo(() => ({ ...DEFAULT_TASK_LABELS, ...labelsProp }), [labelsProp]);
  const [innerSelectedId, setInnerSelectedId] = useState(defaultSelectedId);
  const selectedId = selectedIdProp !== undefined ? selectedIdProp : innerSelectedId;
  const selected = findTask(tasks, selectedId);

  const setSelectedId = (id: string | null) => {
    setInnerSelectedId(id);
    onSelectedIdChange?.(id);
  };

  const rootId = tasks.find((task) => findTask([task], selectedId))?.id ?? null;

  const handleBack = () => {
    setSelectedId(findParentTask(tasks, selectedId)?.id ?? null);
  };

  return (
    <Stack ref={ref} gap={0} className={cx(classes.root, className)} style={style}>
      {header !== undefined && (
        <Group gap="xs" wrap="nowrap" className={cx(classes.inset, classes.panelHeader)}>
          {header}
        </Group>
      )}
      <Box className={classes.body}>
        <MasterDetail
          listWidth={listWidth}
          breakpoint={breakpoint}
          backLabel={labels.back}
          onBack={handleBack}
          emptyDetail={
            <EmptyState
              h="100%"
              p="xl"
              icon={<IconListDetails />}
              title={labels.selectTask}
              description={labels.selectTaskDescription}
            />
          }
          list={
            <Box
              py="sm"
              className={cx(classes.inset, classes.measured)}
              data-measuring={measuring || undefined}
            >
              <TaskList
                tasks={tasks}
                selectedId={rootId}
                onSelect={(task) => setSelectedId(task.id)}
                onStop={onStop}
                onRetry={onRetry}
                onRemove={onRemove}
                loading={loading}
                error={error}
                onRetryLoad={onRetryLoad}
                searchAutofocus={searchAutofocus}
                compact={compact}
                maxVisible={maxVisible}
                labels={labelsProp}
              />
            </Box>
          }
          detail={
            selected ? (
              <TaskDetail
                key={selected.id}
                task={selected}
                onStop={onStop}
                onRetry={onRetry}
                onSteer={onSteer}
                allTasks={tasks}
                onSelectSubtask={(task) => setSelectedId(task.id)}
                labels={labelsProp}
              />
            ) : null
          }
        />
      </Box>
    </Stack>
  );
});

BackgroundTasksPanel.displayName = 'BackgroundTasksPanel';
