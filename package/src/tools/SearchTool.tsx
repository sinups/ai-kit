import React, { memo } from 'react';
import { IconFileText } from '@tabler/icons-react';
import { useToolComplete } from '../hooks/use-tool-complete';
import type { SourceType } from '../icons/source-icons';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { ToolPart } from '../types';
import type { StepState, ToolCallStep } from '../types/timeline';
import { getLegacyToolState, getPartInput, getPartOutput } from '../utils/format-tool';
import { mapToolInvocationToStep, mapToolStateToStepState } from '../utils/tool-adapters';
import classes from './SearchTool.module.css';

export type SearchResult = { source: SourceType; title: string; date: string };

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
  className,
  style,
}: SearchGroupRichProps) {
  const anyAnimating = toolSteps.some((s) => stepStates[s.id] === 'animating');
  const searchQuery = toolSteps.find((s) => s.searchQuery)?.searchQuery ?? 'searching...';
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
        shimmerLabel="Searching..."
        completeLabel={`Found ${totalResults} results`}
        isAnimating={anyAnimating}
        expandable={hasExpandableContent}
        defaultOpen={defaultOpen}
        className={className}
        style={style}
      >
        <div className={classes.panel}>
          <div className={classes.header}>
            <span className={classes.headerLabel}>Searched for</span>{' '}
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
      if (typeof source !== 'string' || typeof title !== 'string' || typeof date !== 'string') {
        return null;
      }
      return { source: source as SourceType, title, date };
    })
    .filter((item): item is SearchResult => Boolean(item));
  return parsed.length > 0 ? parsed : undefined;
}

/** Renders `tool-WebSearch` / `tool-Grep` / `tool-Glob` parts */
export const SearchTool = memo(function SearchTool({
  part,
  results,
  defaultOpen,
  className,
  style,
}: SearchToolProps) {
  const legacyState = getLegacyToolState(part);
  const output = getPartOutput(part);
  const step = mapToolInvocationToStep(part.toolCallId ?? (part.id as string) ?? 'search', {
    toolName: part.type?.replace('tool-', '') || 'WebSearch',
    args: getPartInput(part),
    state: legacyState,
    result: output,
  });
  const stepState = mapToolStateToStepState(legacyState);
  const stepStates = { [step.id]: stepState };
  const noop = () => {};

  return (
    <SearchGroupRich
      toolSteps={[step]}
      stepStates={stepStates}
      onStepComplete={noop}
      results={results ?? normalizeResults(output?.results)}
      defaultOpen={defaultOpen}
      className={className}
      style={style}
    />
  );
});
