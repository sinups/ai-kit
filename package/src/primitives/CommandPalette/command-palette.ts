import type React from 'react';
import { fuzzyFilter, type FuzzyKey } from './fuzzy';

export interface PaletteCommand {
  /** Unique command id */
  id: string;
  /** Command name, matched by the search and highlighted */
  label: string;
  /** Secondary text, also matched by the search */
  description?: string;
  /** Group header the command is listed under */
  group?: string;
  /** Icon rendered before the label */
  icon?: React.ReactNode;
  /** Shortcut shown on the right, for example `mod+shift+P` */
  shortcut?: string;
  /** Extra words matched by the search but not displayed */
  keywords?: string[];
  /** Shows the command but prevents running it */
  disabled?: boolean;
  /** Called when the command runs */
  onSelect?: () => void;
}

export interface PaletteEntry {
  /** Unique option id inside the palette, a command may appear both in recent and in its group */
  key: string;
  command: PaletteCommand;
  labelIndices: number[];
}

export interface PaletteSection {
  key: string;
  label?: string;
  entries: PaletteEntry[];
}

export const PALETTE_SEARCH_KEYS: FuzzyKey<PaletteCommand>[] = ['label', 'keywords', 'description'];

function groupSections(
  commands: { command: PaletteCommand; labelIndices: number[] }[],
  prefix: string
): PaletteSection[] {
  const sections = new Map<string, PaletteSection>();
  for (const { command, labelIndices } of commands) {
    const group = command.group ?? '';
    let section = sections.get(group);
    if (!section) {
      section = { key: `${prefix}:${group}`, label: command.group, entries: [] };
      sections.set(group, section);
    }
    section.entries.push({ key: `${prefix}:${command.id}`, command, labelIndices });
  }
  return [...sections.values()];
}

export function buildPaletteSections(
  commands: PaletteCommand[],
  query: string,
  recentIds: string[] = [],
  recentLabel = 'Recent'
): PaletteSection[] {
  if (query.trim()) {
    const results = fuzzyFilter(commands, query, PALETTE_SEARCH_KEYS);
    return groupSections(
      results.map((result) => ({ command: result.item, labelIndices: result.matches[0] ?? [] })),
      'result'
    );
  }

  const byId = new Map(commands.map((command) => [command.id, command]));
  const recent = recentIds
    .map((id) => byId.get(id))
    .filter((command): command is PaletteCommand => !!command);

  const sections: PaletteSection[] = [];
  if (recent.length > 0) {
    sections.push({
      key: 'recent',
      label: recentLabel,
      entries: recent.map((command) => ({
        key: `recent:${command.id}`,
        command,
        labelIndices: [],
      })),
    });
  }
  return sections.concat(
    groupSections(
      commands.map((command) => ({ command, labelIndices: [] })),
      'all'
    )
  );
}
