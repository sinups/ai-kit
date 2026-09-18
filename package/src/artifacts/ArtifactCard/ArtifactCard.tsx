import React, { memo } from 'react';
import { Group, Paper, Text, UnstyledButton } from '@mantine/core';
import { IconChevronRight, IconFileText } from '@tabler/icons-react';
import { TextShimmer } from '../../TextShimmer/TextShimmer';
import type { PartRendererProps, PartRenderers } from '../../types';
import { formatArtifactMeta, type ArtifactPart, type ArtifactRef } from '../types';
import { cx } from '../../utils/cx';
import classes from './ArtifactCard.module.css';

export interface ArtifactCardLabels {
  /** Accessible name of the card, `Open {title}` by default */
  open: (title: string) => string;
  /** Line under the title, `Document · v2` by default */
  meta: (artifact: ArtifactRef) => string;
  /** Status while the artifact is being written, `Writing…` by default */
  streaming: string;
}

export const DEFAULT_ARTIFACT_CARD_LABELS: ArtifactCardLabels = {
  open: (title) => `Open ${title}`,
  meta: formatArtifactMeta,
  streaming: 'Writing…',
};

export interface ArtifactCardProps {
  artifact: ArtifactPart;
  /** Opens the artifact, usually `open` of `useArtifactPanel` */
  onOpen: (artifact: ArtifactRef) => void;
  /** Overrides of the default English labels */
  labels?: Partial<ArtifactCardLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Card in an answer that opens an artifact in `ArtifactPanel`; the whole card is one button */
export const ArtifactCard = memo(function ArtifactCard({
  artifact,
  onOpen,
  labels: labelsProp,
  className,
  style,
}: ArtifactCardProps) {
  const labels = { ...DEFAULT_ARTIFACT_CARD_LABELS, ...labelsProp };
  const { id, title, kind, version } = artifact;
  const isStreaming = artifact.status === 'streaming';
  const meta = labels.meta(artifact);

  return (
    <Paper withBorder className={cx(classes.root, className)} style={style}>
      <UnstyledButton
        className={classes.button}
        aria-label={labels.open(title)}
        onClick={() => onOpen({ id, title, kind, version })}
      >
        <Group gap="sm" wrap="nowrap">
          <span className={classes.icon} aria-hidden>
            <IconFileText size={18} />
          </span>
          <div className={classes.text}>
            <Text size="sm" fw={500} truncate="end">
              {title}
            </Text>
            {isStreaming ? (
              <TextShimmer className={classes.meta}>{labels.streaming}</TextShimmer>
            ) : (
              meta && (
                <Text size="xs" c="dimmed" truncate="end">
                  {meta}
                </Text>
              )
            )}
          </div>
          <IconChevronRight size={14} className={classes.open} aria-hidden />
        </Group>
      </UnstyledButton>
    </Paper>
  );
});

ArtifactCard.displayName = 'ArtifactCard';

export type ArtifactPartsOptions = Pick<ArtifactCardProps, 'onOpen' | 'labels'>;

/** `partRenderers` for `artifact` parts: a card that calls `onOpen`; spread it into your own */
export function createArtifactPartRenderer(options: ArtifactPartsOptions): PartRenderers {
  function ArtifactPartCard({ part }: PartRendererProps<ArtifactPart>) {
    return <ArtifactCard artifact={part} {...options} />;
  }
  return { artifact: ArtifactPartCard };
}
