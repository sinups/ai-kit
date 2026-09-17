import { detectShortcutPlatform, formatShortcut } from './format-shortcut';

describe('primitives/format-shortcut', () => {
  it('resolves mod per platform', () => {
    expect(formatShortcut('mod+K', 'mac')).toEqual(['⌘', 'K']);
    expect(formatShortcut('mod+K', 'other')).toEqual(['Ctrl', 'K']);
  });

  it('formats modifiers, named keys and letters', () => {
    expect(formatShortcut('shift+alt+enter', 'mac')).toEqual(['⇧', '⌥', '↵']);
    expect(formatShortcut('shift+alt+enter', 'other')).toEqual(['Shift', 'Alt', 'Enter']);
    expect(formatShortcut('esc', 'mac')).toEqual(['Esc']);
    expect(formatShortcut('ctrl+arrowUp', 'other')).toEqual(['Ctrl', '↑']);
    expect(formatShortcut('F5', 'other')).toEqual(['F5']);
    expect(formatShortcut('pageDown', 'other')).toEqual(['PageDown']);
  });

  it('keeps a plus key and accepts arrays', () => {
    expect(formatShortcut('mod++', 'other')).toEqual(['Ctrl', '+']);
    expect(formatShortcut(['mod', 'shift', 'p'], 'mac')).toEqual(['⌘', '⇧', 'P']);
    expect(formatShortcut(['', 'k'], 'mac')).toEqual(['K']);
  });

  it('detects the platform from navigator', () => {
    const platform = jest.spyOn(window.navigator, 'platform', 'get');
    platform.mockReturnValue('MacIntel');
    expect(detectShortcutPlatform()).toBe('mac');
    platform.mockReturnValue('Win32');
    expect(detectShortcutPlatform()).toBe('other');
    platform.mockRestore();
  });
});
