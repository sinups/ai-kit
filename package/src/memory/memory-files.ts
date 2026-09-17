import type { MemoryFile, MemoryScope } from './types';

export const MEMORY_SCOPE_ORDER: MemoryScope[] = ['user', 'project', 'local', 'agent'];

export const MEMORY_SCOPE_LABELS: Record<MemoryScope, string> = {
  user: 'User',
  project: 'Project',
  local: 'Local',
  agent: 'Agent',
};

export function getMemoryFileName(path: string): string {
  const segments = path.split(/[\\/]/).filter(Boolean);
  return segments[segments.length - 1] ?? path;
}

export function sortMemoryFiles(files: MemoryFile[]): MemoryFile[] {
  return [...files].sort((a, b) => {
    const scope = MEMORY_SCOPE_ORDER.indexOf(a.scope) - MEMORY_SCOPE_ORDER.indexOf(b.scope);
    if (scope !== 0) {
      return scope;
    }
    return (a.agentName ?? '').localeCompare(b.agentName ?? '') || a.path.localeCompare(b.path);
  });
}

export function matchesMemoryQuery(file: MemoryFile, query: string): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return true;
  }
  const haystack = `${file.path}\n${file.agentName ?? ''}\n${file.content}`.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

export function formatMemoryUpdatedAt(
  updatedAt: string | undefined,
  now: number,
  locale?: string
): string | null {
  if (!updatedAt) {
    return null;
  }
  const time = new Date(updatedAt).getTime();
  if (Number.isNaN(time)) {
    return null;
  }
  const seconds = Math.round((time - now) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) {
      return format.format(Math.trunc(seconds / size), unit);
    }
  }
  return format.format(0, 'minute');
}
