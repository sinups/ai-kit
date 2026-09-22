import React, { memo } from 'react';
import { ActionIcon, Box, Indicator, Tooltip, useDirection } from '@mantine/core';
import { cx } from '../utils/cx';
import type { ChatLauncherPosition } from './launcher-layout';
import classes from './LauncherActions.module.css';

export interface LauncherAction {
  /** Identity of the action, also the React key */
  id: string;
  /** Accessible name of the button and the text of its tooltip */
  label: string;
  /** Icon inside the round button */
  icon: React.ReactNode;
  /** Called on click, after the fan closes */
  onClick?: () => void;
  /** Renders the action as a link instead of a button */
  href?: string;
  /** Target of the link, for example `_blank` */
  target?: string;
  /** Mantine color of the button, the theme primary color by default */
  color?: string;
  /** Keeps the action visible but inert */
  disabled?: boolean;
  /** Count shown as a badge on the action, hidden at `0` */
  unreadCount?: number;
  /** Opens the chat panel of `ChatLauncher` in addition to `onClick` */
  opensChat?: boolean;
}

export type LauncherActionsClassNames = Partial<Record<'list' | 'item' | 'button', string>>;

export interface LauncherActionsProps {
  /** Actions shown in the fan, in the order they leave the button */
  actions: LauncherAction[];
  /** Whether the fan is open */
  opened: boolean;
  /** Called when an action is picked */
  onAction: (action: LauncherAction) => void;
  /** Corner the fan belongs to, `bottom-right` by default */
  position?: ChatLauncherPosition;
  /** Diameter of an action button in px, `48` by default */
  size?: number;
  /** Space between the buttons in px, `12` by default */
  gap?: number;
  /** Order the actions appear in: one after another, or all at once, `sequence` by default */
  motion?: 'sequence' | 'together';
  /** Id of the list, for `aria-controls` of the button that opens it */
  id?: string;
  /** Accessible name of the list */
  label?: string;
  /** Class name added to the list */
  className?: string;
  /** Class names of inner elements */
  classNames?: LauncherActionsClassNames;
}

/** Round actions that fan out of the launcher button one after another */
export const LauncherActions = memo(function LauncherActions({
  actions,
  opened,
  onAction,
  position = 'bottom-right',
  size = 48,
  gap = 12,
  motion = 'sequence',
  id,
  label,
  className,
  classNames,
}: LauncherActionsProps) {
  const vars = {
    '--launcher-action-size': `${size}px`,
    '--launcher-action-gap': `${gap}px`,
    '--launcher-action-count': String(actions.length),
  } as React.CSSProperties;

  const { dir } = useDirection();
  const tooltipSide =
    (position === 'bottom-left') === (dir === 'ltr') ? ('right' as const) : ('left' as const);

  return (
    <Box
      id={id}
      role="group"
      aria-label={label}
      className={cx(classes.list, classNames?.list, className)}
      style={vars}
      data-motion={motion}
      data-opened={opened || undefined}
      aria-hidden={!opened}
    >
      {actions.map((action, index) => (
        <Box
          key={action.id}
          className={cx(classes.item, classNames?.item)}
          style={{ '--launcher-action-index': String(index) } as React.CSSProperties}
        >
          <Tooltip
            label={action.label}
            position={tooltipSide}
            transitionProps={{
              transition: tooltipSide === 'right' ? 'slide-right' : 'slide-left',
              duration: 150,
            }}
            withArrow
            events={{ hover: true, focus: true, touch: false }}
          >
            <Indicator
              label={
                action.unreadCount && action.unreadCount > 99 ? '99+' : (action.unreadCount ?? 0)
              }
              disabled={!action.unreadCount}
              size={16}
              offset={4}
              color="red"
              classNames={{ indicator: classes.badge }}
            >
              <ActionIcon
                component={action.href && !action.disabled ? 'a' : 'button'}
                href={action.disabled ? undefined : action.href}
                target={action.target}
                rel={action.target === '_blank' ? 'noopener noreferrer' : undefined}
                variant="filled"
                color={action.color}
                radius="xl"
                style={{ '--ai-size': 'var(--launcher-action-size)' } as React.CSSProperties}
                disabled={action.disabled}
                tabIndex={opened ? undefined : -1}
                aria-label={action.label}
                className={cx(classes.button, classNames?.button)}
                onClick={() => onAction(action)}
              >
                {action.icon}
              </ActionIcon>
            </Indicator>
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
});

LauncherActions.displayName = 'LauncherActions';
