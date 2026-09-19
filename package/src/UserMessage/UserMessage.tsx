import React, { memo, useState } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import type { ChatMessage } from '../types';
import { cx } from '../utils/cx';
import {
  getFileFromPart,
  getImageUrlFromPart,
  getPartFilename,
  imageAltFromName,
} from '../utils/file-parts';
import { isTextPart } from '../utils/parts';
import { FileAttachment } from '../input/FileAttachment';
import { ImageLightbox } from '../ImageLightbox/ImageLightbox';
import { CommandChip } from '../message-actions/CommandChip/CommandChip';
import { matchSlashCommand } from '../message-actions/slash-command';
import type { SlashCommandInfo } from '../message-actions/types';
import { collapseLongText, type LongTextThreshold } from './long-text';
import classes from './UserMessage.module.css';

export type UserMessageProps = {
  message: ChatMessage;
  className?: string;
  /** Opens an attached image in a fullscreen lightbox on click, plain thumbnails when `false`; `true` by default */
  enableImagePreview?: boolean;
  /**
   * Known slash commands. Text that starts with one of them, for example `/review src/auth`, is shown
   * as a command chip with its arguments; unknown `/…` text such as a file path stays plain.
   */
  commands?: SlashCommandInfo[];
  /** Shows the head and tail of a text longer than the threshold with a button that expands it; `true` uses `{ chars: 2000, lines: 30 }`, `false` by default */
  longMessageThreshold?: LongTextThreshold | boolean;
  /** Overrides of the default English labels */
  labels?: Partial<UserMessageLabels>;
};

export interface UserMessageLabels {
  /** Expand button, receives the number of hidden lines or characters */
  showFull: (hidden: { lines: number; chars: number }) => string;
  /** Collapse button, `Show less` by default */
  showLess: string;
  /** Accessible label of an attached image that opens the preview, `Open image preview` by default */
  openImage: string;
  /** Alternative text of an attached image, gets the file name or an empty string, `attachment` without a name */
  imageAlt: (name: string) => string;
}

export const DEFAULT_USER_MESSAGE_LABELS: UserMessageLabels = {
  showFull: ({ lines, chars }) =>
    lines > 0
      ? `Show full message (${lines} more ${lines === 1 ? 'line' : 'lines'})`
      : `Show full message (${chars.toLocaleString('en-US')} more characters)`,
  showLess: 'Show less',
  openImage: 'Open image preview',
  imageAlt: imageAltFromName,
};

/** Right-aligned user bubble with optional image thumbnails and file attachments */
export const UserMessage = memo(function UserMessage({
  message,
  className,
  enableImagePreview = true,
  commands,
  longMessageThreshold = false,
  labels: labelsProp,
}: UserMessageProps) {
  const labels = { ...DEFAULT_USER_MESSAGE_LABELS, ...labelsProp };
  const [expanded, setExpanded] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const textParts = message.parts?.filter(isTextPart) ?? [];
  const text = textParts.map((p) => p.text).join('');

  const images: Array<{ url: string; name: string }> = [];
  const files: Array<{ filename: string; size?: number }> = [];
  for (const part of message.parts ?? []) {
    const imageUrl = getImageUrlFromPart(part);
    if (imageUrl) {
      images.push({ url: imageUrl, name: getPartFilename(part) });
    }
    const file = getFileFromPart(part);
    if (file && !file.mediaType?.startsWith('image/')) {
      files.push({ filename: file.filename, size: file.size });
    }
  }
  if (Array.isArray(message.experimental_attachments)) {
    for (const att of message.experimental_attachments as Array<{
      contentType?: string;
      url?: string;
    }>) {
      if (att.contentType?.startsWith('image/') && att.url) {
        images.push({ url: att.url, name: getPartFilename(att) });
      }
    }
  }

  const command = commands?.length ? matchSlashCommand(text, commands) : null;
  const collapsed =
    command || longMessageThreshold === false
      ? null
      : collapseLongText(text, longMessageThreshold === true ? undefined : longMessageThreshold);

  if (!text && images.length === 0 && files.length === 0) {
    return null;
  }

  const lightboxImages = images.map(({ url, name }, i) => ({
    id: `${message.id}-img-${i}`,
    url,
    filename: name || `image-${i + 1}`,
  }));

  return (
    <Box className={cx(classes.root, className)}>
      {images.length > 0 &&
        images.map(({ url, name }, i) =>
          enableImagePreview ? (
            <UnstyledButton
              key={i}
              className={classes.imageFrame}
              data-clickable
              aria-label={labels.openImage}
              onClick={() => setLightboxIndex(i)}
            >
              <img src={url} alt={labels.imageAlt(name)} className={classes.image} />
            </UnstyledButton>
          ) : (
            <div key={i} className={classes.imageFrame}>
              <img src={url} alt={labels.imageAlt(name)} className={classes.image} />
            </div>
          )
        )}
      {enableImagePreview && lightboxImages.length > 0 && (
        <ImageLightbox
          open={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          images={lightboxImages}
          initialIndex={lightboxIndex ?? 0}
        />
      )}
      {files.length > 0 && (
        <div className={classes.files}>
          {files.map((file, i) => (
            <FileAttachment
              key={`${file.filename}-${i}`}
              id={`${file.filename}-${i}`}
              filename={file.filename}
              size={file.size}
            />
          ))}
        </div>
      )}
      {text && (
        <div className={classes.bubbleWrapper}>
          <div className={classes.bubble}>
            {command ? (
              <CommandChip
                name={command.name}
                args={command.args}
                description={command.command.description}
                icon={command.command.icon}
                className={classes.text}
              />
            ) : collapsed ? (
              <>
                <p className={classes.text}>{expanded ? text : collapsed.head}</p>
                {!expanded && (
                  <p className={classes.text} data-collapsed-tail>
                    {collapsed.tail}
                  </p>
                )}
                <UnstyledButton
                  className={classes.expandButton}
                  aria-expanded={expanded}
                  onClick={() => setExpanded((value) => !value)}
                >
                  {expanded
                    ? labels.showLess
                    : labels.showFull({
                        lines: collapsed.hiddenLines,
                        chars: collapsed.hiddenChars,
                      })}
                </UnstyledButton>
              </>
            ) : (
              <p className={classes.text}>{text}</p>
            )}
          </div>
        </div>
      )}
    </Box>
  );
});

UserMessage.displayName = 'UserMessage';
