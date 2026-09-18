/**
 * State of a single exclusive async action.
 *
 * @deprecated Use `UsePendingActionsReturn` from `usePendingActions`, which tracks the same state
 * per key and takes `{ exclusive: true }` for actions that must not overlap.
 */
export interface AsyncActionState {
  /** Key of the action whose promise has not settled yet */
  pendingKey: string | null;
  /** Message of the last rejected action */
  error: string | null;
  /** Runs an action and resolves with `true` when it succeeded; ignored while another action is pending */
  run: (key: string, action: () => void | Promise<void>) => Promise<boolean>;
  clearError: () => void;
}
