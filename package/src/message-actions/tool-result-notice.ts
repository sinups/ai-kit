import type { ToolPart } from '../types';
import type { ToolResultNoticeVariant } from './types';

/** Tool name from `tool-<Name>` or `dynamic-tool` parts */
export function getToolName(part: ToolPart): string {
  if (typeof part.toolName === 'string' && part.toolName) {
    return part.toolName;
  }
  return part.type.startsWith('tool-') ? part.type.slice(5) : part.type;
}

/**
 * Notice variant of a tool call that did not complete: `output-denied` is a rejected approval,
 * `output-error` is an error, a call left without output after the chat stopped is interrupted.
 * Returns `null` for calls that completed or are still running.
 */
export function getToolResultNoticeVariant(
  part: ToolPart,
  chatStatus?: string
): ToolResultNoticeVariant | null {
  if (part.state === 'output-denied') {
    return 'rejected';
  }
  if (part.state === 'output-error') {
    return 'error';
  }
  if (part.state === 'output-cancelled') {
    return 'cancelled';
  }
  if (part.state === 'output-available') {
    return null;
  }
  const chatStopped = chatStatus === 'ready' || chatStatus === 'error';
  return chatStopped ? 'interrupted' : null;
}
