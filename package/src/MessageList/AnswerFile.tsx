import React, { memo, useState } from 'react';
import { UnstyledButton } from '@mantine/core';
import { FileAttachment } from '../input/FileAttachment';
import { ImageLightbox } from '../ImageLightbox/ImageLightbox';
import {
  getFileFromPart,
  getImageUrlFromPart,
  getPartFilename,
  imageAltFromName,
} from '../utils/file-parts';
import { isSafeMediaUrl } from '../utils/safe-url';
import { cx } from '../utils/cx';
import classes from './MessageList.module.css';

export interface AnswerFileLabels {
  /** Accessible label of an image in an answer that opens the preview, `Open image preview` by default */
  openImage: string;
  /** Alternative text of an image in an answer, gets the file name */
  imageAlt: (name: string) => string;
}

export const DEFAULT_ANSWER_FILE_LABELS: AnswerFileLabels = {
  openImage: 'Open image preview',
  imageAlt: imageAltFromName,
};

export interface AnswerFileProps {
  /** `file` part of an answer */
  part: unknown;
  /** Id of the message the part belongs to */
  messageId: string;
  /** Opens the image in a fullscreen lightbox on click, `true` by default */
  enableImagePreview?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<AnswerFileLabels>;
  /** Class name added to the root element */
  className?: string;
}

/**
 * A file that arrived with an answer — from the agent, or from a person writing beside it: an image
 * shows as a picture that opens fullscreen, anything else as a file chip. `createMediaPartRenderers`
 * replaces this with the fuller treatment, which plays audio and video as well.
 */
export const AnswerFile = memo(function AnswerFile({
  part,
  messageId,
  enableImagePreview = true,
  labels: labelsProp,
  className,
}: AnswerFileProps) {
  const labels = { ...DEFAULT_ANSWER_FILE_LABELS, ...labelsProp };
  const [previewOpen, setPreviewOpen] = useState(false);
  const imageUrl = getImageUrlFromPart(part);
  const filename = getPartFilename(part);

  if (imageUrl && isSafeMediaUrl(imageUrl)) {
    const image = (
      <img src={imageUrl} alt={labels.imageAlt(filename)} className={classes.answerImage} />
    );
    return (
      <div className={cx(classes.answerFile, className)}>
        {enableImagePreview ? (
          <UnstyledButton
            className={classes.answerImageButton}
            aria-label={labels.openImage}
            onClick={() => setPreviewOpen(true)}
          >
            {image}
          </UnstyledButton>
        ) : (
          <span className={classes.answerImageButton}>{image}</span>
        )}
        {enableImagePreview && (
          <ImageLightbox
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            images={[{ id: `${messageId}-${filename}`, url: imageUrl, filename }]}
          />
        )}
      </div>
    );
  }

  const file = getFileFromPart(part);
  if (!file) {
    return null;
  }

  return (
    <div className={cx(classes.answerFile, className)}>
      <FileAttachment id={`${messageId}-${filename}`} filename={filename} size={file.size} />
    </div>
  );
});

AnswerFile.displayName = 'AnswerFile';
