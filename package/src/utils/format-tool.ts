import type { ToolPart } from '../types';

type CachedToolState = {
  state: string | undefined;
  inputJson: string;
  outputJson: string;
};

/**
 * Tool state cache for detecting AI SDK in-place mutations.
 * AI SDK mutates objects in-place during streaming, so state is cached externally
 * and compared against cached values.
 */
const toolStateCache = new Map<string, CachedToolState>();

function getToolStateSnapshot(part: ToolPart): CachedToolState {
  return {
    state: part.state,
    inputJson: JSON.stringify(part.input || {}),
    outputJson: JSON.stringify(part.output || {}),
  };
}

function hasToolStateChanged(toolCallId: string, part: ToolPart): boolean {
  const cached = toolStateCache.get(toolCallId);
  const current = getToolStateSnapshot(part);

  if (!cached) {
    toolStateCache.set(toolCallId, current);
    return true;
  }

  const changed =
    cached.state !== current.state ||
    cached.inputJson !== current.inputJson ||
    cached.outputJson !== current.outputJson;

  if (changed) {
    toolStateCache.set(toolCallId, current);
  }

  return changed;
}

function arePartsEqual(prev: ToolPart, next: ToolPart): boolean {
  if (prev.toolCallId !== next.toolCallId) {
    return false;
  }
  if (prev.type !== next.type) {
    return false;
  }

  const toolCallId = next.toolCallId;
  if (!toolCallId) {
    return prev.state === next.state;
  }

  return !hasToolStateChanged(toolCallId, next);
}

function isToolCompleted(part: ToolPart): boolean {
  if (part.output !== undefined && part.output !== null) {
    return true;
  }
  if (part.state === 'error') {
    return true;
  }
  if (part.state === 'result') {
    return true;
  }
  return false;
}

/** Deep compare function for tool part props. Used with `React.memo()`. */
export function areToolPropsEqual(
  prevProps: { part: ToolPart; chatStatus?: string },
  nextProps: { part: ToolPart; chatStatus?: string }
): boolean {
  const partsEqual = arePartsEqual(prevProps.part, nextProps.part);
  if (!partsEqual) {
    return false;
  }
  if (isToolCompleted(nextProps.part)) {
    return true;
  }
  if (prevProps.chatStatus !== nextProps.chatStatus) {
    return false;
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
  if (part.state === 'output-available') {
    return 'result';
  }
  if (part.state === 'input-streaming') {
    return 'partial-call';
  }
  return 'call';
}

export function getPartInput(part: ToolPart): Record<string, any> {
  const input = (part.input ?? part.args) as Record<string, any> | undefined;
  return input && typeof input === 'object' ? input : {};
}

export function getPartOutput(part: ToolPart): any {
  return part.output ?? part.result;
}
