import React, { memo } from 'react';
import { UnstyledButton } from '@mantine/core';
import { IconPaperclip, IconPlus } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import classes from './AttachmentButton.module.css';

export type AttachmentButtonIcon = 'plus' | 'paperclip';

export interface AttachmentButtonProps {
  onClick?: () => void;
  /**
   * Icon to render inside the button.
   * - `'plus'` (default): a `+` glyph, matches the generic "add something" affordance.
   * - `'paperclip'`: a paperclip glyph, matches the more literal "attach file" affordance.
   * - Any ReactNode fully overrides the icon; built-in sizing and color apply only to presets.
   */
  icon?: AttachmentButtonIcon | React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function isIconName(value: unknown): value is AttachmentButtonIcon {
  return value === 'plus' || value === 'paperclip';
}

/** Round 28px "Attach" button rendered in the composer toolbar */
export const AttachmentButton = memo(function AttachmentButton({
  onClick,
  icon = 'plus',
  className,
  style,
}: AttachmentButtonProps) {
  let iconNode: React.ReactNode;
  if (isIconName(icon)) {
    iconNode =
      icon === 'paperclip' ? (
        <IconPaperclip size={16} className={classes.icon} stroke={2} />
      ) : (
        <IconPlus size={16} className={classes.icon} stroke={2} />
      );
  } else {
    iconNode = icon;
  }

  return (
    <UnstyledButton
      onClick={onClick}
      className={cx(classes.root, className)}
      style={style}
      aria-label="Attach"
    >
      {iconNode}
    </UnstyledButton>
  );
});

AttachmentButton.displayName = 'AttachmentButton';
