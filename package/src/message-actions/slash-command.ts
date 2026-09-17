import type { SlashCommandInfo } from './types';

export type ParsedSlashCommand = {
  /** Command name without the slash */
  name: string;
  /** Text after the command name, trimmed */
  args: string;
};

const COMMAND_PATTERN = /^\/([A-Za-z][\w:-]*)(?:\s+([\s\S]*))?$/;

/** Parses `/name args`; returns `null` when the text is not a command invocation */
export function parseSlashCommand(text: string): ParsedSlashCommand | null {
  const match = COMMAND_PATTERN.exec(text.trim());
  if (!match) {
    return null;
  }
  return { name: match[1], args: (match[2] ?? '').trim() };
}

/** Parses a command only when its name is one of `commands`, so paths like `/usr/bin` stay plain text */
export function matchSlashCommand(
  text: string,
  commands: SlashCommandInfo[]
): (ParsedSlashCommand & { command: SlashCommandInfo }) | null {
  const parsed = parseSlashCommand(text);
  if (!parsed) {
    return null;
  }
  const command = commands.find((item) => item.name.replace(/^\//, '') === parsed.name);
  return command ? { ...parsed, command } : null;
}
