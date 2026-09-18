import {
  EDIT_TOOL_TYPES,
  PATTERN_SEARCH_TOOL_TYPES,
  READ_TOOL_TYPES,
  WEB_SEARCH_TOOL_TYPES,
} from '../tools/tool-kinds';
import type { CollapseToolRunsOptions, ToolPart } from '../types';
import { formatCount } from '../utils/format-count';

export const DEFAULT_COLLAPSIBLE_TOOL_TYPES: readonly string[] = [
  ...READ_TOOL_TYPES,
  ...PATTERN_SEARCH_TOOL_TYPES,
  ...WEB_SEARCH_TOOL_TYPES,
];

export type ResolvedToolRunOptions = {
  minRun: number;
  types: ReadonlySet<string>;
  labels: ToolRunLabels;
};

export function resolveToolRunOptions(
  value: boolean | CollapseToolRunsOptions | undefined,
  labels?: Partial<ToolRunLabels>
): ResolvedToolRunOptions | null {
  if (!value) {
    return null;
  }
  const options = value === true ? {} : value;
  return {
    minRun: Math.max(2, options.minRun ?? 3),
    types: new Set(options.types ?? DEFAULT_COLLAPSIBLE_TOOL_TYPES),
    labels: { ...DEFAULT_TOOL_RUN_LABELS, ...labels },
  };
}

export type ToolRunSegment<T> = { kind: 'single'; item: T } | { kind: 'run'; items: T[] };

/** Splits items into single entries and runs of at least `minRun` consecutive collapsible items */
export function groupToolRuns<T>(
  items: readonly T[],
  isCollapsible: (item: T) => boolean,
  minRun: number
): ToolRunSegment<T>[] {
  const segments: ToolRunSegment<T>[] = [];
  let pending: T[] = [];

  const flush = () => {
    if (pending.length >= minRun) {
      segments.push({ kind: 'run', items: pending });
    } else {
      for (const item of pending) {
        segments.push({ kind: 'single', item });
      }
    }
    pending = [];
  };

  for (const item of items) {
    if (isCollapsible(item)) {
      pending.push(item);
    } else {
      flush();
      segments.push({ kind: 'single', item });
    }
  }
  flush();
  return segments;
}

export interface ToolRunLabels {
  /** Summary phrase for read calls, `read N files` by default */
  reads: (count: number) => string;
  /** Summary phrase for edit calls, `edited N files` by default */
  edits: (count: number) => string;
  /** Summary phrase for pattern searches, `searched N patterns` by default */
  searches: (count: number) => string;
  /** Summary phrase for web searches, `ran N web searches` by default */
  webSearches: (count: number) => string;
  /** Summary phrase for any other tool, `used N tools` by default */
  otherTools: (count: number) => string;
  /** Phrase for the thinking of a folded turn in `quietPresentation`, `thought` by default */
  thought?: string;
  reading: string;
  editing: string;
  searching: string;
  working: string;
}

export const DEFAULT_TOOL_RUN_LABELS: ToolRunLabels = {
  reads: (count) => `read ${formatCount(count, 'file', 'files')}`,
  edits: (count) => `edited ${formatCount(count, 'file', 'files')}`,
  searches: (count) => `searched ${formatCount(count, 'pattern', 'patterns')}`,
  webSearches: (count) => `ran ${formatCount(count, 'web search', 'web searches')}`,
  otherTools: (count) => `used ${formatCount(count, 'tool', 'tools')}`,
  reading: 'Reading...',
  editing: 'Editing...',
  searching: 'Searching...',
  working: 'Working...',
  thought: 'thought',
};

/** First letter of a phrase in upper case, by the rules of the locale */
export function capitalize(phrase: string): string {
  return phrase.charAt(0).toLocaleUpperCase() + phrase.slice(1);
}

type ToolRunCounts = { reads: number; edits: number; searches: number; web: number; other: number };

function countToolRun(parts: readonly ToolPart[]): ToolRunCounts {
  const counts: ToolRunCounts = { reads: 0, edits: 0, searches: 0, web: 0, other: 0 };
  for (const part of parts) {
    if (READ_TOOL_TYPES.has(part.type)) {
      counts.reads += 1;
    } else if (EDIT_TOOL_TYPES.has(part.type)) {
      counts.edits += 1;
    } else if (PATTERN_SEARCH_TOOL_TYPES.has(part.type)) {
      counts.searches += 1;
    } else if (WEB_SEARCH_TOOL_TYPES.has(part.type)) {
      counts.web += 1;
    } else {
      counts.other += 1;
    }
  }
  return counts;
}

/** Summary phrases for a run, for example `Read 3 files` and `searched 2 patterns` */
export function describeToolRunPhrases(
  parts: readonly ToolPart[],
  labels: ToolRunLabels = DEFAULT_TOOL_RUN_LABELS
): string[] {
  const { reads, edits, searches, web, other } = countToolRun(parts);
  const phrases = [
    reads > 0 && labels.reads(reads),
    edits > 0 && labels.edits(edits),
    searches > 0 && labels.searches(searches),
    web > 0 && labels.webSearches(web),
    other > 0 && labels.otherTools(other),
  ].filter((phrase): phrase is string => Boolean(phrase));
  if (phrases.length > 0) {
    phrases[0] = capitalize(phrases[0]);
  }
  return phrases;
}

/** Full summary label for a run, for example `Read 3 files, searched 2 patterns` */
export function describeToolRun(parts: readonly ToolPart[], labels?: ToolRunLabels): string {
  return describeToolRunPhrases(parts, labels).join(', ');
}

/** Shimmer label for a run whose latest call is still running */
export function describePendingToolRun(
  part: ToolPart | undefined,
  labels: ToolRunLabels = DEFAULT_TOOL_RUN_LABELS
): string {
  if (!part) {
    return labels.working;
  }
  if (READ_TOOL_TYPES.has(part.type)) {
    return labels.reading;
  }
  if (EDIT_TOOL_TYPES.has(part.type)) {
    return labels.editing;
  }
  if (PATTERN_SEARCH_TOOL_TYPES.has(part.type) || WEB_SEARCH_TOOL_TYPES.has(part.type)) {
    return labels.searching;
  }
  return labels.working;
}
