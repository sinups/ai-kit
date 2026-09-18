import type { ToolPart } from '../types';
import { countDiffStats, diffLines } from '../utils/line-diff';
import { isRecord } from '../utils/parts';

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function fileName(part: ToolPart): string {
  const input = readRecord(part.input);
  const filePath = typeof input?.file_path === 'string' ? input.file_path : '';
  return filePath.split('/').pop() || filePath;
}

function countLines(text: string): number {
  return text ? text.split('\n').length : 0;
}

export type EditSummary = { file: string; added: number; removed: number };

/** Additions and removals of an `Edit` or `Write` call, `undefined` before the result arrives */
export function getEditSummary(part: ToolPart): EditSummary | undefined {
  if (part.type !== 'tool-Edit' && part.type !== 'tool-Write') {
    return undefined;
  }
  const input = readRecord(part.input);
  const output = readRecord(part.output ?? part.result);
  const oldText =
    typeof output?.old_content === 'string'
      ? output.old_content
      : typeof input?.old_string === 'string'
        ? input.old_string
        : '';
  const newText =
    typeof output?.content === 'string'
      ? output.content
      : typeof input?.new_string === 'string'
        ? input.new_string
        : typeof input?.content === 'string'
          ? input.content
          : '';

  if (!oldText && !newText) {
    return undefined;
  }
  if (part.type === 'tool-Write' && !oldText) {
    return { file: fileName(part), added: countLines(newText), removed: 0 };
  }
  const { added, removed } = countDiffStats(diffLines(oldText, newText));
  return { file: fileName(part), added, removed };
}
