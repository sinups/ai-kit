import type { HookActivityStatus } from '../types';

export type HookActivityLabels = {
  running: (event: string) => string;
  done: (event: string, count: number) => string;
  blocked: (event: string) => string;
  error: (event: string) => string;
};

export const DEFAULT_HOOK_ACTIVITY_LABELS: HookActivityLabels = {
  running: (event) => `Running ${event} hooks…`,
  done: (event, count) => `Ran ${count} ${event} ${count === 1 ? 'hook' : 'hooks'}`,
  blocked: (event) => `Blocked by ${event} hook`,
  error: (event) => `${event} hook failed`,
};

export function getHookActivityTitle(
  event: string,
  status: HookActivityStatus,
  hookCount: number,
  labels: HookActivityLabels = DEFAULT_HOOK_ACTIVITY_LABELS
): string {
  switch (status) {
    case 'running':
      return labels.running(event);
    case 'blocked':
      return labels.blocked(event);
    case 'error':
      return labels.error(event);
    default:
      return labels.done(event, hookCount);
  }
}
