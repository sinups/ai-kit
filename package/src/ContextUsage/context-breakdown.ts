import type { MantineColor } from '@mantine/core';

export interface ContextBreakdownItem {
  /** Stable id inside the group */
  id: string;
  /** Item name, for example a tool, an MCP server or a memory file */
  label: string;
  /** Tokens the item takes */
  tokens: number;
  /** Secondary text, for example a file path */
  description?: string;
}

export interface ContextBreakdownGroup {
  /** Stable id, for example `system`, `tools`, `mcpTools`, `agents`, `memory`, `skills`, `messages` */
  id: string;
  /** Group name */
  label: string;
  /** Tokens of the group, the sum of `items` when omitted */
  tokens?: number;
  /** Elements of the group, the group can be expanded when set */
  items?: ContextBreakdownItem[];
  /** Color of the group in the usage bar */
  color?: MantineColor;
}

export type ContextSuggestionSeverity = 'info' | 'warning' | 'critical';

export interface ContextSuggestion {
  /** Stable id, the title is used when omitted */
  id?: string;
  severity: ContextSuggestionSeverity;
  /** What to do, for example `Disable 3 unused MCP servers` */
  title: string;
  /** Why it helps */
  description?: string;
  /** Tokens the suggestion frees */
  savings?: number;
  /** Button that applies the suggestion */
  action?: { label: string; onClick: () => void };
}

export const CONTEXT_GROUP_COLORS: MantineColor[] = [
  'gray',
  'blue',
  'cyan',
  'violet',
  'teal',
  'orange',
  'pink',
  'lime',
];

export function getGroupTokens(group: ContextBreakdownGroup): number {
  if (group.tokens !== undefined) {
    return group.tokens;
  }
  return (group.items ?? []).reduce((sum, item) => sum + Math.max(0, item.tokens), 0);
}

export function getBreakdownTotal(groups: readonly ContextBreakdownGroup[]): number {
  return groups.reduce((sum, group) => sum + Math.max(0, getGroupTokens(group)), 0);
}

/** Items ordered by tokens, largest first, ties keep their order */
export function sortBreakdownItems(items: readonly ContextBreakdownItem[]): ContextBreakdownItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.tokens - a.item.tokens || a.index - b.index)
    .map(({ item }) => item);
}

const SEVERITY_RANK: Record<ContextSuggestionSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/** Critical first, then by savings, largest first */
export function sortSuggestions(suggestions: readonly ContextSuggestion[]): ContextSuggestion[] {
  return [...suggestions].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || (b.savings ?? 0) - (a.savings ?? 0)
  );
}

/** Theme color with a shade that reads in both color schemes, `blue` becomes `blue.6` */
function getColorShade(color: MantineColor): string {
  return color.includes('.') ? color : `${color}.6`;
}

/** CSS variable of a theme color, `blue` and `blue.6` both become `var(--mantine-color-blue-6)` */
export function getColorVar(color: MantineColor): string {
  return `var(--mantine-color-${getColorShade(color).replace('.', '-')})`;
}

export function getGroupShade(group: ContextBreakdownGroup, index: number): string {
  return getColorShade(group.color ?? CONTEXT_GROUP_COLORS[index % CONTEXT_GROUP_COLORS.length]);
}
