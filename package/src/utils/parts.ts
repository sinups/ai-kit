import type { ErrorPart, TextPart, ToolPart } from '../types';

/** Non-null object check, narrows to a string-keyed record */
export function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

/** `{ type: 'text', text: string }` */
export function isTextPart(part: unknown): part is TextPart {
  return isRecord(part) && part.type === 'text' && typeof part.text === 'string';
}

/** `{ type: 'error', message: string }` */
export function isErrorPart(part: unknown): part is ErrorPart {
  return isRecord(part) && part.type === 'error' && typeof part.message === 'string';
}

/** AI SDK v5 tool part: `tool-<Name>` or `dynamic-tool` */
export function isV5ToolPart(part: unknown): part is ToolPart {
  if (!isRecord(part)) {
    return false;
  }
  const partType = part.type;
  return (
    partType === 'dynamic-tool' || (typeof partType === 'string' && partType.startsWith('tool-'))
  );
}
