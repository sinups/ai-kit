import React, { cloneElement, isValidElement } from 'react';
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

type TriggerProps = {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
};

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
  const toggle = (event: React.MouseEvent<HTMLElement>) => {
    event.currentTarget.focus();
    setOpened(!opened);
  };
  const closeOnEscape = (event: React.KeyboardEvent<HTMLElement>) => {
    if (
      opened &&
      event.key === 'Escape' &&
      !event.defaultPrevented &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      setOpened(false);
    }
  };
  const targetProps = {
    onKeyDown: closeOnEscape,
    'data-mantine-stop-propagation': opened || undefined,
  };

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position={toPosition(side, align)}
      offset={sideOffset}
      withinPortal
      returnFocus
      shadow="lg"
      radius={10}
      classNames={{ dropdown: cx(classes.dropdown, className) }}
      styles={{ dropdown: style }}
    >
      <Popover.Target>
        {isValidElement<TriggerProps>(trigger) ? (
          cloneElement(trigger, {
            ...targetProps,
            onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
              trigger.props.onKeyDown?.(event);
              closeOnEscape(event);
            },
            onClick: (event: React.MouseEvent<HTMLElement>) => {
              trigger.props.onClick?.(event);
              toggle(event);
            },
          })
        ) : (
          <Box component="span" className={classes.target} {...targetProps} onClick={toggle}>
            {trigger}
          </Box>
        )}
      </Popover.Target>
      <Popover.Dropdown
        onFocusCapture={(event) =>
          (event.target as HTMLElement).setAttribute('data-mantine-stop-propagation', 'true')
        }
      >
        {children}
      </Popover.Dropdown>
    </Popover>
  );
}

InputPopover.displayName = 'InputPopover';
