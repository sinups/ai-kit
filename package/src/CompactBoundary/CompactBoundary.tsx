import React, { memo, useState } from 'react';
import { Box, Collapse, Divider, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { Markdown } from '../Markdown/Markdown';
import type { SyntaxHighlighter } from '../utils/highlighter';
import { cx } from '../utils/cx';
import { fillTemplate } from '../utils/fill-template';
import { formatTokens } from '../utils/format-tokens';
import classes from './CompactBoundary.module.css';

export interface CompactBoundaryLabels {
  /** Divider text without `direction`, `History summarized` by default */
  summarized: string;
  /** Divider text with `direction="from"`, `Summarized from here` by default */
  summarizedFrom: string;
  /** Divider text with `direction="up-to"`, `Summarized up to here` by default */
  summarizedUpTo: string;
  /** Token size text, `{tokens}` is replaced with `182k → 12.3k` or `12.3k`, `{tokens} tokens` by default */
  tokens: string;
  /** Prefix of `userContext`, `Kept` by default */
  userContext: string;
}

export const DEFAULT_COMPACT_BOUNDARY_LABELS: CompactBoundaryLabels = {
  summarized: 'History summarized',
  summarizedFrom: 'Summarized from here',
  summarizedUpTo: 'Summarized up to here',
  tokens: '{tokens} tokens',
  userContext: 'Kept',
};

export interface CompactBoundaryProps {
  /** Summary that replaced the compacted history, rendered as markdown when expanded */
  summary?: string;
  /** Context size before compaction, in tokens */
  tokensBefore?: number;
  /** Context size after compaction, in tokens */
  tokensAfter?: number;
  /** Which side of the boundary was summarized, picks the default label */
  direction?: 'from' | 'up-to';
  /** What the user asked the summary to keep, shown with the summary */
  userContext?: string;
  /** Divider text that replaces the one picked from `labels` by `direction` */
  label?: string;
  /** Show the summary on mount, `false` by default */
  defaultExpanded?: boolean;
  /** Syntax highlighter for code blocks in the summary */
  highlighter?: SyntaxHighlighter;
  /** Overrides of the default English labels */
  labels?: Partial<CompactBoundaryLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function formatTokenChange(before?: number, after?: number): string {
  if (after === undefined) {
    return '';
  }
  return before === undefined
    ? formatTokens(after)
    : `${formatTokens(before)} → ${formatTokens(after)}`;
}

/** Divider marking where earlier conversation history was replaced with a summary */
export const CompactBoundary = memo(function CompactBoundary({
  summary,
  tokensBefore,
  tokensAfter,
  direction,
  userContext,
  label: labelProp,
  defaultExpanded = false,
  highlighter,
  labels: labelsProp,
  className,
  style,
}: CompactBoundaryProps) {
  const labels = { ...DEFAULT_COMPACT_BOUNDARY_LABELS, ...labelsProp };
  const directionLabel =
    direction === 'from'
      ? labels.summarizedFrom
      : direction === 'up-to'
        ? labels.summarizedUpTo
        : labels.summarized;
  const label = labelProp ?? directionLabel;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const tokenChange = formatTokenChange(tokensBefore, tokensAfter);
  const context = userContext?.trim();
  const hasSummary = Boolean(summary?.trim()) || Boolean(context);

  const text = (
    <Text span size="xs" c="inherit" truncate="end" miw={0}>
      {tokenChange ? `${label} · ${fillTemplate(labels.tokens, { tokens: tokenChange })}` : label}
    </Text>
  );

  return (
    <Box
      className={cx(classes.root, className)}
      style={style}
      data-compact-boundary
      data-direction={direction}
    >
      <Divider
        labelPosition="center"
        classNames={{ label: classes.label }}
        label={
          hasSummary ? (
            <UnstyledButton
              className={classes.toggle}
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
            >
              <Group gap={4} wrap="nowrap" miw={0}>
                {text}
                <IconChevronRight
                  size={12}
                  className={classes.chevron}
                  data-open={expanded || undefined}
                />
              </Group>
            </UnstyledButton>
          ) : (
            text
          )
        }
      />
      {hasSummary && (
        <Collapse expanded={expanded} transitionDuration={150}>
          <Stack gap="xs" pt="xs">
            {context && (
              <Text size="xs" c="dimmed">
                {labels.userContext}: {context}
              </Text>
            )}
            {summary?.trim() && <Markdown content={summary} highlighter={highlighter} />}
          </Stack>
        </Collapse>
      )}
    </Box>
  );
});

CompactBoundary.displayName = 'CompactBoundary';
