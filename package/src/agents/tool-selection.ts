import { fuzzyFilter, type FuzzyKey } from '../primitives/CommandPalette/fuzzy';
import type { ToolCatalogItem } from './types';

export interface ToolGroup {
  name: string;
  tools: ToolCatalogItem[];
}

export type GroupCheckState = 'checked' | 'indeterminate' | 'unchecked';

const TOOL_SEARCH_KEYS: FuzzyKey<ToolCatalogItem>[] = [
  'name',
  (tool) => tool.title,
  'group',
  (tool) => tool.description,
];

/** Groups tools in order of first appearance, keeping the catalog order inside each group */
export function groupToolCatalog(catalog: readonly ToolCatalogItem[]): ToolGroup[] {
  const groups = new Map<string, ToolCatalogItem[]>();
  for (const tool of catalog) {
    const bucket = groups.get(tool.group);
    if (bucket) {
      bucket.push(tool);
    } else {
      groups.set(tool.group, [tool]);
    }
  }
  return [...groups].map(([name, tools]) => ({ name, tools }));
}

/** Tools matching the query by name, title, group or description; a blank query keeps the catalog order */
export function searchToolCatalog(catalog: ToolCatalogItem[], query: string): ToolCatalogItem[] {
  if (!query.trim()) {
    return catalog;
  }
  const matched = new Set(
    fuzzyFilter(catalog, query, TOOL_SEARCH_KEYS).map((result) => result.item)
  );
  return catalog.filter((tool) => matched.has(tool));
}

export function getGroupCheckState(
  tools: readonly ToolCatalogItem[],
  selected: readonly string[]
): GroupCheckState {
  const count = tools.filter((tool) => selected.includes(tool.name)).length;
  if (count === 0) {
    return 'unchecked';
  }
  return count === tools.length ? 'checked' : 'indeterminate';
}

export function toggleTool(selected: readonly string[], name: string, checked: boolean): string[] {
  if (checked) {
    return selected.includes(name) ? [...selected] : [...selected, name];
  }
  return selected.filter((item) => item !== name);
}

/** Selects every tool of the group when `checked`, removes them otherwise */
export function toggleToolGroup(
  selected: readonly string[],
  tools: readonly ToolCatalogItem[],
  checked: boolean
): string[] {
  const names = tools.map((tool) => tool.name);
  if (!checked) {
    return selected.filter((name) => !names.includes(name));
  }
  return [...selected, ...names.filter((name) => !selected.includes(name))];
}
