import React, { useCallback, useEffect, useState } from 'react';
import { Box, FocusTrap, Portal, UnstyledButton } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import classes from './ImageLightbox.module.css';

export type LightboxImage = {
  /** Stable identifier, used for keys and to know which image is active */
  id: string;
  /** Resolvable image URL (https / data: / blob:) */
  url: string;
  /** Optional filename used for the alt text */
  filename?: string;
};

export interface ImageLightboxProps {
  /** Whether the overlay is open */
  open: boolean;
  /** Close handler, wired to overlay click, X button and Esc key */
  onClose: () => void;
  /** Full set of images for gallery navigation */
  images: LightboxImage[];
  /** Index in `images` to start on, `0` by default */
  initialIndex?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Fullscreen image preview rendered into `document.body`, with keyboard navigation and body scroll lock */
export function ImageLightbox({
  open,
  onClose,
  images,
  initialIndex = 0,
  className,
  style,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const hasMultipleImages = images.length > 1;
  const lastIndex = Math.max(images.length - 1, 0);
  const activeIndex = Math.min(currentIndex, lastIndex);

  useEffect(() => {
    if (currentIndex > lastIndex) {
      setCurrentIndex(lastIndex);
    }
  }, [currentIndex, lastIndex]);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const goToPrevious = useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    },
    [images.length]
  );

  const goToNext = useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    },
    [images.length]
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          onClose();
          break;
        case 'ArrowLeft':
          if (hasMultipleImages) {
            goToPrevious();
          }
          break;
        case 'ArrowRight':
          if (hasMultipleImages) {
            goToNext();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [open, hasMultipleImages, onClose, goToPrevious, goToNext]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (typeof document === 'undefined' || !open) {
    return null;
  }
  const currentImage = images[activeIndex] ?? images[0];
  if (!currentImage?.url) {
    return null;
  }

  return (
    <Portal target={document.body}>
      <FocusTrap active>
        <Box
          role="dialog"
          aria-modal="true"
          className={cx(classes.overlay, className)}
          style={style}
          onClick={onClose}
        >
          <UnstyledButton
            onClick={onClose}
            aria-label="Close fullscreen (Esc)"
            className={cx(classes.control, classes.close)}
          >
            <IconX size={20} />
          </UnstyledButton>

          {hasMultipleImages && (
            <UnstyledButton
              onClick={goToPrevious}
              aria-label="Previous image (←)"
              className={cx(classes.control, classes.nav, classes.prev)}
            >
              <IconChevronLeft size={24} />
            </UnstyledButton>
          )}

          <div
            role="presentation"
            className={classes.imageWrap}
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={currentImage.url}
              alt={currentImage.filename ?? 'Image preview'}
              className={classes.image}
              draggable={false}
            />
          </div>

          {hasMultipleImages && (
            <UnstyledButton
              onClick={goToNext}
              aria-label="Next image (→)"
              className={cx(classes.control, classes.nav, classes.next)}
            >
              <IconChevronRight size={24} />
            </UnstyledButton>
          )}

          {hasMultipleImages && (
            <div className={classes.footer}>
              <div className={classes.dots}>
                {images.map((image, idx) => (
                  <UnstyledButton
                    key={image.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    aria-label={`Go to image ${idx + 1}`}
                    className={classes.dot}
                    data-active={idx === activeIndex || undefined}
                  />
                ))}
              </div>
              <span className={classes.counter}>
                {activeIndex + 1} / {images.length}
              </span>
            </div>
          )}
        </Box>
      </FocusTrap>
    </Portal>
  );
}

ImageLightbox.displayName = 'ImageLightbox';
