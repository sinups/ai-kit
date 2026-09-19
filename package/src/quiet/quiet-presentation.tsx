import React from 'react';
import { groupToolRuns } from '../MessageList/tool-runs';
import type { TranscriptPresentation } from '../MessageList/transcript-presentation';
import { resolveToolCallState, type ToolApprovals } from '../approvals/approval-context';
import type { ToolCallLookups } from '../tools/tool-call-state';
import { findToolCatalogEntry, type ToolCatalog } from '../tools/tool-presentation';
import { parseMcpToolType } from '../tools/tool-registry';
import type { ToolPart } from '../types';
import { isTextPart, isV5ToolPart } from '../utils/parts';
import { QuietToolRow } from './QuietToolRow';
import { QuietToolRun } from './QuietToolRun';

/**
 * Quiet tool calls for the `presentation` of `MessageList` and `AgentChat`: an MCP call is one
 * muted line with its outcome, the activity of a turn before its answer folds into one line, and
 * only a call that waits for a decision shows a card. Passed as a value so it only reaches the
 * bundle of a host that uses it.
 */
export interface QuietPresentation extends TranscriptPresentation {
  kind: 'quiet';
  /** Which parts go quiet: MCP calls, thinking and calls the tool catalog describes; the rest keep their cards */
  isQuiet: (part: ToolPart, catalog?: ToolCatalog) => boolean;
  /** Whether a quiet part may fold with its neighbours: thinking and calls that neither failed nor wait for a decision */
  isFoldable: (
    part: ToolPart,
    chatStatus?: string,
    lookups?: ToolCallLookups,
    approvals?: ToolApprovals,
    catalog?: ToolCatalog
  ) => boolean;
}

/** An MCP call, or a call of the host that its tool catalog describes, such as a local tool */
function isCatalogCall(part: ToolPart, catalog?: ToolCatalog): boolean {
  return (
    part.type === 'dynamic-tool' ||
    parseMcpToolType(part.type) !== null ||
    findToolCatalogEntry(catalog, part) !== undefined
  );
}

function isQuiet(part: ToolPart, catalog?: ToolCatalog): boolean {
  return isCatalogCall(part, catalog) || part.type === 'tool-Thinking';
}

function isFoldable(
  part: ToolPart,
  chatStatus?: string,
  lookups?: ToolCallLookups,
  approvals?: ToolApprovals,
  catalog?: ToolCatalog
): boolean {
  if (part.type === 'tool-Thinking') {
    return true;
  }
  if (!isCatalogCall(part, catalog)) {
    return false;
  }
  const state = resolveToolCallState(part, approvals?.[part.toolCallId ?? ''], {
    chatStatus,
    lookups,
  });
  return state === 'done' || state === 'running';
}

export const quietPresentation: QuietPresentation = {
  kind: 'quiet',
  isQuiet,
  isFoldable,
  showsActivity: (parts, catalog) => {
    const last = [...parts].reverse().find((part) => !(isTextPart(part) && !part.text.trim()));
    return Boolean(
      last &&
      isV5ToolPart(last) &&
      isFoldable(last as ToolPart, 'streaming', undefined, undefined, catalog)
    );
  },
  renderParts: (entries, renderDefault, context) => {
    const rowProps = {
      chatStatus: context.chatStatus,
      lookups: context.lookups,
      showActivity: context.showActivity,
      highlighter: context.highlighter,
      wrapLines: context.wrapLines,
    };
    const segments = groupToolRuns(
      entries,
      ({ part }) =>
        isV5ToolPart(part) &&
        isFoldable(
          part as ToolPart,
          context.chatStatus,
          context.lookups,
          context.approvals,
          context.catalog
        ),
      1
    );
    const firstRun = segments.findIndex((segment) => segment.kind === 'run');
    return segments.map((segment, position) => {
      if (segment.kind === 'run') {
        const parts = segment.items.map((entry) => entry.part as ToolPart);
        return (
          <QuietToolRun
            key={`quiet-${parts[0].toolCallId ?? `${context.messageId}-${segment.items[0].index}`}`}
            parts={parts}
            labels={context.runLabels}
            isTail={context.chatStatus === 'streaming' && position === segments.length - 1}
            turnStartedAt={position === firstRun ? context.turnStartedAt : undefined}
            {...rowProps}
          />
        );
      }
      const { part, index } = segment.item;
      if (!isV5ToolPart(part) || !isQuiet(part as ToolPart, context.catalog)) {
        return renderDefault(segment.item);
      }
      const toolPart = part as ToolPart;
      return (
        <QuietToolRow
          key={toolPart.toolCallId ?? `${context.messageId}-tool-${index}`}
          part={toolPart}
          {...rowProps}
        />
      );
    });
  },
};
