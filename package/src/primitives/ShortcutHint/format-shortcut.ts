export type ShortcutPlatform = 'mac' | 'other';

const MAC_KEYS: Record<string, string> = {
  mod: '⌘',
  cmd: '⌘',
  command: '⌘',
  meta: '⌘',
  ctrl: '⌃',
  control: '⌃',
  alt: '⌥',
  option: '⌥',
  shift: '⇧',
  enter: '↵',
  return: '↵',
  backspace: '⌫',
  delete: '⌦',
  tab: '⇥',
};

const OTHER_KEYS: Record<string, string> = {
  mod: 'Ctrl',
  cmd: 'Ctrl',
  command: 'Ctrl',
  meta: 'Win',
  ctrl: 'Ctrl',
  control: 'Ctrl',
  alt: 'Alt',
  option: 'Alt',
  shift: 'Shift',
  enter: 'Enter',
  return: 'Enter',
  backspace: 'Backspace',
  delete: 'Delete',
  tab: 'Tab',
};

const COMMON_KEYS: Record<string, string> = {
  esc: 'Esc',
  escape: 'Esc',
  space: 'Space',
  up: '↑',
  arrowup: '↑',
  down: '↓',
  arrowdown: '↓',
  left: '←',
  arrowleft: '←',
  right: '→',
  arrowright: '→',
  plus: '+',
};

function splitCombo(combo: string): string[] {
  const parts = combo.split('+');
  const keys: string[] = [];
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index].trim();
    if (part) {
      keys.push(part);
    } else if (index > 0 && index === parts.length - 1) {
      keys.push('+');
    }
  }
  return keys;
}

function formatKey(key: string, platform: ShortcutPlatform): string {
  const normalized = key.toLowerCase();
  const platformKeys = platform === 'mac' ? MAC_KEYS : OTHER_KEYS;
  const known = platformKeys[normalized] ?? COMMON_KEYS[normalized];
  if (known) {
    return known;
  }
  return key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1);
}

/** Display keys of a shortcut: a string is split on `+` (`mod+K`), an array lists keys of one combination */
export function formatShortcut(
  keys: string | readonly string[],
  platform: ShortcutPlatform
): string[] {
  const list = typeof keys === 'string' ? splitCombo(keys) : keys.filter(Boolean);
  return list.map((key) => formatKey(key, platform));
}

export function detectShortcutPlatform(): ShortcutPlatform {
  if (typeof navigator === 'undefined') {
    return 'other';
  }
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent || '';
  return /mac|iphone|ipad|ipod/i.test(platform) ? 'mac' : 'other';
}
