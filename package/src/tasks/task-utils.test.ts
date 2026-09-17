import {
  buildTaskTree,
  canRetryTask,
  canStopTask,
  DEFAULT_BACKGROUND_TASK_LABELS,
  describeHiddenTasks,
  describeTaskSummary,
  getOpenBlockers,
  isRecentlyCompleted,
  limitTasks,
  orderTasksByGroup,
  findParentTask,
  findTask,
  flattenTaskTree,
  getProgressPercent,
  getTaskElapsedMs,
  getTaskGroup,
  getTaskUiStatus,
  matchesTaskQuery,
  summarizeTasks,
} from './task-utils';
import type { BackgroundTask } from './types';

const task = (id: string, extra: Partial<BackgroundTask> = {}): BackgroundTask => ({
  id,
  kind: 'agent',
  title: id,
  status: 'running',
  ...extra,
});

describe('tasks/task-utils', () => {
  it('maps task statuses to the shared vocabulary', () => {
    expect(getTaskUiStatus('queued')).toBe('pending');
    expect(getTaskUiStatus('running')).toBe('running');
    expect(getTaskUiStatus('completed')).toBe('success');
    expect(getTaskUiStatus('failed')).toBe('error');
    expect(getTaskUiStatus('cancelled')).toBe('disabled');
  });

  it('groups statuses and decides available actions', () => {
    expect(getTaskGroup('running')).toBe('running');
    expect(getTaskGroup('queued')).toBe('queued');
    expect(getTaskGroup('failed')).toBe('finished');
    expect(canStopTask(task('a', { status: 'queued' }))).toBe(true);
    expect(canStopTask(task('a', { status: 'completed' }))).toBe(false);
    expect(canRetryTask(task('a', { status: 'cancelled' }))).toBe(true);
    expect(canRetryTask(task('a', { status: 'running' }))).toBe(false);
  });

  it('summarizes statuses and describes the summary', () => {
    const summary = summarizeTasks([
      task('a'),
      task('b'),
      task('c', { status: 'failed' }),
      task('d', { status: 'completed' }),
    ]);
    expect(summary).toEqual({
      total: 4,
      queued: 0,
      running: 2,
      completed: 1,
      failed: 1,
      cancelled: 0,
    });
    expect(describeTaskSummary(summary, DEFAULT_BACKGROUND_TASK_LABELS)).toEqual([
      '2 running',
      '1 failed',
    ]);
    expect(
      describeTaskSummary(
        summarizeTasks([task('a', { status: 'completed' })]),
        DEFAULT_BACKGROUND_TASK_LABELS
      )
    ).toEqual(['1 done']);
    expect(describeTaskSummary(summarizeTasks([]), DEFAULT_BACKGROUND_TASK_LABELS)).toEqual([]);
  });

  it('flattens a tree depth-first and builds it back', () => {
    const tree = [
      task('root', { children: [task('child', { children: [task('grandchild')] })] }),
      task('other'),
    ];
    const flat = flattenTaskTree(tree);
    expect(flat.map((item) => [item.id, item.parentId])).toEqual([
      ['root', undefined],
      ['child', 'root'],
      ['grandchild', 'child'],
      ['other', undefined],
    ]);
    expect(flat.every((item) => item.children === undefined)).toBe(true);

    const rebuilt = buildTaskTree(flat);
    expect(rebuilt.map((item) => item.id)).toEqual(['root', 'other']);
    expect(rebuilt[0].children?.[0].children?.[0].id).toBe('grandchild');
    expect(rebuilt[1].children).toBeUndefined();
  });

  it('treats unknown parents and cycles as roots', () => {
    const roots = buildTaskTree([
      task('orphan', { parentId: 'missing' }),
      task('a', { parentId: 'b' }),
      task('b', { parentId: 'a' }),
    ]);
    expect(roots.map((item) => item.id)).toEqual(['orphan', 'a', 'b']);
  });

  it('finds nested tasks by id', () => {
    const tree = [task('root', { children: [task('child')] })];
    expect(findTask(tree, 'child')?.id).toBe('child');
    expect(findTask(tree, 'none')).toBeUndefined();
    expect(findTask(tree, null)).toBeUndefined();
    expect(findParentTask(tree, 'child')?.id).toBe('root');
    expect(findParentTask(tree, 'root')).toBeUndefined();
  });

  it('computes elapsed time and progress', () => {
    expect(getTaskElapsedMs(task('a'), 1000)).toBeUndefined();
    expect(getTaskElapsedMs(task('a', { startedAt: 1000 }), 4000)).toBe(3000);
    expect(getTaskElapsedMs(task('a', { startedAt: 1000, endedAt: new Date(2500) }), 9000)).toBe(
      1500
    );
    expect(getProgressPercent({ value: 3, max: 12 })).toBe(25);
    expect(getProgressPercent({ value: 140 })).toBe(100);
    expect(getProgressPercent({ value: 1, max: 0 })).toBe(0);
  });

  it('matches title, description and last activity', () => {
    const item = task('a', { title: 'Run tests', lastActivity: 'jest --watch' });
    expect(matchesTaskQuery(item, 'JEST')).toBe(true);
    expect(matchesTaskQuery(item, 'lint')).toBe(false);
    expect(matchesTaskQuery(item, '  ')).toBe(true);
  });

  it('detects tasks completed within the recent window', () => {
    const done = task('a', { status: 'completed', endedAt: 10_000 });
    expect(isRecentlyCompleted(done, 25_000)).toBe(true);
    expect(isRecentlyCompleted(done, 41_000)).toBe(false);
    expect(isRecentlyCompleted(done, 12_000, 1000)).toBe(false);
    expect(isRecentlyCompleted(task('b', { status: 'failed', endedAt: 10_000 }), 11_000)).toBe(
      false
    );
  });

  it('lists unfinished blockers by title', () => {
    const tree = [
      task('build', { title: 'Build', status: 'running' }),
      task('lint', { title: 'Lint', status: 'completed' }),
      task('deploy', { status: 'queued', blockedBy: ['build', 'lint', 'ghost'] }),
    ];
    expect(getOpenBlockers(tree[2], tree)).toEqual(['Build', 'ghost']);
    expect(getOpenBlockers(tree[0], tree)).toEqual([]);
  });

  it('limits tasks in group order and describes the hidden rest', () => {
    const tasks = [
      task('f1', { status: 'completed' }),
      task('q1', { status: 'queued' }),
      task('r1'),
      task('q2', { status: 'queued' }),
      task('r2'),
      task('r3'),
    ];
    expect(orderTasksByGroup(tasks).map((item) => item.id)).toEqual([
      'r1',
      'r2',
      'r3',
      'q1',
      'q2',
      'f1',
    ]);
    const { visible, hidden } = limitTasks(tasks, 2);
    expect(visible.map((item) => item.id)).toEqual(['r1', 'r2']);
    expect(hidden).toEqual({ running: 1, queued: 2, finished: 1 });
    expect(describeHiddenTasks(hidden, DEFAULT_BACKGROUND_TASK_LABELS)).toBe(
      '+1 in progress, 2 pending, 1 done'
    );
    expect(
      describeHiddenTasks({ running: 0, queued: 0, finished: 0 }, DEFAULT_BACKGROUND_TASK_LABELS)
    ).toBe('');
    expect(limitTasks(tasks, 0).visible).toHaveLength(6);
  });
});
