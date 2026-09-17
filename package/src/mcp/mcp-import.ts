import { createMcpServerDraft, MCP_DRAFT_LABELS, validateMcpBasics } from './mcp-draft';
import type { McpConfigWarning, McpServerCandidate } from './types';

export function resolveImportNames(
  candidates: readonly McpServerCandidate[],
  existingNames: readonly string[] = []
): Record<string, string> {
  const taken = new Set(existingNames.map((name) => name.toLowerCase()));
  const names: Record<string, string> = {};
  for (const candidate of candidates) {
    const base = candidate.name.trim();
    let name = base;
    for (let suffix = 1; taken.has(name.toLowerCase()); suffix += 1) {
      name = `${base}_${suffix}`;
    }
    taken.add(name.toLowerCase());
    names[candidate.id] = name;
  }
  return names;
}

export type McpImportNameLabels = {
  nameRequired: string;
  nameInvalid: string;
  nameTaken: string;
  nameDuplicate: string;
};

export const MCP_IMPORT_NAME_LABELS: McpImportNameLabels = {
  nameRequired: MCP_DRAFT_LABELS.nameRequired,
  nameInvalid: MCP_DRAFT_LABELS.nameInvalid,
  nameTaken: MCP_DRAFT_LABELS.nameTaken,
  nameDuplicate: 'Another imported server uses this name',
};

export function validateImportNames(
  selectedIds: readonly string[],
  names: Readonly<Record<string, string>>,
  existingNames: readonly string[] = [],
  labels: McpImportNameLabels = MCP_IMPORT_NAME_LABELS
): Record<string, string> {
  const errors: Record<string, string> = {};
  const seen = new Set<string>();
  for (const id of selectedIds) {
    const name = (names[id] ?? '').trim();
    const draftErrors = validateMcpBasics({ ...createMcpServerDraft(), name }, existingNames, {
      ...MCP_DRAFT_LABELS,
      ...labels,
    });
    if (draftErrors.name) {
      errors[id] = draftErrors.name;
      continue;
    }
    const key = name.toLowerCase();
    if (seen.has(key)) {
      errors[id] = labels.nameDuplicate;
    } else {
      seen.add(key);
    }
  }
  return errors;
}

export type McpConfigWarningGroup = {
  file: string;
  warnings: McpConfigWarning[];
};

function warningKey(warning: McpConfigWarning): string {
  return JSON.stringify([warning.file, warning.path ?? '', warning.kind, warning.message]);
}

export function groupConfigWarnings(
  warnings: readonly McpConfigWarning[]
): McpConfigWarningGroup[] {
  const groups = new Map<string, McpConfigWarning[]>();
  const seen = new Set<string>();
  for (const warning of warnings) {
    const key = warningKey(warning);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const bucket = groups.get(warning.file);
    if (bucket) {
      bucket.push(warning);
    } else {
      groups.set(warning.file, [warning]);
    }
  }
  return [...groups].map(([file, items]) => ({ file, warnings: items }));
}
