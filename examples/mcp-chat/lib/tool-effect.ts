const READ_VERBS = new Set([
  'get',
  'list',
  'read',
  'search',
  'find',
  'query',
  'fetch',
  'view',
  'describe',
  'show',
  'count',
  'lookup',
  'browse',
  'inspect',
  'preview',
]);

const NEUTRAL_WORDS = new Set([
  'a',
  'all',
  'allowed',
  'by',
  'content',
  'contents',
  'details',
  'dir',
  'directories',
  'directory',
  'doc',
  'docs',
  'documentation',
  'file',
  'files',
  'for',
  'in',
  'info',
  'library',
  'libraries',
  'many',
  'metadata',
  'multiple',
  'of',
  'one',
  'page',
  'pages',
  'repo',
  'repos',
  'repository',
  'resource',
  'resources',
  'schema',
  'status',
  'structure',
  'text',
  'tree',
  'wiki',
]);

/**
 * Whether a tool only reads, judged by its name alone: every word is a reading verb or a neutral
 * noun and at least one is a verb. Anything unknown counts as a write, because a wrong "read" runs
 * a change without asking, while a wrong "write" only asks once too often.
 */
export function isReadOnlyName(toolName: string): boolean {
  const words = toolName
    .replace(/^mcp__.+?__/, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) {
    return false;
  }
  return (
    words.some((word) => READ_VERBS.has(word)) &&
    words.every((word) => READ_VERBS.has(word) || NEUTRAL_WORDS.has(word))
  );
}
