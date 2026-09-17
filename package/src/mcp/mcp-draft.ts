import {
  headerKeyValidator,
  envKeyValidator,
  validateKeyValuePairs,
  type KeyValuePair,
} from '../primitives/KeyValueEditor/key-value';
import type { McpServer, McpServerDraft } from './types';

export type McpDraftErrors = Record<string, string>;

export type McpDraftLabels = {
  nameRequired: string;
  nameInvalid: string;
  nameTaken: string;
  commandRequired: string;
  urlRequired: string;
  urlInvalid: string;
};

export const DEFAULT_MCP_DRAFT_LABELS: McpDraftLabels = {
  nameRequired: 'Enter a server name',
  nameInvalid: 'Use letters, digits, dashes and underscores',
  nameTaken: 'A server with this name already exists',
  commandRequired: 'Enter the command that starts the server',
  urlRequired: 'Enter the server URL',
  urlInvalid: 'Enter an http:// or https:// URL',
};

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

export function createMcpServerDraft(server?: McpServer): McpServerDraft {
  return {
    id: server?.id,
    name: server?.name ?? '',
    scope: server?.scope ?? 'user',
    transport: server?.transport ?? 'stdio',
    command: server?.command ?? '',
    args: server?.args ?? [],
    url: server?.url ?? '',
    env: server?.env ?? [],
    headers: server?.headers ?? [],
  };
}

export function isValidMcpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function validateMcpBasics(
  draft: McpServerDraft,
  existingNames: readonly string[] = [],
  labels: McpDraftLabels = DEFAULT_MCP_DRAFT_LABELS
): McpDraftErrors {
  const name = draft.name.trim();
  if (!name) {
    return { name: labels.nameRequired };
  }
  if (!NAME_PATTERN.test(name)) {
    return { name: labels.nameInvalid };
  }
  const lower = name.toLowerCase();
  if (existingNames.some((existing) => existing.toLowerCase() === lower)) {
    return { name: labels.nameTaken };
  }
  return {};
}

export function validateMcpConnection(
  draft: McpServerDraft,
  labels: McpDraftLabels = DEFAULT_MCP_DRAFT_LABELS
): McpDraftErrors {
  if (draft.transport === 'stdio') {
    return draft.command.trim() ? {} : { command: labels.commandRequired };
  }
  if (!draft.url.trim()) {
    return { url: labels.urlRequired };
  }
  return isValidMcpUrl(draft.url) ? {} : { url: labels.urlInvalid };
}

export function getMcpDraftPairsKey(draft: Pick<McpServerDraft, 'transport'>): 'env' | 'headers' {
  return draft.transport === 'stdio' ? 'env' : 'headers';
}

export function validateMcpPairs(draft: McpServerDraft): McpDraftErrors {
  const key = getMcpDraftPairsKey(draft);
  const errors = validateKeyValuePairs(
    draft[key],
    key === 'env' ? envKeyValidator : headerKeyValidator
  );
  const first = Object.values(errors)[0];
  return first ? { [key]: first } : {};
}

export function splitMcpCommandLine(line: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quote: string | null = null;
  let hasToken = false;
  for (const char of line.trim()) {
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
      hasToken = true;
    } else if (/\s/.test(char)) {
      if (hasToken) {
        parts.push(current);
        current = '';
        hasToken = false;
      }
    } else {
      current += char;
      hasToken = true;
    }
  }
  if (hasToken) {
    parts.push(current);
  }
  return parts;
}

function cleanPairs(pairs: KeyValuePair[]): KeyValuePair[] {
  return pairs.map((pair) => ({ ...pair, key: pair.key.trim() })).filter((pair) => pair.key !== '');
}

export function normalizeMcpServerDraft(draft: McpServerDraft): McpServerDraft {
  const isStdio = draft.transport === 'stdio';
  return {
    ...draft,
    name: draft.name.trim(),
    command: isStdio ? draft.command.trim() : '',
    args: isStdio ? draft.args.filter((arg) => arg !== '') : [],
    url: isStdio ? '' : draft.url.trim(),
    env: isStdio ? cleanPairs(draft.env) : [],
    headers: isStdio ? [] : cleanPairs(draft.headers),
  };
}
