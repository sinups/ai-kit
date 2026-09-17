import { useCallback, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/error-message';

export interface PendingActionOptions {
  /** Rethrows the rejection instead of storing it in `error`, for callers that show it themselves */
  rethrow?: boolean;
}

export interface UsePendingActionsReturn {
  /** Whether an action with the key is running */
  isPending: (key: string) => boolean;
  /** Runs an action once per key at a time and tracks its pending state */
  run: (
    key: string,
    action: () => void | Promise<void>,
    options?: PendingActionOptions
  ) => Promise<void>;
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

  const run = useCallback(
    async (key: string, action: () => void | Promise<void>, options?: PendingActionOptions) => {
      if (pendingRef.current.has(key)) {
        return;
      }
      update(key, true);
      setError(null);
      setErrors((current) => omitKey(current, key));
      try {
        await action();
      } catch (reason) {
        if (options?.rethrow) {
          throw reason;
        }
        const message = getErrorMessage(reason, fallbackError);
        setError(message);
        setErrors((current) => ({ ...current, [key]: message }));
      } finally {
        update(key, false);
      }
    },
    [fallbackError]
  );

  const isPending = useCallback((key: string) => pending.has(key), [pending]);
  const getError = useCallback((key: string) => errors[key] ?? null, [errors]);
  const clearError = useCallback((key?: string) => {
    if (key === undefined) {
      setError(null);
      setErrors({});
    } else {
      setErrors((current) => omitKey(current, key));
    }
  }, []);

  return { isPending, run, error, getError, clearError };
}
