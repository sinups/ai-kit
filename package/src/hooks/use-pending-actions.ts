import { useCallback, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/error-message';

export interface PendingActionOptions {
  /** Rethrows the rejection instead of storing it in `error`, for callers that show it themselves */
  rethrow?: boolean;
  /** Skips the action while any other key is still running, for mutually exclusive actions */
  exclusive?: boolean;
}

/** Action tracked by `usePendingActions` */
export type PendingAction = () => void | Promise<void>;

/** Signature of `run` */
export type RunPendingAction = (
  key: string,
  action: PendingAction,
  options?: PendingActionOptions
) => Promise<void>;

/** Signature of `tryRun` */
export type TryRunPendingAction = (
  key: string,
  action: PendingAction,
  options?: PendingActionOptions
) => Promise<boolean>;

export interface UsePendingActionsReturn {
  /** Whether an action with the key is running, or any action when called without a key */
  isPending: (key?: string) => boolean;
  /** Runs an action once per key at a time and tracks its pending state */
  run: RunPendingAction;
  /**
   * Runs the action like `run` and resolves with `true` when it settled without throwing, `false`
   * when it rejected or was skipped, for callers that continue only after a success
   */
  tryRun: TryRunPendingAction;
  /** Message of the last rejected action */
  error: string | null;
  /** Message of the last rejection of the action with the key, cleared when it runs again */
  getError: (key: string) => string | null;
  /** Clears `error` and every per-key error, or only the error of `key` when given */
  clearError: (key?: string) => void;
}

function omitKey(record: Readonly<Record<string, string>>, key: string) {
  if (!(key in record)) {
    return record;
  }
  const next = { ...record };
  delete next[key];
  return next;
}

/** Pending state and error of per-item async actions such as delete or toggle */
export function usePendingActions(fallbackError = 'Something went wrong'): UsePendingActionsReturn {
  const pendingRef = useRef(new Set<string>());
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});

  const update = (key: string, active: boolean) => {
    if (active) {
      pendingRef.current.add(key);
    } else {
      pendingRef.current.delete(key);
    }
    setPending(new Set(pendingRef.current));
  };

  const tryRun = useCallback<TryRunPendingAction>(
    async (key, action, options) => {
      if (pendingRef.current.has(key) || (options?.exclusive && pendingRef.current.size > 0)) {
        return false;
      }
      update(key, true);
      setError(null);
      setErrors((current) => omitKey(current, key));
      try {
        await action();
        return true;
      } catch (reason) {
        if (options?.rethrow) {
          throw reason;
        }
        const message = getErrorMessage(reason, fallbackError);
        setError(message);
        setErrors((current) => ({ ...current, [key]: message }));
        return false;
      } finally {
        update(key, false);
      }
    },
    [fallbackError]
  );

  const run = useCallback<RunPendingAction>(
    async (key, action, options) => {
      await tryRun(key, action, options);
    },
    [tryRun]
  );

  const isPending = useCallback(
    (key?: string) => (key === undefined ? pending.size > 0 : pending.has(key)),
    [pending]
  );
  const getError = useCallback((key: string) => errors[key] ?? null, [errors]);
  const clearError = useCallback((key?: string) => {
    if (key === undefined) {
      setError(null);
      setErrors({});
    } else {
      setErrors((current) => omitKey(current, key));
    }
  }, []);

  return { isPending, run, tryRun, error, getError, clearError };
}
