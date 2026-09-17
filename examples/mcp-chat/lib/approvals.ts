import type { ApprovalDecision } from './events';

type Pending = {
  settle: (decision: ApprovalDecision) => void;
};

const globalKey = Symbol.for('ai-kit-example.pending-approvals');
const store = globalThis as unknown as Record<symbol, Map<string, Pending> | undefined>;
const pending: Map<string, Pending> = store[globalKey] ?? new Map();
store[globalKey] = pending;

export function askUser(requestId: string, signal: AbortSignal): Promise<ApprovalDecision> {
  return new Promise<ApprovalDecision>((resolve) => {
    const finish = (decision: ApprovalDecision) => {
      pending.delete(requestId);
      signal.removeEventListener('abort', onAbort);
      resolve(decision);
    };
    const onAbort = () => finish('deny');

    pending.set(requestId, { settle: finish });
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function settleApproval(requestId: string, decision: ApprovalDecision): boolean {
  const entry = pending.get(requestId);
  if (!entry) {
    return false;
  }
  entry.settle(decision);
  return true;
}
