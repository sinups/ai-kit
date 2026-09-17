import React, { Fragment, memo, useSyncExternalStore } from 'react';
import { Group, Kbd, Text, type MantineSize } from '@mantine/core';
import { detectShortcutPlatform, formatShortcut, type ShortcutPlatform } from './format-shortcut';

export interface ShortcutHintProps {
  /** Shortcut such as `mod+K`, or keys of one combination such as `['shift', 'enter']`; `mod` is ⌘ on macOS and Ctrl elsewhere */
  keys: string | string[];
  /** Text shown before the keys */
  label?: React.ReactNode;
  /** Platform used to render modifier keys, detected from `navigator` by default */
  platform?: ShortcutPlatform;
  /** Size of the keys and the label, `xs` by default */
  size?: MantineSize;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const subscribe = () => () => {};
const getServerPlatform = (): ShortcutPlatform => 'other';

/** Keyboard shortcut rendered with `Kbd`, the modifier key resolved per platform */
export const ShortcutHint = memo(function ShortcutHint({
  keys,
  label,
  platform: platformProp,
  size = 'xs',
  className,
  style,
}: ShortcutHintProps) {
  const detected = useSyncExternalStore(subscribe, detectShortcutPlatform, getServerPlatform);
  const platform = platformProp ?? detected;
  const formatted = formatShortcut(keys, platform);

  return (
    <Group gap={6} wrap="nowrap" className={className} style={style}>
      {label && (
        <Text size={size} c="dimmed">
          {label}
        </Text>
      )}
      <Group gap={2} wrap="nowrap">
        {formatted.map((key, index) => (
          <Fragment key={`${key}-${index}`}>
            {index > 0 && platform === 'other' && (
              <Text size={size} c="dimmed" aria-hidden>
                +
              </Text>
            )}
            <Kbd size={size}>{key}</Kbd>
          </Fragment>
        ))}
      </Group>
    </Group>
  );
});

ShortcutHint.displayName = 'ShortcutHint';
