import React, { memo, useState } from 'react';
import { Box, Paper, UnstyledButton } from '@mantine/core';
import { ImageLightbox } from '../../ImageLightbox/ImageLightbox';
import { FileAttachment, type FileAttachmentLabels } from '../../input/FileAttachment';
import type { FilePart, PartRendererProps, PartRenderers } from '../../types';
import { cx } from '../../utils/cx';
import { getFileFromPart, imageAltFromName } from '../../utils/file-parts';
import { isSafeMediaUrl } from '../../utils/safe-url';
import classes from './MediaPart.module.css';

export interface MediaPartLabels {
  /** Accessible label of an image that opens the preview, `Open image preview` by default */
  openImage: string;
  /** Alternative text of an image, gets the file name */
  imageAlt: (name: string) => string;
  /** Accessible name of an audio player, `Audio: {name}` by default */
  audio: (name: string) => string;
  /** Accessible name of a video player, `Video: {name}` by default */
  video: (name: string) => string;
  /** Accessible label of a file chip that opens through `onOpenFile`, `Open {name}` by default */
  openFile: (name: string) => string;
  /** Accessible label of a file chip that downloads its `url`, `Download {name}` by default */
  download: (name: string) => string;
  /** Labels of the file chip and of the image preview */
  attachment: Partial<FileAttachmentLabels>;
}

export const DEFAULT_MEDIA_PART_LABELS: MediaPartLabels = {
  openImage: 'Open image preview',
  imageAlt: imageAltFromName,
  audio: (name) => `Audio: ${name}`,
  video: (name) => `Video: ${name}`,
  openFile: (name) => `Open ${name}`,
  download: (name) => `Download ${name}`,
  attachment: {},
};

export type MediaPartOptions = {
  /** Opens a file that is not an image, audio or video; without it the chip downloads a safe `url` */
  onOpenFile?: (part: FilePart, messageId: string) => void;
  /** Overrides of the default English labels */
  labels?: Partial<MediaPartLabels>;
};

export interface MediaPartProps extends PartRendererProps<FilePart>, MediaPartOptions {
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/**
 * A `file` part of an answer by its media type: an image opens a fullscreen preview, audio and video
 * play in the native players, anything else is a file chip. Only `http(s)` addresses and `data:`
 * images, audio and video reach the page.
 */
export const MediaPart = memo(function MediaPart({
  part,
  messageId,
  onOpenFile,
  labels: labelsProp,
  className,
  style,
}: MediaPartProps) {
  const labels = { ...DEFAULT_MEDIA_PART_LABELS, ...labelsProp };
  const [previewOpen, setPreviewOpen] = useState(false);
  const file = getFileFromPart(part);
  if (!file) {
    return null;
  }
  const { filename } = file;
  const url = file.url && isSafeMediaUrl(file.url) ? file.url : undefined;
  const captions =
    typeof part.captions === 'string' && isSafeMediaUrl(part.captions) ? part.captions : undefined;
  const kind = file.mediaType?.split('/')[0];

  if (url && kind === 'image') {
    return (
      <Box className={className} style={style}>
        <UnstyledButton
          className={classes.image}
          aria-label={labels.openImage}
          onClick={() => setPreviewOpen(true)}
        >
          <img src={url} alt={labels.imageAlt(filename)} />
        </UnstyledButton>
        <ImageLightbox
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          images={[{ id: `${messageId}-${filename}`, url, filename }]}
          labels={labels.attachment.lightbox}
        />
      </Box>
    );
  }
  if (url && kind === 'audio') {
    return (
      <Paper withBorder className={cx(classes.player, className)} style={style}>
        <audio
          controls
          preload="none"
          src={url}
          crossOrigin={captions ? 'anonymous' : undefined}
          aria-label={labels.audio(filename)}
        >
          {captions ? <track kind="captions" src={captions} default /> : null}
        </audio>
      </Paper>
    );
  }
  if (url && kind === 'video') {
    return (
      <video
        controls
        preload="metadata"
        src={url}
        crossOrigin={captions ? 'anonymous' : undefined}
        className={cx(classes.video, className)}
        style={style}
        aria-label={labels.video(filename)}
      >
        {captions ? <track kind="captions" src={captions} default /> : null}
      </video>
    );
  }

  const chip = (
    <FileAttachment
      id={`${messageId}-${filename}`}
      filename={filename}
      size={file.size}
      labels={labels.attachment}
    />
  );
  const href = url && !url.startsWith('data:') ? url : undefined;
  if (onOpenFile) {
    return (
      <UnstyledButton
        className={cx(classes.file, className)}
        style={style}
        aria-label={labels.openFile(filename)}
        onClick={() => onOpenFile(part, messageId)}
      >
        {chip}
      </UnstyledButton>
    );
  }
  if (href) {
    return (
      <UnstyledButton
        component="a"
        href={href}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(classes.file, className)}
        style={style}
        aria-label={labels.download(filename)}
      >
        {chip}
      </UnstyledButton>
    );
  }
  return (
    <Box className={cx(classes.file, className)} style={style}>
      {chip}
    </Box>
  );
});

MediaPart.displayName = 'MediaPart';

/** `partRenderers` for `file` parts of an answer; create it once and spread it into your own */
export function createMediaPartRenderers(options: MediaPartOptions = {}): PartRenderers {
  function FileMediaPart(props: PartRendererProps<FilePart>) {
    return <MediaPart {...props} {...options} />;
  }
  return { file: FileMediaPart };
}
