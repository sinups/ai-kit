import React, { useState } from 'react';
import { Box, UnstyledButton } from '@mantine/core';
import { IconFileCode, IconFileText, IconFileTypeJs, IconPhoto, IconX } from '@tabler/icons-react';
import { ImageLightbox, type ImageLightboxLabels } from '../ImageLightbox/ImageLightbox';
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
}

export const DEFAULT_FILE_ATTACHMENT_LABELS: FileAttachmentLabels = {
  preview: 'Preview image',
  remove: 'Remove attachment',
  size: formatFileSize,
  lightbox: {},
};

export interface FileAttachmentProps {
  id: string;
  filename: string;
  /** File size in bytes, shown under the name when provided */
  size?: number;
  isImage?: boolean;
  /** Image URL, required for thumbnails and preview */
  url?: string;
  onRemove?: () => void;
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
  const canPreview = Boolean(enableImagePreview && isImage && url);

  const openLightbox = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsLightboxOpen(true);
  };

  return (
    <Box
      className={cx(classes.root, className)}
      data-image-only={isImageOnly || undefined}
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
            {size !== undefined && <span className={classes.size}>{labels.size(size)}</span>}
          </div>
        </>
      )}

      {onRemove && (
        <UnstyledButton
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={classes.remove}
          aria-label={labels.remove}
        >
          <IconX size={12} />
        </UnstyledButton>
      )}

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
