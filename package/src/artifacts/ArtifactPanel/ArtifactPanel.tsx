import React, { memo, useEffect, useId, useRef } from 'react';
import { ActionIcon, Box, Group, ScrollArea, Text, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import { formatArtifactMeta, type ArtifactRef } from '../types';
import classes from './ArtifactPanel.module.css';

export interface ArtifactPanelLabels {
  /** Close button, `Close` by default */
  close: string;
  /** Line under the title, `Document · v2` by default */
  meta: (artifact: ArtifactRef) => string;
}

export const DEFAULT_ARTIFACT_PANEL_LABELS: ArtifactPanelLabels = {
  close: 'Close',
  meta: formatArtifactMeta,
};

export interface ArtifactPanelProps {
  /** Artifact on screen; the panel renders nothing without one */
  artifact: ArtifactRef | null;
  /** Content of the artifact: `Markdown`, `CodeBlock`, `DiffReview` or your own viewer */
  children?: React.ReactNode;
  /** Buttons in the header before close, for example copy or download */
  actions?: React.ReactNode;
  /** Called by the close button */
  onClose: () => void;
  /** Overrides of the default English labels */
  labels?: Partial<ArtifactPanelLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/**
 * An artifact next to the chat: a header with the title, your actions and close, and the content
 * you pass. Put it in the `inspector` of `ChatInspectorLayout`, which turns it into a drawer on
 * narrow screens; `useArtifactPanel` keeps the state and returns the focus on close.
 */
export const ArtifactPanel = memo(function ArtifactPanel({
  artifact,
  children,
  actions,
  onClose,
  labels: labelsProp,
  className,
  style,
}: ArtifactPanelProps) {
  const labels = { ...DEFAULT_ARTIFACT_PANEL_LABELS, ...labelsProp };
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const artifactId = artifact?.id;

  useEffect(() => {
    if (artifactId !== undefined) {
      titleRef.current?.focus({ preventScroll: true });
    }
  }, [artifactId]);

  if (!artifact) {
    return null;
  }
  const meta = labels.meta(artifact);

  return (
    <Box
      component="section"
      aria-labelledby={titleId}
      data-artifact-panel
      className={cx(classes.panel, className)}
      style={style}
    >
      <Group className={classes.header} gap="xs" wrap="nowrap">
        <Box flex={1} miw={0}>
          <Text
            ref={titleRef}
            id={titleId}
            component="h2"
            size="sm"
            fw={500}
            truncate="end"
            tabIndex={-1}
            className={classes.title}
          >
            {artifact.title}
          </Text>
          {meta && (
            <Text size="xs" c="dimmed" truncate="end">
              {meta}
            </Text>
          )}
        </Box>
        {actions}
        <Tooltip label={labels.close} withArrow openDelay={300}>
          <ActionIcon variant="subtle" color="gray" aria-label={labels.close} onClick={onClose}>
            <IconX size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <ScrollArea className={classes.body} type="auto">
        <div className={classes.content}>{children}</div>
      </ScrollArea>
    </Box>
  );
});

ArtifactPanel.displayName = 'ArtifactPanel';
