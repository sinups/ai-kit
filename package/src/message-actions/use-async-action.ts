import { useCallback, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/error-message';

export interface AsyncActionState {
  /** Key of the action whose promise has not settled yet */
  pendingKey: string | null;
  /** Message of the last rejected action */
  error: string | null;
  /** Runs an action and resolves with `true` when it succeeded; ignored while another action is pending */
  run: (key: string, action: () => void | Promise<void>) => Promise<boolean>;
  clearError: () => void;
}

export function useAsyncAction(fallbackError: string): AsyncActionState {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  const run = useCallback(
    async (key: string, action: () => void | Promise<void>) => {
      if (pendingRef.current) {
        return false;
      }
      pendingRef.current = true;
      setError(null);
      setPendingKey(key);
      try {
        await action();
        return true;
      } catch (reason) {
        setError(getErrorMessage(reason, fallbackError));
        return false;
      } finally {
        pendingRef.current = false;
        setPendingKey(null);
      }
    },
    [fallbackError]
  );

  const clearError = useCallback(() => setError(null), []);

  return { pendingKey, error, run, clearError };
}
