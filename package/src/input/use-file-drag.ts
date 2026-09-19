import React, { useCallback, useEffect, useRef, useState } from 'react';

function carriesFiles(event: React.DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

export type FileDragHandlers = {
  onDragEnter: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
};

/**
 * Tracks files dragged over an element. Entering and leaving a child fires both events on the
 * parent, so a counter, not the last event, tells whether the pointer is still inside.
 */
export function useFileDrag({
  onFiles,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}): { isDragOver: boolean; handlers: FileDragHandlers } {
  const [isDragOver, setIsDragOver] = useState(false);
  const depth = useRef(0);

  const reset = useCallback(() => {
    depth.current = 0;
    setIsDragOver(false);
  }, []);

  useEffect(() => {
    if (disabled) {
      reset();
    }
  }, [disabled, reset]);

  useEffect(() => {
    if (!isDragOver) {
      return undefined;
    }
    window.addEventListener('drop', reset, true);
    window.addEventListener('dragend', reset, true);
    return () => {
      window.removeEventListener('drop', reset, true);
      window.removeEventListener('dragend', reset, true);
    };
  }, [isDragOver, reset]);

  const onDragEnter = useCallback(
    (event: React.DragEvent) => {
      if (disabled || !carriesFiles(event)) {
        return;
      }
      event.preventDefault();
      depth.current += 1;
      setIsDragOver(true);
    },
    [disabled]
  );

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      if (disabled || !carriesFiles(event)) {
        return;
      }
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    },
    [disabled]
  );

  const onDragLeave = useCallback(
    (event: React.DragEvent) => {
      if (disabled || !carriesFiles(event)) {
        return;
      }
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) {
        setIsDragOver(false);
      }
    },
    [disabled]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (disabled || !carriesFiles(event)) {
        return;
      }
      event.preventDefault();
      reset();
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length > 0) {
        onFiles(files);
      }
    },
    [disabled, onFiles, reset]
  );

  return { isDragOver, handlers: { onDragEnter, onDragOver, onDragLeave, onDrop } };
}
