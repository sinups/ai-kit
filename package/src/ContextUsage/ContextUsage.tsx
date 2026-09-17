import React, { memo, useState } from 'react';
import {
  Box,
  ColorSwatch,
  MantineColor,
  Popover,
  RingProgress,
  UnstyledButton,
} from '@mantine/core';
import { useTimeout } from '@mantine/hooks';
import { cx } from '../utils/cx';
import { fillTemplate } from '../utils/fill-template';
import { formatTokens } from '../utils/format-tokens';
import {
  ContextBreakdown,
  DEFAULT_CONTEXT_BREAKDOWN_LABELS,
  type ContextBreakdownLabels,
} from './ContextBreakdown';
import {
  getColorVar,
  getGroupShade,
  getGroupTokens,
  type ContextBreakdownGroup,
  type ContextSuggestion,
} from './context-breakdown';
import {
  formatPercent,
  getUsageLevel,
  getUsageRatio,
  type ContextUsageLevel,
} from './context-usage';
import classes from './ContextUsage.module.css';

export type ContextUsageSegment = {
  label: string;
  value: number;
  color?: MantineColor;
};

export interface ContextUsageProps {
  /** Tokens currently in the context window */
  used: number;
  /** Context window size in tokens */
  total: number;
  /** Breakdown of `used`, for example system prompt, tools and messages */
  segments?: ContextUsageSegment[];
  /** Detailed groups shown in the details instead of `segments`, expandable to their items */
  breakdown?: ContextBreakdownGroup[];
  /** Ways to free context, shown under the breakdown */
  suggestions?: ContextSuggestion[];
  /** Overrides for the English labels of the breakdown, `summary` is also the totals line without `breakdown` */
  breakdownLabels?: Partial<ContextBreakdownLabels>;
  /** Ratio at which the ring turns to the warning color, `0.8` by default */
  warnAt?: number;
  /** Ratio at which the ring turns to the danger color, `0.95` by default */
  dangerAt?: number;
  /** Ring size in px, `20` by default */
  size?: number;
  /** Shows the percentage next to the ring */
  showLabel?: boolean;
  /** Renders the compact button in the details once usage reaches `warnAt` */
  onCompact?: () => void;
  /** Compact button label, `Compact conversation` by default */
  compactLabel?: string;
  /** Accessible label of the trigger, `Context usage` by default */
  ariaLabel?: string;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const LEVEL_COLOR: Record<ContextUsageLevel, MantineColor> = {
  normal: 'gray.6',
  warning: 'yellow.6',
  danger: 'red.6',
};

const SEGMENT_COLORS: MantineColor[] = ['blue.5', 'violet.5', 'teal.5', 'orange.5', 'pink.5'];

const HOVER_CLOSE_DELAY = 150;

/** Compact ring showing how much of the context window is used, with a breakdown on hover or click */
export const ContextUsage = memo(function ContextUsage({
  used,
  total,
  segments,
  breakdown,
  suggestions,
  breakdownLabels,
  warnAt = 0.8,
  dangerAt = 0.95,
  size = 20,
  showLabel,
  onCompact,
  compactLabel = 'Compact conversation',
  ariaLabel = 'Context usage',
  className,
  style,
}: ContextUsageProps) {
  const [openedBy, setOpenedBy] = useState<'hover' | 'click' | null>(null);
  const hoverClose = useTimeout(
    () => setOpenedBy((current) => (current === 'hover' ? null : current)),
    HOVER_CLOSE_DELAY
  );
  const hoverOpen = () => {
    hoverClose.clear();
    setOpenedBy((current) => current ?? 'hover');
  };
  const close = () => {
    hoverClose.clear();
    setOpenedBy(null);
  };
  const toggle = () => {
    hoverClose.clear();
    setOpenedBy((current) => (current === 'click' ? null : 'click'));
  };
  const ratio = getUsageRatio(used, total);
  const level = getUsageLevel(ratio, warnAt, dangerAt);
  const hasBreakdown = Boolean(breakdown && breakdown.length > 0);
  const hasSegments = !hasBreakdown && Boolean(segments && segments.length > 0);
  const segmentColor = (segment: ContextUsageSegment, index: number) =>
    segment.color ?? SEGMENT_COLORS[index % SEGMENT_COLORS.length];

  const sections =
    hasBreakdown && level === 'normal'
      ? breakdown!.map((group, index) => ({
          value: getUsageRatio(getGroupTokens(group), total) * 100,
          color: getGroupShade(group, index),
        }))
      : hasSegments && level === 'normal'
        ? segments!.map((segment, index) => ({
            value: getUsageRatio(segment.value, total) * 100,
            color: segmentColor(segment, index),
          }))
        : [{ value: ratio * 100, color: LEVEL_COLOR[level] }];

  return (
    <Box className={cx(classes.root, className)} style={style} data-level={level}>
      <Popover
        opened={openedBy !== null}
        onDismiss={close}
        trapFocus={openedBy === 'click'}
        returnFocus
        position="top-end"
        offset={6}
        shadow="lg"
        radius={10}
        classNames={{
          dropdown: cx(classes.dropdown, hasBreakdown && classes.dropdownBreakdown),
        }}
      >
        <Popover.Target>
          <UnstyledButton
            className={classes.trigger}
            data-with-label={showLabel || undefined}
            aria-label={`${ariaLabel}: ${formatPercent(ratio)}`}
            aria-expanded={openedBy !== null}
            onClick={toggle}
            onMouseEnter={hoverOpen}
            onMouseLeave={hoverClose.start}
          >
            <RingProgress
              size={size}
              thickness={Math.max(2, Math.round(size / 8))}
              sections={sections}
              rootColor="var(--ae-border)"
            />
            {showLabel && <span className={classes.label}>{formatPercent(ratio)}</span>}
          </UnstyledButton>
        </Popover.Target>
        <Popover.Dropdown
          data-level={level}
          onMouseEnter={hoverOpen}
          onMouseLeave={hoverClose.start}
        >
          {hasBreakdown ? (
            <ContextBreakdown
              variant="compact"
              groups={breakdown!}
              used={used}
              total={total}
              suggestions={suggestions}
              labels={breakdownLabels}
            />
          ) : (
            <>
              <div className={classes.total}>
                {fillTemplate(
                  breakdownLabels?.summary ?? DEFAULT_CONTEXT_BREAKDOWN_LABELS.summary,
                  {
                    used: formatTokens(used),
                    total: formatTokens(total),
                    percent: formatPercent(ratio),
                  }
                )}
              </div>
              {hasSegments && (
                <div className={classes.rows}>
                  {segments!.map((segment, index) => (
                    <div key={segment.label} className={classes.row}>
                      <ColorSwatch
                        size={8}
                        withShadow={false}
                        color={getColorVar(segmentColor(segment, index))}
                        className={classes.swatch}
                      />
                      <span className={classes.segmentLabel}>{segment.label}</span>
                      <span className={classes.numeric}>{formatTokens(segment.value)}</span>
                      <span className={classes.numeric}>
                        {formatPercent(getUsageRatio(segment.value, total))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {onCompact && level !== 'normal' && (
            <UnstyledButton className={classes.compact} onClick={onCompact}>
              {compactLabel}
            </UnstyledButton>
          )}
        </Popover.Dropdown>
      </Popover>
    </Box>
  );
});

ContextUsage.displayName = 'ContextUsage';
