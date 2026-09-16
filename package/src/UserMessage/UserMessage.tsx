import React, { memo, useState } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import type { ChatMessage, MessagePart } from '../types';
import { cx } from '../utils/cx';
import { FileAttachment } from '../input/FileAttachment';
import { ImageLightbox } from '../ImageLightbox/ImageLightbox';
import classes from './UserMessage.module.css';

export type UserMessageProps = {
  message: ChatMessage;
  className?: string;
  /**
   * When true (default) clicking an attached image opens a fullscreen
   * lightbox preview. Set to false to render images as plain thumbnails.
   */
  enableImagePreview?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTextPart(part: MessagePart): part is { type: 'text'; text: string } {
  return part.type === 'text' && typeof (part as { text?: unknown }).text === 'string';
}

function getMimeType(part: Record<string, unknown>): string | undefined {
  const mime = part.mediaType ?? part.mimeType;
  return typeof mime === 'string' ? mime : undefined;
}

function getImageUrlFromPart(part: unknown): string | null {
  if (!isRecord(part)) {
    return null;
  }
  const type = part.type;
  if (typeof type !== 'string') {
    return null;
  }

  if (type === 'image') {
    const imagePart = part as { url?: string; image?: string };
    return imagePart.url ?? imagePart.image ?? null;
  }

  if (type === 'data-image') {
    const dataPart = part as { data?: { url?: string } };
    return dataPart.data?.url ?? null;
  }

  if (type === 'file') {
    const mimeType = getMimeType(part);
    const filePart = part as { url?: string; data?: string };
    if (mimeType?.startsWith('image/')) {
      if (filePart.url) {
        return filePart.url;
      }
      if (filePart.data) {
        return `data:${mimeType};base64,${filePart.data}`;
      }
    }
  }

  return null;
}

type FilePartLike = {
  type: 'file';
  filename?: string;
  name?: string;
  fileName?: string;
  size?: number;
  url?: string;
};

function getFileFromPart(part: unknown) {
  if (!isRecord(part)) {
    return null;
  }
  if (part.type !== 'file') {
    return null;
  }
  const filePart = part as FilePartLike;
  const filename = filePart.filename || filePart.name || filePart.fileName || 'Attachment';
  const isImage = getMimeType(part)?.startsWith('image/') ?? false;
  if (isImage) {
    return null;
  }
  return {
    filename,
    size: filePart.size,
  };
}

/** Right-aligned user bubble with optional image thumbnails and file attachments */
export const UserMessage = memo(function UserMessage({
  message,
  className,
  enableImagePreview = true,
}: UserMessageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const textParts = message.parts?.filter(isTextPart) ?? [];
  const text = textParts.map((p) => p.text).join('');

  const images: string[] = [];
  const files: Array<{ filename: string; size?: number }> = [];
  for (const part of message.parts ?? []) {
    const imageUrl = getImageUrlFromPart(part);
    if (imageUrl) {
      images.push(imageUrl);
    }
    const file = getFileFromPart(part);
    if (file) {
      files.push(file);
    }
  }
  if (isRecord(message) && Array.isArray(message.experimental_attachments)) {
    for (const att of message.experimental_attachments as Array<{
      contentType?: string;
      url?: string;
    }>) {
      if (att.contentType?.startsWith('image/') && att.url) {
        images.push(att.url);
      }
    }
  }

  if (!text && images.length === 0 && files.length === 0) {
    return null;
  }

  const lightboxImages = images.map((url, i) => ({
    id: `${message.id}-img-${i}`,
    url,
    filename: `image-${i + 1}`,
  }));

  return (
    <Box className={cx(classes.root, className)}>
      {images.length > 0 &&
        images.map((url, i) =>
          enableImagePreview ? (
            <UnstyledButton
              key={i}
              className={classes.imageFrame}
              data-clickable
              aria-label="Open image preview"
              onClick={() => setLightboxIndex(i)}
            >
              <img src={url} alt="attachment" className={classes.image} />
            </UnstyledButton>
          ) : (
            <div key={i} className={classes.imageFrame}>
              <img src={url} alt="attachment" className={classes.image} />
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
            <p className={classes.text}>{text}</p>
          </div>
        </div>
      )}
    </Box>
  );
});

UserMessage.displayName = 'UserMessage';
