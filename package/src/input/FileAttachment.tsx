import React, { useState } from 'react';
import { Box, Loader, Progress, RingProgress, UnstyledButton } from '@mantine/core';
import {
  IconFileCode,
  IconFileText,
  IconFileTypeJs,
  IconPhoto,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { ImageLightbox, type ImageLightboxLabels } from '../ImageLightbox/ImageLightbox';
import { VisuallyHiddenStatus } from '../primitives/VisuallyHiddenStatus/VisuallyHiddenStatus';
import type { AttachmentUpload } from '../types';
import { cx } from '../utils/cx';
import classes from './FileAttachment.module.css';

export interface FileAttachmentLabels {
  /** Accessible label of the image thumbnail, `Preview image` by default */
  preview: string;
  /** Accessible label of the remove button, `Remove attachment` by default */
  remove: string;
  /** File size under the name, `1.2 KB` by default */
  size: (bytes: number) => string;
  /** Labels of the fullscreen image preview */
  lightbox: Partial<ImageLightboxLabels>;
  /** Accessible label of the upload progress, `Uploading` by default */
  uploading: string;
  /** Line under the name when the upload failed without `error`, `Upload failed` by default */
  uploadFailed: string;
  /** Announced once when the upload fails, `Upload failed: report.pdf. Too large` by default */
  uploadFailedStatus: (filename: string, error?: string) => string;
  /** Accessible label of the × button during an upload, `Cancel upload` by default */
  cancelUpload: string;
  /** Accessible label of the retry button, `Retry upload` by default */
  retryUpload: string;
  /** Text of the upload progress, `42%` by default */
  progress: (percent: number) => string;
}

export const DEFAULT_FILE_ATTACHMENT_LABELS: FileAttachmentLabels = {
  preview: 'Preview image',
  remove: 'Remove attachment',
  size: formatFileSize,
  lightbox: {},
  uploading: 'Uploading',
  uploadFailed: 'Upload failed',
  uploadFailedStatus: (filename, error) => `Upload failed: ${filename}${error ? `. ${error}` : ''}`,
  cancelUpload: 'Cancel upload',
  retryUpload: 'Retry upload',
  progress: (percent) => `${percent}%`,
};

export interface FileAttachmentProps extends AttachmentUpload {
  id: string;
  filename: string;
  /** File size in bytes, shown under the name when provided */
  size?: number;
  isImage?: boolean;
  /** Image URL, required for thumbnails and preview */
  url?: string;
  onRemove?: () => void;
  /** Stops the upload; the × button calls it instead of `onRemove` while `uploading` */
  onCancel?: () => void;
  /** Starts a failed upload again */
  onRetry?: () => void;
  className?: string;
  /** `'chip'` renders icon + name, `'image-only'` renders a square thumbnail (images with `url` only) */
  display?: 'chip' | 'image-only';
  /** Opens the image thumbnail in a fullscreen preview on click, `true` by default */
  enableImagePreview?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<FileAttachmentLabels>;
  style?: React.CSSProperties;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileIconName = 'image' | 'code' | 'data' | 'text';

const CODE_EXTENSIONS = [
  'js',
  'ts',
  'jsx',
  'tsx',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'swift',
  'c',
  'cpp',
  'h',
  'hpp',
  'cs',
  'php',
];
const DATA_EXTENSIONS = ['json', 'yaml', 'yml', 'xml'];

function getFileIconName(filename: string, isImage?: boolean): FileIconName {
  if (isImage) {
    return 'image';
  }
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (CODE_EXTENSIONS.includes(ext)) {
    return 'code';
  }
  if (DATA_EXTENSIONS.includes(ext)) {
    return 'data';
  }
  return 'text';
}

function renderFileIcon(iconName: FileIconName) {
  switch (iconName) {
    case 'image':
      return <IconPhoto size={16} className={classes.fileIcon} />;
    case 'code':
      return <IconFileCode size={16} className={classes.fileIcon} />;
    case 'data':
      return <IconFileTypeJs size={16} className={classes.fileIcon} />;
    default:
      return <IconFileText size={16} className={classes.fileIcon} />;
  }
}

function Thumb({
  className,
  canPreview,
  onOpen,
  previewLabel,
  children,
}: {
  className: string;
  canPreview: boolean;
  onOpen: (event: React.MouseEvent) => void;
  previewLabel: string;
  children: React.ReactNode;
}) {
  if (canPreview) {
    return (
      <UnstyledButton
        className={cx(classes.thumb, className)}
        data-preview
        onClick={onOpen}
        aria-label={previewLabel}
      >
        {children}
      </UnstyledButton>
    );
  }
  return <div className={cx(classes.thumb, className)}>{children}</div>;
}

/** Staged attachment shown above the composer: a chip with icon and name, or an image thumbnail */
export function FileAttachment({
  id,
  filename,
  size,
  isImage,
  url,
  onRemove,
  onCancel,
  onRetry,
  status,
  progress,
  error,
  className,
  display = 'chip',
  enableImagePreview = true,
  labels: labelsProp,
  style,
}: FileAttachmentProps) {
  const labels = { ...DEFAULT_FILE_ATTACHMENT_LABELS, ...labelsProp };
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const iconName = getFileIconName(filename, isImage);
  const isImageOnly = display === 'image-only' && isImage && !!url;
  const uploading = status === 'uploading';
  const failed = status === 'error';
  const canPreview = Boolean(enableImagePreview && isImage && url && !uploading && !failed);
  const percent =
    progress === undefined ? undefined : Math.round(Math.min(100, Math.max(0, progress)));
  const cancels = Boolean(uploading && onCancel);
  const dismiss = cancels ? onCancel : onRemove;
  const progressText = percent === undefined ? undefined : labels.progress(percent);

  const openLightbox = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsLightboxOpen(true);
  };

  return (
    <Box
      className={cx(classes.root, className)}
      data-image-only={isImageOnly || undefined}
      data-status={status}
      aria-busy={uploading || undefined}
      style={style}
    >
      {isImageOnly ? (
        <Thumb
          className={classes.thumbSquare}
          canPreview={canPreview}
          onOpen={openLightbox}
          previewLabel={labels.preview}
        >
          <img src={url} alt={filename} className={classes.img} />
          {uploading &&
            (percent === undefined ? (
              <Loader
                size="xs"
                className={classes.ring}
                role="progressbar"
                aria-label={labels.uploading}
              />
            ) : (
              <RingProgress
                size={32}
                thickness={3}
                sections={[{ value: percent, color: 'var(--ae-primary)' }]}
                className={classes.ring}
                role="progressbar"
                aria-label={labels.uploading}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-valuetext={progressText}
              />
            ))}
        </Thumb>
      ) : (
        <>
          {isImage && url ? (
            <Thumb
              className={classes.thumbStretch}
              canPreview={canPreview}
              onOpen={openLightbox}
              previewLabel={labels.preview}
            >
              <img src={url} alt={filename} className={cx(classes.img, classes.imgSquare)} />
            </Thumb>
          ) : (
            <div className={classes.iconBox}>{renderFileIcon(iconName)}</div>
          )}

          <div className={classes.meta}>
            <span className={classes.name} title={filename}>
              {filename}
            </span>
            {uploading ? (
              <Progress.Root size="xs" className={classes.progress}>
                <Progress.Section
                  value={percent ?? 100}
                  animated={percent === undefined}
                  withAria={percent !== undefined}
                  role="progressbar"
                  aria-label={labels.uploading}
                  aria-valuetext={progressText}
                />
              </Progress.Root>
            ) : failed ? (
              <span className={classes.size}>{error ?? labels.uploadFailed}</span>
            ) : (
              size !== undefined && <span className={classes.size}>{labels.size(size)}</span>
            )}
          </div>
        </>
      )}

      {failed && onRetry && (
        <UnstyledButton className={classes.retry} onClick={onRetry} aria-label={labels.retryUpload}>
          <IconRefresh size={14} />
        </UnstyledButton>
      )}

      {dismiss && (
        <UnstyledButton
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          className={classes.remove}
          aria-label={cancels ? labels.cancelUpload : labels.remove}
        >
          <IconX size={12} />
        </UnstyledButton>
      )}

      <VisuallyHiddenStatus>
        {failed && labels.uploadFailedStatus(filename, error)}
      </VisuallyHiddenStatus>

      {canPreview && url && (
        <ImageLightbox
          open={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          images={[{ id, url, filename }]}
          labels={labels.lightbox}
        />
      )}
    </Box>
  );
}

FileAttachment.displayName = 'FileAttachment';
