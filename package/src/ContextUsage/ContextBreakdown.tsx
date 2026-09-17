import React, { memo, useId, useMemo, useState } from 'react';
import { Box, Collapse, Progress, Tooltip, UnstyledButton } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import { fillTemplate } from '../utils/fill-template';
import { formatTokens } from '../utils/format-tokens';
import {
  getBreakdownTotal,
  getColorVar,
  getGroupShade,
  getGroupTokens,
  sortBreakdownItems,
  sortSuggestions,
  type ContextBreakdownGroup,
  type ContextSuggestion,
} from './context-breakdown';
import { formatPercent, getUsageRatio } from './context-usage';
import classes from './ContextBreakdown.module.css';

export interface ContextBreakdownLabels {
  /** `{used}`, `{total}` and `{percent}` are replaced */
  summary: string;
  /** Header of the suggestions list */
  suggestions: string;
  /** Savings text, `{tokens}` is replaced */
  savings: string;
  /** Accessible label of the usage bar */
  bar: string;
}

export interface ContextBreakdownProps {
  /** Groups of the context, for example System, Tools, MCP tools, Agents, Memory files, Skills, Messages */
  groups: ContextBreakdownGroup[];
  /** Context window size in tokens */
  total: number;
  /** Tokens in the context, the sum of `groups` by default */
  used?: number;
  /** Ways to free context, most severe first */
  suggestions?: ContextSuggestion[];
  /** `compact` fits the ContextUsage popover, `full` a settings page, `full` by default */
  variant?: 'compact' | 'full';
  /** Ids of groups expanded on the first render */
  defaultExpanded?: string[];
  /** Overrides of the default English labels */
  labels?: Partial<ContextBreakdownLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const DEFAULT_CONTEXT_BREAKDOWN_LABELS: ContextBreakdownLabels = {
  summary: '{used} / {total} tokens · {percent}',
  suggestions: 'Suggestions',
  savings: 'frees about {tokens} tokens',
  bar: 'Context usage by group',
};

/** What fills the context window, group by group, with suggestions to free space */
export const ContextBreakdown = memo(function ContextBreakdown({
  groups,
  total,
  used,
  suggestions = [],
  variant = 'full',
  defaultExpanded = [],
  labels: labelsProp,
  className,
  style,
}: ContextBreakdownProps) {
  const labels = { ...DEFAULT_CONTEXT_BREAKDOWN_LABELS, ...labelsProp };
  const baseId = useId();
  const [expanded, setExpanded] = useState<string[]>(defaultExpanded);
  const usedTokens = used ?? getBreakdownTotal(groups);
  const ratio = getUsageRatio(usedTokens, total);
  const sortedSuggestions = useMemo(() => sortSuggestions(suggestions), [suggestions]);

  const toggle = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  return (
    <Box className={cx(classes.root, className)} style={style} data-variant={variant}>
      <div className={classes.total}>
        {fillTemplate(labels.summary, {
          used: formatTokens(usedTokens),
          total: formatTokens(total),
          percent: formatPercent(ratio),
        })}
      </div>

      <Progress.Root size="xs" aria-label={labels.bar} classNames={{ root: classes.bar }}>
        {groups.map((group, index) => {
          const tokens = getGroupTokens(group);
          const value = getUsageRatio(tokens, total) * 100;
          if (value <= 0) {
            return null;
          }
          return (
            <Tooltip
              key={group.id}
              label={`${group.label} · ${formatTokens(tokens)}`}
              disabled={variant === 'compact'}
              withArrow
            >
              <Progress.Section value={value} color={getGroupShade(group, index)} />
            </Tooltip>
          );
        })}
      </Progress.Root>

      <div className={classes.groups}>
        {groups.map((group, index) => {
          const tokens = getGroupTokens(group);
          const items = group.items ?? [];
          const expandable = items.length > 0;
          const isOpen = expandable && expanded.includes(group.id);
          const panelId = `${baseId}-${group.id}`;
          const row = (
            <>
              <span
                className={classes.swatch}
                style={{ backgroundColor: getColorVar(getGroupShade(group, index)) }}
              />
              <span className={classes.labelCell}>
                <span className={classes.label}>{group.label}</span>
                {expandable && (
                  <IconChevronRight size={12} className={classes.chevron} aria-hidden />
                )}
              </span>
              <span className={classes.numeric}>{formatTokens(tokens)}</span>
              <span className={cx(classes.numeric, classes.percent)}>
                {formatPercent(getUsageRatio(tokens, total))}
              </span>
            </>
          );

          return (
            <div key={group.id}>
              {expandable ? (
                <UnstyledButton
                  className={classes.row}
                  data-expanded={isOpen || undefined}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(group.id)}
                >
                  {row}
                </UnstyledButton>
              ) : (
                <div className={classes.row}>{row}</div>
              )}
              {expandable && (
                <Collapse expanded={isOpen} id={panelId}>
                  <div className={classes.items}>
                    {sortBreakdownItems(items).map((item) => (
                      <div key={item.id} className={classes.item}>
                        <span className={classes.label}>
                          {item.label}
                          {item.description && variant === 'full' && (
                            <span className={classes.description}> · {item.description}</span>
                          )}
                        </span>
                        <span className={classes.numeric}>{formatTokens(item.tokens)}</span>
                      </div>
                    ))}
                  </div>
                </Collapse>
              )}
            </div>
          );
        })}
      </div>

      {sortedSuggestions.length > 0 && (
        <div className={classes.suggestions}>
          <div className={classes.heading}>{labels.suggestions}</div>
          {sortedSuggestions.map((suggestion) => (
            <div
              key={suggestion.id ?? suggestion.title}
              className={classes.suggestion}
              data-severity={suggestion.severity}
            >
              <div className={classes.suggestionText}>
                <span className={classes.severity} aria-hidden />
                <span className={classes.suggestionTitle}>{suggestion.title}</span>
                {suggestion.description && variant === 'full' && (
                  <span className={classes.description}> {suggestion.description}</span>
                )}
                {suggestion.savings ? (
                  <span className={classes.savings}>
                    {' '}
                    {fillTemplate(labels.savings, { tokens: formatTokens(suggestion.savings) })}
                  </span>
                ) : null}
              </div>
              {suggestion.action && (
                <UnstyledButton className={classes.action} onClick={suggestion.action.onClick}>
                  {suggestion.action.label}
                </UnstyledButton>
              )}
            </div>
          ))}
        </div>
      )}
    </Box>
  );
});

ContextBreakdown.displayName = 'ContextBreakdown';
