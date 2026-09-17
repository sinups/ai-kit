import type { PaletteCommand } from '../primitives/CommandPalette/command-palette';
import type { FuzzyKey } from '../primitives/CommandPalette/fuzzy';
import type { CommandHelpItem, ShortcutHelpItem } from './types';

export function getCommandName(command: Pick<CommandHelpItem, 'name'>): string {
  return command.name.replace(/^\//, '');
}

/** `/name args` as typed in the composer */
export function formatCommandUsage(command: Pick<CommandHelpItem, 'name' | 'args'>): string {
  const args = command.args?.trim();
  return args ? `/${getCommandName(command)} ${args}` : `/${getCommandName(command)}`;
}

export const COMMAND_SEARCH_KEYS: FuzzyKey<CommandHelpItem>[] = [
  (command) => getCommandName(command),
  'description',
  'group',
];

export const SHORTCUT_SEARCH_KEYS: FuzzyKey<ShortcutHelpItem>[] = [
  'description',
  (shortcut) => (Array.isArray(shortcut.keys) ? shortcut.keys.join('+') : shortcut.keys),
  'group',
];

export type HelpGroup<T> = { group: string | undefined; items: T[] };

/** Groups items in order of first appearance, items without a group first */
export function groupHelpItems<T extends { group?: string }>(items: T[]): HelpGroup<T>[] {
  const ungrouped: T[] = [];
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (item.group === undefined) {
      ungrouped.push(item);
      continue;
    }
    const list = groups.get(item.group);
    if (list) {
      list.push(item);
    } else {
      groups.set(item.group, [item]);
    }
  }
  const result: HelpGroup<T>[] = ungrouped.length ? [{ group: undefined, items: ungrouped }] : [];
  for (const [group, list] of groups) {
    result.push({ group, items: list });
  }
  return result;
}

/** Slash commands as `CommandPalette` commands; `onRun` receives the command picked in the palette */
export function toPaletteCommands(
  commands: CommandHelpItem[],
  onRun?: (command: CommandHelpItem) => void
): PaletteCommand[] {
  return commands.map((command) => {
    const name = getCommandName(command);
    return {
      id: `command:${name}`,
      label: `/${name}`,
      description: command.description,
      group: command.group,
      shortcut: command.shortcut,
      keywords: command.args ? [name, command.args] : [name],
      onSelect: onRun ? () => onRun(command) : undefined,
    };
  });
}
