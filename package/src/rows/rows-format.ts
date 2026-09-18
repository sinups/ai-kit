import type { ToolPart } from '../types';
import { isRecord } from '../utils/parts';
import { parseMcpToolType } from '../tools/tool-registry';

const MAX_VALUE_CHARS = 80;

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

function clipValue(value: string): string {
  return value.length > MAX_VALUE_CHARS ? `${value.slice(0, MAX_VALUE_CHARS).trimEnd()}…` : value;
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
      return clipValue(value);
    }
  }

  return Object.entries(input)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${clipValue(textValue(value))}`)
    .join(', ');
}

/** Output of a call as plain text: stdout, the text of an MCP result or pretty JSON */
export function getToolRowOutput(part: ToolPart): string {
  if (part.state === 'output-error' && typeof part.errorText === 'string') {
    return part.errorText;
  }
  const output = part.output ?? part.result;
  if (output === undefined || output === null) {
    return '';
  }
  if (typeof output === 'string') {
    return output;
  }
  if (isRecord(output)) {
    const { stdout, text, message, content } = output as Record<string, unknown>;
    if (typeof stdout === 'string' && stdout.trim()) {
      return stdout;
    }
    if (typeof text === 'string' && text.trim()) {
      return text;
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (Array.isArray(content)) {
      const joined = content
        .map((item) => (isRecord(item) && typeof item.text === 'string' ? item.text : ''))
        .filter(Boolean)
        .join('\n');
      if (joined.trim()) {
        return joined;
      }
    }
  }
  return JSON.stringify(output, null, 2);
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
