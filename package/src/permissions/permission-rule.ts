import type { PermissionDenial, PermissionRule, WorkspaceDirectory } from './types';

export interface ParsedPermissionRule {
  toolName: string;
  specifier?: string;
}

export interface PermissionRuleValidation {
  /** Parsed rule, `null` when the text has an error */
  rule: ParsedPermissionRule | null;
  /** Blocking problem */
  error: string | null;
  /** Non-blocking problem, for example an unknown tool */
  warning: string | null;
}

export const DEFAULT_PERMISSION_TOOLS = [
  'Bash',
  'Read',
  'Edit',
  'Write',
  'Glob',
  'Grep',
  'WebFetch',
  'WebSearch',
  'NotebookEdit',
  'Task',
];

export const PERMISSION_RULE_EXAMPLES = [
  'Bash(npm run test:*)',
  'Read(src/**)',
  'Edit(docs/**)',
  'WebFetch(domain:git.example.com)',
  'mcp__git',
];

const RULE_PATTERN = /^([^()\s]+)(?:\(([\s\S]*)\))?$/;
const TOOL_NAME_PATTERN = /^[\w-]+$/;
const FILE_TOOLS = new Set(['Read', 'Edit', 'Write', 'Glob', 'Grep', 'NotebookEdit']);
const MCP_PREFIX = 'mcp__';
const SHELL_CONTROL = /[;&|`\r\n]|\$\(/;

export function parseRule(text: string): ParsedPermissionRule | null {
  const match = RULE_PATTERN.exec(text.trim());
  if (!match) {
    return null;
  }
  const [, toolName, specifier] = match;
  return specifier === undefined ? { toolName } : { toolName, specifier };
}

export function formatRule(rule: ParsedPermissionRule): string {
  return rule.specifier ? `${rule.toolName}(${rule.specifier})` : rule.toolName;
}

function isKnownTool(toolName: string, knownTools: readonly string[]): boolean {
  if (knownTools.includes(toolName)) {
    return true;
  }
  if (toolName.startsWith(MCP_PREFIX)) {
    const mcpTools = knownTools.filter((tool) => tool.startsWith(MCP_PREFIX));
    return mcpTools.length === 0 || mcpTools.some((tool) => matchToolName(toolName, tool));
  }
  return false;
}

export function validateRule(
  text: string,
  knownTools?: readonly string[]
): PermissionRuleValidation {
  const trimmed = text.trim();
  const invalid = (error: string): PermissionRuleValidation => ({
    rule: null,
    error,
    warning: null,
  });

  if (!trimmed) {
    return invalid('Enter a rule, for example Bash(npm run test:*)');
  }
  const open = trimmed.indexOf('(');
  const close = trimmed.lastIndexOf(')');
  if (open === -1 && close !== -1) {
    return invalid('Remove the closing parenthesis or add an opening one');
  }
  if (open !== -1 && close === -1) {
    return invalid('Close the parenthesis');
  }
  if (close !== -1 && close !== trimmed.length - 1) {
    return invalid('Nothing can follow the closing parenthesis');
  }
  const rule = parseRule(trimmed);
  if (!rule) {
    return invalid('Use ToolName or ToolName(pattern)');
  }
  if (!TOOL_NAME_PATTERN.test(rule.toolName)) {
    return invalid('Tool names contain only letters, digits, _ and -');
  }
  if (rule.specifier !== undefined && !rule.specifier.trim()) {
    return invalid('Add a pattern inside the parentheses or remove them');
  }
  const warning =
    knownTools && knownTools.length > 0 && !isKnownTool(rule.toolName, knownTools)
      ? `Unknown tool ${rule.toolName}, the rule will not match until such a tool exists`
      : null;
  return { rule, error: null, warning };
}

const BEHAVIOR_VERBS: Record<PermissionRule['behavior'], string> = {
  allow: 'Allow',
  ask: 'Ask before',
  deny: 'Deny',
};

function describeTarget({ toolName, specifier }: ParsedPermissionRule): string {
  if (toolName.startsWith(MCP_PREFIX)) {
    const [server, ...tool] = toolName.slice(MCP_PREFIX.length).split('__');
    return tool.length > 0
      ? `the tool ${tool.join('__')} of the MCP server ${server}`
      : `all tools of the MCP server ${server}`;
  }
  const pattern = specifier?.trim();
  if (!pattern || pattern === '*') {
    return `all ${toolName} calls`;
  }
  if (toolName === 'Bash') {
    if (pattern.endsWith(':*')) {
      return `Bash commands starting with ${pattern.slice(0, -2)}`;
    }
    return pattern.includes('*')
      ? `Bash commands matching ${pattern}`
      : `the Bash command ${pattern}`;
  }
  if (toolName === 'WebFetch' && pattern.startsWith('domain:')) {
    return `WebFetch requests to ${pattern.slice('domain:'.length)}`;
  }
  if (FILE_TOOLS.has(toolName)) {
    return pattern.includes('*')
      ? `${toolName} on files matching ${pattern}`
      : `${toolName} on ${pattern}`;
  }
  return `${toolName} calls matching ${pattern}`;
}

export function describeRule(
  rule: Pick<PermissionRule, 'behavior' | 'toolName' | 'specifier'>
): string {
  return `${BEHAVIOR_VERBS[rule.behavior]} ${describeTarget(rule)}`;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

function matchGlob(pattern: string, input: string, segmentWildcard = '[\\s\\S]*'): boolean {
  const source = pattern
    .split('**')
    .map((part) => part.split('*').map(escapeRegExp).join(segmentWildcard))
    .join('[\\s\\S]*');
  return new RegExp(`^${source}$`).test(input);
}

function hasParentSegment(path: string): boolean {
  return path.split(/[\\/]/).includes('..');
}

function getHostname(input: string): string {
  try {
    return new URL(input).hostname;
  } catch {
    return input;
  }
}

export function matchToolName(ruleToolName: string, toolName: string): boolean {
  if (ruleToolName === toolName) {
    return true;
  }
  return (
    ruleToolName.startsWith(MCP_PREFIX) &&
    !ruleToolName.slice(MCP_PREFIX.length).includes('__') &&
    toolName.startsWith(`${ruleToolName}__`)
  );
}

export function matchRule(
  rule: Pick<PermissionRule, 'toolName' | 'specifier'>,
  toolName: string,
  input: string
): boolean {
  if (!matchToolName(rule.toolName, toolName)) {
    return false;
  }
  const pattern = rule.specifier?.trim();
  if (!pattern) {
    return true;
  }
  const value = input.trim();
  if (toolName === 'Bash' && SHELL_CONTROL.test(value)) {
    return value === pattern;
  }
  if (FILE_TOOLS.has(toolName)) {
    return !hasParentSegment(value) && matchGlob(pattern, value, '[^/]*');
  }
  if (pattern.endsWith(':*')) {
    const prefix = pattern.slice(0, -2).trimEnd();
    return value === prefix || (value.startsWith(prefix) && /\s/.test(value.charAt(prefix.length)));
  }
  if (toolName === 'WebFetch' && pattern.startsWith('domain:')) {
    return matchGlob(pattern.slice('domain:'.length), getHostname(value));
  }
  return matchGlob(pattern, value);
}

export function getBroadRuleWarning(
  rule: Pick<PermissionRule, 'behavior' | 'toolName' | 'specifier'>
): string | null {
  if (rule.behavior !== 'allow') {
    return null;
  }
  const pattern = rule.specifier?.trim();
  if (rule.toolName === 'Bash' && pattern?.endsWith(':*')) {
    const prefix = pattern.slice(0, -2).trim();
    if (prefix && !/\s/.test(prefix)) {
      return `This rule allows every ${prefix} command without asking. Prefer a longer prefix such as Bash(npm run test:*).`;
    }
  }
  if (pattern && pattern !== '*' && pattern !== ':*' && pattern !== '**') {
    return null;
  }
  return `This rule allows every ${rule.toolName} call without asking. Prefer a pattern such as ${
    rule.toolName === 'Bash' ? 'Bash(npm run test:*)' : `${rule.toolName}(src/**)`
  }.`;
}

export function suggestRuleFromDenial(denial: PermissionDenial): ParsedPermissionRule {
  const input = denial.input.trim();
  if (!input) {
    return { toolName: denial.toolName };
  }
  if (denial.toolName === 'Bash') {
    const words = input.split(/\s+/);
    const firstFlag = words.findIndex((word) => word.startsWith('-'));
    const command = words.slice(0, Math.min(3, firstFlag === -1 ? words.length : firstFlag));
    return {
      toolName: 'Bash',
      specifier:
        command.length === words.length || command.length < 2 ? input : `${command.join(' ')}:*`,
    };
  }
  if (denial.toolName === 'WebFetch') {
    return { toolName: 'WebFetch', specifier: `domain:${getHostname(input)}` };
  }
  if (FILE_TOOLS.has(denial.toolName)) {
    return { toolName: denial.toolName, specifier: input };
  }
  return { toolName: denial.toolName };
}

export function validateDirectoryPath(
  path: string,
  directories: readonly WorkspaceDirectory[] = []
): string | null {
  const trimmed = path.trim();
  if (!trimmed) {
    return 'Enter a directory path';
  }
  if (!/^(\/|~\/|~$|[A-Za-z]:[\\/])/.test(trimmed)) {
    return 'Use an absolute path, for example /Users/me/projects/api';
  }
  const normalized = trimmed.replace(/[\\/]+$/, '') || trimmed;
  if (directories.some((directory) => directory.path.replace(/[\\/]+$/, '') === normalized)) {
    return 'This directory is already added';
  }
  return null;
}

export function createPermissionId(): string {
  return `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getToolSuggestions(
  text: string,
  knownTools: readonly string[],
  limit = 8
): string[] {
  const query = text.trim();
  if (query.includes('(')) {
    return [];
  }
  const normalized = query.toLowerCase();
  const matches = knownTools.filter((tool) => tool.toLowerCase().includes(normalized));
  if (matches.length === 1 && matches[0] === query) {
    return [];
  }
  return matches
    .sort(
      (a, b) =>
        Number(!a.toLowerCase().startsWith(normalized)) -
        Number(!b.toLowerCase().startsWith(normalized))
    )
    .slice(0, limit);
}

export function countRulesByBehavior(
  rules: readonly PermissionRule[]
): Record<PermissionRule['behavior'], number> {
  const counts = { allow: 0, ask: 0, deny: 0 };
  for (const rule of rules) {
    counts[rule.behavior] += 1;
  }
  return counts;
}

export function matchesRuleQuery(rule: PermissionRule, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return [formatRule(rule), describeRule(rule), rule.source ?? '']
    .join('\n')
    .toLowerCase()
    .includes(normalized);
}
