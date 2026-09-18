import React, { memo, useMemo } from 'react';
import { IconFileText } from '@tabler/icons-react';
import { useToolComplete } from '../hooks/use-tool-complete';
import type { SourceType } from '../icons/source-icons';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { ToolPart } from '../types';
import type { StepState, ToolCallStep } from '../types/timeline';
import { getPartOutput } from '../utils/format-tool';
import { useChatLabels } from '../labels/chat-labels';
import { resolveToolTitleLabels, toolRegistry } from './tool-registry';
import { noopComplete, useToolStep } from './use-tool-step';
import classes from './SearchTool.module.css';

export type SearchResult = { source: SourceType; title: string; date?: string };

export interface SearchToolLabels {
  /** Shimmer label while the search runs, `Searching...` by default */
  searching: string;
  /** Row label once the search has finished, `Found 3 results` by default */
  found: (count: number) => string;
  /** Caption before the query in the results panel, `Searched for` by default */
  searchedFor: string;
  /** Query shown when no step carries one, `searching...` by default */
  unknownQuery: string;
}

export const DEFAULT_SEARCH_TOOL_LABELS: SearchToolLabels = {
  searching: 'Searching...',
  found: (count) => `Found ${count} results`,
  searchedFor: 'Searched for',
  unknownQuery: 'searching...',
};

export interface SearchGroupRichProps {
  /** Search steps rendered as one row, the first `searchQuery` is shown in the header */
  toolSteps: ToolCallStep[];
  /** Animation state of each step keyed by step id */
  stepStates: Record<string, StepState>;
  /** Called with the step id once its duration elapses */
  onStepComplete: (id: string) => void;
  /** Results shown in the expandable panel */
  results?: SearchResult[];
  /** Initial expanded state of the results panel */
  defaultOpen?: boolean;
  /** Row label once the search has finished, `labels.found` by default */
  completeLabel?: string;
  /** Overrides of the default English labels */
  labels?: Partial<SearchToolLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function CompleteTracker({
  step,
  isAnimating,
  onComplete,
}: {
  step: ToolCallStep;
  isAnimating: boolean;
  onComplete: (id: string) => void;
}) {
  useToolComplete(isAnimating, step.duration, () => onComplete(step.id));
  return null;
}

/** "Searching..." row that expands into a list of search results */
export function SearchGroupRich({
  toolSteps,
  stepStates,
  onStepComplete,
  results = [],
  defaultOpen,
  completeLabel,
  labels: labelsProp,
  className,
  style,
}: SearchGroupRichProps) {
  const contextLabels = useChatLabels('searchTool');
  const labels = { ...DEFAULT_SEARCH_TOOL_LABELS, ...contextLabels, ...labelsProp };
  const anyAnimating = toolSteps.some((s) => stepStates[s.id] === 'animating');
  const searchQuery = toolSteps.find((s) => s.searchQuery)?.searchQuery ?? labels.unknownQuery;
  const totalResults = results.length;
  const hasExpandableContent = totalResults > 0;

  return (
    <>
      {toolSteps.map((step) => (
        <CompleteTracker
          key={step.id}
          step={step}
          isAnimating={stepStates[step.id] === 'animating'}
          onComplete={onStepComplete}
        />
      ))}
      <ToolRowBase
        shimmerLabel={labels.searching}
        completeLabel={completeLabel ?? labels.found(totalResults)}
        isAnimating={anyAnimating}
        expandable={hasExpandableContent}
        defaultOpen={defaultOpen}
        className={className}
        style={style}
      >
        <div className={classes.panel}>
          <div className={classes.header}>
            <span className={classes.headerLabel}>{labels.searchedFor}</span>{' '}
            <span className={classes.query}>&ldquo;{searchQuery}&rdquo;</span>
          </div>
          <div className={classes.list}>
            <div className={classes.items}>
              {results.map((result, i) => (
                <div key={i} className={classes.item}>
                  <span className={classes.itemIcon}>
                    <IconFileText size={16} />
                  </span>
                  <span className={classes.title}>{result.title}</span>
                  <span className={classes.meta}>{result.date || result.source}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ToolRowBase>
    </>
  );
}

export interface SearchToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Results override, `part.output.results` is used when omitted */
  results?: SearchResult[];
  /** Initial expanded state of the results panel */
  defaultOpen?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<SearchToolLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

function normalizeResults(value: unknown): SearchResult[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const parsed = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const { source, title, date } = item as { source?: unknown; title?: unknown; date?: unknown };
      if (typeof source !== 'string' || typeof title !== 'string') {
        return null;
      }
      const result: SearchResult = { source: source as SourceType, title };
      if (typeof date === 'string') {
        result.date = date;
      }
      return result;
    })
    .filter((item): item is SearchResult => item !== null);
  return parsed.length > 0 ? parsed : undefined;
}

/** Renders `tool-WebSearch` / `tool-Grep` / `tool-Glob` parts */
export const SearchTool = memo(function SearchTool({
  part,
  results,
  defaultOpen,
  labels,
  className,
  style,
}: SearchToolProps) {
  const output = getPartOutput(part);
  const { step, stepState } = useToolStep(
    part,
    part.type?.replace('tool-', '') || 'WebSearch',
    'search'
  );
  const toolSteps = useMemo(() => [step], [step]);
  const stepStates = useMemo(() => ({ [step.id]: stepState }), [step.id, stepState]);
  const registryMeta =
    part.type === 'tool-Grep' || part.type === 'tool-Glob' ? toolRegistry[part.type] : undefined;
  const titleLabels = resolveToolTitleLabels(useChatLabels('toolTitles'));

  return (
    <SearchGroupRich
      toolSteps={toolSteps}
      stepStates={stepStates}
      onStepComplete={noopComplete}
      results={results ?? normalizeResults(output?.results)}
      completeLabel={registryMeta?.title(part, titleLabels)}
      labels={labels}
      defaultOpen={defaultOpen}
      className={className}
      style={style}
    />
  );
});

SearchTool.displayName = 'SearchTool';
