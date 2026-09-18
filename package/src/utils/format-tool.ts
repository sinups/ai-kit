import type { ToolPart } from '../types';
import { parsePartialRecord } from './partial-json';

function arePartsEqual(prev: ToolPart, next: ToolPart): boolean {
  if (prev === next) {
    return true;
  }
  return (
    prev.type === next.type &&
    prev.toolCallId === next.toolCallId &&
    prev.state === next.state &&
    prev.input === next.input &&
    prev.output === next.output &&
    prev.errorText === next.errorText
  );
}

/**
 * Props comparator for tool cards wrapped in `React.memo()`.
 * AI SDK v5 `useChat` emits new part objects on every update, so parts are compared
 * by identity of their state, input, output and error text; other props are compared shallowly.
 */
export function areToolPropsEqual<P extends { part: ToolPart; chatStatus?: string }>(
  prevProps: P,
  nextProps: P
): boolean {
  if (!arePartsEqual(prevProps.part, nextProps.part)) {
    return false;
  }
  if (prevProps.chatStatus !== nextProps.chatStatus) {
    return false;
  }
  const prev = prevProps as Record<string, unknown>;
  const next = nextProps as Record<string, unknown>;
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }
  for (const key of prevKeys) {
    if (key === 'part' || key === 'chatStatus') {
      continue;
    }
    if (!Object.hasOwn(next, key) || !Object.is(prev[key], next[key])) {
      return false;
    }
  }
  return true;
}

export type ToolStatus = {
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  isInterrupted: boolean;
};

/** Get tool status from part state */
export function getToolStatus(part: ToolPart, chatStatus?: string): ToolStatus {
  const basePending = part.state !== 'output-available' && part.state !== 'output-error';
  const output = part.output as { success?: boolean } | undefined;
  const isError =
    part.state === 'output-error' ||
    (part.state === 'output-available' && output?.success === false);
  const isSuccess = part.state === 'output-available' && !isError;
  const isPending = basePending && chatStatus === 'streaming';
  const isInterrupted = basePending && chatStatus !== 'streaming' && chatStatus !== undefined;

  return { isPending, isError, isSuccess, isInterrupted };
}

/** Maps AI SDK v5 part state to the legacy three-state model used by tool cards */
export function getLegacyToolState(part: ToolPart): 'partial-call' | 'call' | 'result' {
  if (part.state === 'output-available' || part.state === 'output-error') {
    return 'result';
  }
  if (part.state === 'input-streaming') {
    return 'partial-call';
  }
  return 'call';
}

/** Tool input as an object, tolerating a missing input and one that is still streaming as text */
export function getPartInput(part: ToolPart): Record<string, any> {
  const input = (part.input ?? part.args) as Record<string, any> | undefined;
  if (input && typeof input === 'object') {
    return input;
  }
  return parsePartialRecord(input) ?? {};
}

export function getPartOutput(part: ToolPart): any {
  return part.output ?? part.result;
}
