import type { ApprovalChoice } from './events';

type Pending = {
  settle: (choice: ApprovalChoice) => void;
};

const globalKey = Symbol.for('ai-kit-example.pending-approvals');
const store = globalThis as unknown as Record<symbol, Map<string, Pending> | undefined>;
const pending: Map<string, Pending> = store[globalKey] ?? new Map();
store[globalKey] = pending;

export function askUser(requestId: string, signal: AbortSignal): Promise<ApprovalChoice> {
  return new Promise<ApprovalChoice>((resolve) => {
    const finish = (choice: ApprovalChoice) => {
      pending.delete(requestId);
      signal.removeEventListener('abort', onAbort);
      resolve(choice);
    };
    const onAbort = () => finish('deny');

    pending.set(requestId, { settle: finish });
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function settleApproval(requestId: string, choice: ApprovalChoice): boolean {
  const entry = pending.get(requestId);
  if (!entry) {
    return false;
  }
  entry.settle(choice);
  return true;
}
