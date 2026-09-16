import React from 'react';
import { Box, FloatingPosition, Popover } from '@mantine/core';
import { useUncontrolled } from '@mantine/hooks';
import { cx } from '../utils/cx';
import classes from './InputPopover.module.css';

export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

export interface InputPopoverProps {
  /** Element that toggles the popover */
  trigger: React.ReactNode;
  /** Dropdown content */
  children: React.ReactNode;
  /** Controlled opened state */
  open?: boolean;
  /** Initial opened state in uncontrolled mode */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Side of the trigger the dropdown is placed on, `'top'` by default */
  side?: PopoverSide;
  /** Alignment along the chosen side, `'start'` by default */
  align?: PopoverAlign;
  /** Gap between trigger and dropdown in px, `6` by default */
  sideOffset?: number;
  /** Class name applied to the dropdown */
  className?: string;
  style?: React.CSSProperties;
}

function toPosition(side: PopoverSide, align: PopoverAlign): FloatingPosition {
  return align === 'center' ? side : (`${side}-${align}` as FloatingPosition);
}

/** Thin wrapper over Mantine `Popover` with the toolbar dropdown look used by pickers in the composer */
export function InputPopover({
  trigger,
  children,
  open,
  defaultOpen,
  onOpenChange,
  side = 'top',
  align = 'start',
  sideOffset = 6,
  className,
  style,
}: InputPopoverProps) {
  const [opened, setOpened] = useUncontrolled({
    value: open,
    defaultValue: defaultOpen,
    finalValue: false,
    onChange: onOpenChange,
  });

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position={toPosition(side, align)}
      offset={sideOffset}
      withinPortal
      shadow="lg"
      radius={10}
      classNames={{ dropdown: cx(classes.dropdown, className) }}
      styles={{ dropdown: style }}
    >
      <Popover.Target>
        <Box component="span" className={classes.target} onClick={() => setOpened(!opened)}>
          {trigger}
        </Box>
      </Popover.Target>
      <Popover.Dropdown>{children}</Popover.Dropdown>
    </Popover>
  );
}

InputPopover.displayName = 'InputPopover';
