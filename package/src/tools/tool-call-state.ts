import type { ChatMessage, MessagePart, ToolPart } from '../types';
import { readCallToolResult } from '../rows/tool-output';
import { isRecord, isV5ToolPart } from '../utils/parts';

/** Visible state of a tool call, derived from the transcript instead of a mutable field */
export type ToolCallState =
  | 'queued'
  | 'awaiting-permission'
  | 'running'
  | 'done'
  | 'error'
  | 'rejected'
  | 'interrupted';

/** Transcript questions a tool card asks about a call id, see `createToolCallLookups` */
export type ToolCallLookups = {
  /** A decision on this call is still open */
  isAwaitingPermission?: (toolCallId: string) => boolean;
  /** The call was refused, by the user or by a permission rule */
  isRejected?: (toolCallId: string) => boolean;
  /** A result for this call arrived, possibly in a later message */
  hasResult?: (toolCallId: string) => boolean;
  /** The call was announced but has not started yet */
  isQueued?: (toolCallId: string) => boolean;
};

export type DeriveToolCallStateOptions = {
  /** Chat status from `useChat()`, used to tell a running call from an interrupted one */
  chatStatus?: string;
  /** Transcript lookups, see `createToolCallLookups` */
  lookups?: ToolCallLookups;
};

export interface ToolCallStateLabels {
  /** Row label of a call that has not started, `Queued` by default */
  queued: string;
  /** Row label of a call waiting for a decision, `Waiting for permission` by default */
  awaitingPermission: string;
  /** Row label of a call the user refused, `Skipped` by default */
  rejected: string;
  /** Row label of a call left without a result when its turn ended, `Interrupted` by default */
  interrupted: string;
  /** Row label of a card that failed to render, `Could not display this tool call` by default */
  renderError: string;
}

export const DEFAULT_TOOL_CALL_STATE_LABELS: ToolCallStateLabels = {
  queued: 'Queued',
  awaitingPermission: 'Waiting for permission',
  rejected: 'Skipped',
  interrupted: 'Interrupted',
  renderError: 'Could not display this tool call',
};

const REJECTION_TEXT = /\b(rejected|denied|declined|refused|not allowed|cancell?ed by user)\b/i;

function getCallId(part: ToolPart): string | undefined {
  return typeof part.toolCallId === 'string' ? part.toolCallId : undefined;
}

function isSettled(part: ToolPart): boolean {
  return part.state === 'output-available' || part.state === 'output-error';
}

function isRejectedPart(part: ToolPart): boolean {
  const output = part.output ?? part.result;
  if (isRecord(output)) {
    if (output.rejected === true || output.denied === true) {
      return true;
    }
    if (typeof output.decision === 'string' && REJECTION_TEXT.test(output.decision)) {
      return true;
    }
    if (typeof output.permission === 'string' && REJECTION_TEXT.test(output.permission)) {
      return true;
    }
  }
  return typeof part.errorText === 'string' && REJECTION_TEXT.test(part.errorText);
}

function isErrorPart(part: ToolPart): boolean {
  if (part.state === 'output-error') {
    return true;
  }
  const output = part.output ?? part.result;
  const result = readCallToolResult(output);
  return result ? result.isError === true : isRecord(output) && output.success === false;
}

/** Reads the permission request a host attached to a tool call, `input.approval` by convention */
function hasOpenApproval(part: ToolPart): boolean {
  const input = part.input;
  if (!isRecord(input) || !isRecord(input.approval)) {
    return false;
  }
  const { decision } = input.approval as { decision?: unknown };
  return decision === undefined || decision === null;
}

/**
 * Resolves the state a tool card shows. `part.state` alone cannot tell a call that waits for a
 * decision from one that is running, and a restored transcript carries its result in another part,
 * so the transcript is asked first and the part state is only the fallback.
 */
export function deriveToolCallState(
  part: ToolPart,
  { chatStatus, lookups }: DeriveToolCallStateOptions = {}
): ToolCallState {
  const callId = getCallId(part);

  if ((callId && lookups?.isRejected?.(callId)) || isRejectedPart(part)) {
    return 'rejected';
  }

  const settled = isSettled(part) || (callId ? Boolean(lookups?.hasResult?.(callId)) : false);
  if (settled) {
    return isErrorPart(part) ? 'error' : 'done';
  }

  if ((callId && lookups?.isAwaitingPermission?.(callId)) || hasOpenApproval(part)) {
    return 'awaiting-permission';
  }

  if (callId && lookups?.isQueued?.(callId)) {
    return 'queued';
  }

  if (part.state === 'input-streaming') {
    return 'running';
  }

  return chatStatus === undefined || chatStatus === 'streaming' || chatStatus === 'submitted'
    ? 'running'
    : 'interrupted';
}

function collectToolParts(
  messages: readonly (ChatMessage | MessagePart)[]
): { part: ToolPart; callId: string }[] {
  const collected: { part: ToolPart; callId: string }[] = [];
  for (const entry of messages) {
    const own = isRecord(entry) ? (entry as Record<string, unknown>).parts : undefined;
    const parts: unknown[] = Array.isArray(own) ? own : [entry];
    for (const part of parts) {
      if (!isV5ToolPart(part)) {
        continue;
      }
      const callId = getCallId(part);
      if (callId) {
        collected.push({ part, callId });
      }
    }
  }
  return collected;
}

/**
 * Indexes a transcript by tool call id. Results are looked up across messages, so a call restored
 * with its result in a later message is never shown as running; among the calls that have neither a
 * result nor an open decision, the first one runs and the ones after it are queued.
 */
export function createToolCallLookups(
  messages: readonly (ChatMessage | MessagePart)[]
): ToolCallLookups {
  const settledIds = new Set<string>();
  const rejectedIds = new Set<string>();
  const awaitingIds = new Set<string>();
  const openIds: string[] = [];

  for (const { part, callId } of collectToolParts(messages)) {
    if (isRejectedPart(part)) {
      rejectedIds.add(callId);
    }
    if (isSettled(part)) {
      settledIds.add(callId);
      continue;
    }
    if (hasOpenApproval(part)) {
      awaitingIds.add(callId);
      continue;
    }
    if (!openIds.includes(callId)) {
      openIds.push(callId);
    }
  }

  const queuedIds = new Set(
    openIds.filter((callId) => !settledIds.has(callId) && !awaitingIds.has(callId)).slice(1)
  );

  return {
    isAwaitingPermission: (callId) => awaitingIds.has(callId) && !settledIds.has(callId),
    isRejected: (callId) => rejectedIds.has(callId),
    hasResult: (callId) => settledIds.has(callId),
    isQueued: (callId) => queuedIds.has(callId),
  };
}
