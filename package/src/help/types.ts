export type CommandHelpItem = {
  /** Command name with or without the leading slash, for example `review` */
  name: string;
  /** What the command does */
  description: string;
  /** Argument syntax, for example `<path> [--staged]` */
  args?: string;
  /** Group header the command is listed under */
  group?: string;
  /** Shortcut that runs the command, for example `mod+shift+R` */
  shortcut?: string;
};

export type ShortcutHelpItem = {
  /** Shortcut such as `mod+K`, or keys of one combination such as `['shift', 'enter']` */
  keys: string | string[];
  /** What the shortcut does */
  description: string;
  /** Group header the shortcut is listed under */
  group?: string;
};
