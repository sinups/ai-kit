import React from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';

export interface MessageActionButtonProps {
  /** Accessible label and tooltip */
  label: string;
  /** Icon of the button, 16px like the built-in actions */
  icon: React.ReactNode;
  /** Called on click */
  onClick?: () => void;
  /** Pressed state of a toggle such as a rating, reported as `aria-pressed` */
  active?: boolean;
  /** Disables the button, for example while the agent is responding */
  disabled?: boolean;
  /** Shows a loader in place of the icon */
  loading?: boolean;
  /** Value of `data-action`, a stable handle for tests */
  action?: string;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Icon button in the look of the message toolbar, for host actions in the `actions` slot of `MessageActions` */
export function MessageActionButton({
  label,
  icon,
  onClick,
  active,
  disabled,
  loading,
  action,
  className,
  style,
}: MessageActionButtonProps) {
  return (
    <Tooltip label={label} withArrow openDelay={300}>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="md"
        aria-label={label}
        data-action={action}
        aria-pressed={active}
        loading={loading}
        disabled={disabled}
        onClick={onClick}
        className={className}
        style={style}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  );
}

MessageActionButton.displayName = 'MessageActionButton';
