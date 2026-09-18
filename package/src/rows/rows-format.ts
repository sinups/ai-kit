import type { ToolPart } from '../types';
import { isRecord } from '../utils/parts';
import { parseMcpToolType } from '../tools/tool-registry';
import { clipText } from './tool-output';

/** Bare tool name of a call, `Read`, `Bash`, `search_tasks` for an MCP call */
export function getToolRowName(part: ToolPart): string {
  const mcpInfo = parseMcpToolType(part.type);
  if (mcpInfo) {
    return mcpInfo.toolName;
  }
  if (typeof part.toolName === 'string' && part.type === 'dynamic-tool') {
    return part.toolName;
  }
  return part.type.startsWith('tool-') ? part.type.slice(5) : part.type;
}

function readInput(part: ToolPart): Record<string, unknown> | undefined {
  return isRecord(part.input) ? part.input : undefined;
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Arguments as the row shows them in brackets. Each value is clipped on its own, so a long
 * argument never eats the ones after it; the single-argument tools show the value alone.
 */
export function getToolRowArgs(part: ToolPart): string {
  const input = readInput(part);
  if (!input) {
    return '';
  }

  const single = ['file_path', 'path', 'command', 'pattern', 'url', 'query', 'prompt'];
  for (const key of single) {
    const value = input[key];
    if (typeof value === 'string' && value) {
      return clipText(value);
    }
  }

  return Object.entries(input)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${clipText(textValue(value))}`)
    .join(', ');
}

export type ClampedText = {
  /** Lines shown above the fold */
  text: string;
  /** How many lines were left out */
  hidden: number;
};

/** First `maxLines` lines of the text and how many stayed behind */
export function clampLines(text: string, maxLines: number): ClampedText {
  const lines = text.trimEnd().split('\n');
  if (lines.length <= maxLines) {
    return { text: lines.join('\n'), hidden: 0 };
  }
  return { text: lines.slice(0, maxLines).join('\n'), hidden: lines.length - maxLines };
}
