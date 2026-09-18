import React, { memo } from 'react';
import { Button, Group, Tooltip } from '@mantine/core';
import { useUncontrolled } from '@mantine/hooks';
import { cx } from '../utils/cx';
import classes from './CommandToggles.module.css';

export type CommandToggle = {
  id: string;
  label: string;
  /** Icon before the label */
  icon?: React.ReactNode;
  /** What the command does, shown in a tooltip on hover and focus */
  description?: string;
  disabled?: boolean;
};

export interface CommandTogglesLabels {
  /** Accessible name of the group, `Commands` by default */
  group: string;
}

export const DEFAULT_COMMAND_TOGGLES_LABELS: CommandTogglesLabels = {
  group: 'Commands',
};

export interface CommandTogglesProps {
  commands: CommandToggle[];
  /** Id of the active command, `null` when none is active; controlled */
  value?: string | null;
  /** Command active initially when uncontrolled, none by default */
  defaultValue?: string | null;
  /** Called with the picked command, or with `null` when the active one is clicked again */
  onChange?: (id: string | null) => void;
  /** Overrides of the default English labels */
  labels?: Partial<CommandTogglesLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Pinned commands for the composer toolbar, one active at a time; the host adds it to the message */
export const CommandToggles = memo(function CommandToggles({
  commands,
  value,
  defaultValue,
  onChange,
  labels: labelsProp,
  className,
  style,
}: CommandTogglesProps) {
  const labels = { ...DEFAULT_COMMAND_TOGGLES_LABELS, ...labelsProp };
  const [active, setActive] = useUncontrolled<string | null>({
    value,
    defaultValue,
    finalValue: null,
    onChange,
  });

  return (
    <Group
      gap={4}
      wrap="nowrap"
      role="group"
      aria-label={labels.group}
      className={cx(classes.root, className)}
      style={style}
    >
      {commands.map((command) => {
        const picked = command.id === active;
        return (
          <Tooltip
            key={command.id}
            label={command.description}
            disabled={!command.description}
            withArrow
            openDelay={300}
            events={{ hover: true, focus: true, touch: false }}
          >
            <Button
              size="compact-sm"
              radius="xl"
              variant={picked ? 'light' : 'subtle'}
              color={picked ? undefined : 'gray'}
              leftSection={command.icon}
              aria-pressed={picked}
              disabled={command.disabled}
              className={classes.toggle}
              onClick={() => setActive(picked ? null : command.id)}
            >
              {command.label}
            </Button>
          </Tooltip>
        );
      })}
    </Group>
  );
});

CommandToggles.displayName = 'CommandToggles';
