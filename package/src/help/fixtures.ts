import type { CommandHelpItem, ShortcutHelpItem } from './types';

export const HELP_COMMANDS: CommandHelpItem[] = [
  {
    name: 'review',
    args: '<path> [--staged]',
    description: 'Review changes in a path',
    group: 'Code',
    shortcut: 'mod+shift+R',
  },
  { name: 'init', description: 'Create an AGENTS.md with project instructions', group: 'Code' },
  {
    name: 'compact',
    args: '[instructions]',
    description: 'Summarize the conversation to free context',
    group: 'Session',
  },
  { name: 'clear', description: 'Start a new conversation', group: 'Session', shortcut: 'mod+L' },
  { name: 'rewind', description: 'Return to an earlier message', group: 'Session' },
  { name: 'model', args: '[name]', description: 'Switch the model', group: 'Settings' },
  {
    name: 'tone',
    args: '[style]',
    description: 'Change how answers are written',
    group: 'Settings',
  },
  { name: 'mcp', description: 'Manage MCP servers', group: 'Settings' },
];

export const HELP_SHORTCUTS: ShortcutHelpItem[] = [
  { keys: 'mod+K', description: 'Open the command palette', group: 'General' },
  { keys: 'mod+/', description: 'Show this help', group: 'General' },
  { keys: 'Enter', description: 'Send the message', group: 'Composer' },
  { keys: ['shift', 'enter'], description: 'New line', group: 'Composer' },
  { keys: 'Escape', description: 'Stop the agent', group: 'Composer' },
  { keys: 'mod+shift+Z', description: 'Rewind to the previous message', group: 'Conversation' },
];
