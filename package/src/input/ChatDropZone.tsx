import React, { memo, useCallback } from 'react';
import { Box, Center, Overlay, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { VisuallyHiddenStatus } from '../primitives/VisuallyHiddenStatus/VisuallyHiddenStatus';
import { cx } from '../utils/cx';
import { filterFiles, type FileIntakePolicy, type FileRejection } from './file-intake';
import { useFileDrag } from './use-file-drag';
import classes from './ChatDropZone.module.css';

export interface ChatDropZoneLabels {
  /** Heading of the overlay, also announced when files are dragged in, `Drop files to attach` by default */
  drop: string;
  /** Line under the heading, empty by default and then not shown */
  hint: string;
}

export const DEFAULT_CHAT_DROP_ZONE_LABELS: ChatDropZoneLabels = {
  drop: 'Drop files to attach',
  hint: '',
};

export interface ChatDropZoneProps {
  /** Called with the dropped files the policy accepts, for example `onDrop` of `useFileIntake` */
  onFiles: (files: File[]) => void;
  /** Which files to take; every file passes when omitted */
  policy?: FileIntakePolicy;
  /** Called with the dropped files the policy rejects */
  onReject?: (rejections: FileRejection[]) => void;
  /** Ignores drags, for example while the chat cannot take files */
  disabled?: boolean;
  /** The chat, or a function that gets `isDragOver` for a layout that draws its own highlight instead of the overlay */
  children: React.ReactNode | ((state: { isDragOver: boolean }) => React.ReactNode);
  /** Overrides of the default English labels */
  labels?: Partial<ChatDropZoneLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Takes files dropped anywhere on the chat and shows an overlay while they are dragged over it */
export const ChatDropZone = memo(function ChatDropZone({
  onFiles,
  policy,
  onReject,
  disabled = false,
  children,
  labels: labelsProp,
  className,
  style,
}: ChatDropZoneProps) {
  const labels = { ...DEFAULT_CHAT_DROP_ZONE_LABELS, ...labelsProp };
  const take = useCallback(
    (files: File[]) => {
      const { accepted, rejected } = filterFiles(files, policy);
      if (accepted.length > 0) {
        onFiles(accepted);
      }
      if (rejected.length > 0) {
        onReject?.(rejected);
      }
    },
    [policy, onFiles, onReject]
  );
  const { isDragOver, handlers } = useFileDrag({ onFiles: take, disabled });

  return (
    <Box
      className={cx(classes.root, className)}
      style={style}
      data-drag-over={isDragOver || undefined}
      {...handlers}
    >
      {typeof children === 'function' ? children({ isDragOver }) : children}
      {isDragOver && (
        <Overlay className={classes.overlay} aria-hidden blur={2} zIndex={2}>
          <Center h="100%">
            <Stack gap="xs" align="center">
              <ThemeIcon size={32} radius="xl" variant="transparent" className={classes.icon}>
                <IconUpload size={16} />
              </ThemeIcon>
              <Text size="sm" fw={500}>
                {labels.drop}
              </Text>
              {labels.hint && <Text className={classes.hint}>{labels.hint}</Text>}
            </Stack>
          </Center>
        </Overlay>
      )}
      <VisuallyHiddenStatus>{isDragOver ? labels.drop : null}</VisuallyHiddenStatus>
    </Box>
  );
});

ChatDropZone.displayName = 'ChatDropZone';
