export const READ_TOOL_TYPES: ReadonlySet<string> = new Set(['tool-Read']);
export const EDIT_TOOL_TYPES: ReadonlySet<string> = new Set(['tool-Edit', 'tool-Write']);
export const FILE_TOOL_TYPES: ReadonlySet<string> = new Set([
  ...READ_TOOL_TYPES,
  ...EDIT_TOOL_TYPES,
]);
export const PATTERN_SEARCH_TOOL_TYPES: ReadonlySet<string> = new Set([
  'tool-Search',
  'tool-Grep',
  'tool-Glob',
]);
export const WEB_SEARCH_TOOL_TYPES: ReadonlySet<string> = new Set(['tool-WebSearch']);
export const SEARCH_TOOL_TYPES: ReadonlySet<string> = new Set([
  ...PATTERN_SEARCH_TOOL_TYPES,
  ...WEB_SEARCH_TOOL_TYPES,
]);
export const COMMAND_TOOL_TYPES: ReadonlySet<string> = new Set(['tool-Bash']);
