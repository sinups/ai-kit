import React, { useState } from 'react';
import { Collapse, UnstyledButton } from '@mantine/core';
import type { ToolPart } from '../types';
import { ToolActivity } from '../tools/ToolActivity';
import { getToolProgress } from '../tools/tool-progress';
import {
  DEFAULT_TOOL_CALL_STATE_LABELS,
  type ToolCallLookups,
  type ToolCallStateLabels,
} from '../tools/tool-call-state';
import { resolveToolCallState } from '../approvals/approval-context';
import { useElapsed } from '../tools/use-elapsed';
import { ToolApprovalFooter } from '../tools/ToolApprovalFooter';
import {
  DEFAULT_TOOL_APPROVAL_OUTCOME_LABELS,
  getToolApprovalOutcomeText,
  useToolApproval,
  type ToolApprovalOutcomeLabels,
} from '../approvals/tool-approvals';
import { useChatLabels } from '../labels/chat-labels';
import { fillTemplate } from '../utils/fill-template';
import { ResponseRow } from './ResponseRow';
import { ToolCallRow } from './ToolCallRow';
import { CodeBlock } from '../CodeBlock/CodeBlock';
import type { SyntaxHighlighter } from '../utils/highlighter';
import { clampLines, getToolRowArgs, getToolRowName } from './rows-format';
import { readToolArgs, summarizeToolArgs } from '../tools/tool-args';
import {
  findToolCatalogEntry,
  getToolCatalogTitle,
  useToolPresentation,
} from '../tools/tool-presentation';
import {
  DEFAULT_TOOL_OUTPUT_LABELS,
  getToolOutputValue,
  readPartOutput,
  clipText,
  MAX_OUTPUT_CHARS,
  readCallToolResult,
  readResultText,
  readStructuredResult,
  resolveByPartType,
  summarizeToolOutput,
  type ToolOutputFormatters,
  type ToolOutputLabels,
} from './tool-output';
import { getEditSummary } from './rows-summary';
import { ToolResultContent } from '../tools/ToolResultContent';
import classes from './Rows.module.css';

const OUTPUT_LINES = 3;
const ERROR_LINES = 10;

export interface ToolPartRowLabels
  extends ToolCallStateLabels, ToolApprovalOutcomeLabels, ToolOutputLabels {
  /** Tail of a clipped output, `… +N lines` by default */
  hiddenLines: (count: number) => string;
  /** Row of a call that is running without progress, `Running…` by default */
  running: string;
  /** Row of a finished call that printed nothing, `(No output)` by default */
  noOutput: string;
  /** Hint on a result that can be opened, `show result` by default */
  showResult: string;
  /** Result of an edit, `Updated {file} with {added} additions and {removed} removals` by default */
  edited: string;
}

export const DEFAULT_TOOL_PART_ROW_LABELS: ToolPartRowLabels = {
  ...DEFAULT_TOOL_CALL_STATE_LABELS,
  ...DEFAULT_TOOL_APPROVAL_OUTCOME_LABELS,
  ...DEFAULT_TOOL_OUTPUT_LABELS,
  hiddenLines: (count) => `… +${count} ${count === 1 ? 'line' : 'lines'}`,
  running: 'Running…',
  noOutput: '(No output)',
  showResult: 'show result',
  edited: 'Updated {file} with {added} additions and {removed} removals',
};

export interface ToolPartRowProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Chat status from `useChat()`, used to tell a running call from an interrupted one */
  chatStatus?: string;
  /** Transcript lookups behind the visible state of the call, see `createToolCallLookups` */
  lookups?: ToolCallLookups;
  /** Shows how long the call has been running and the progress its server reports */
  showActivity?: boolean;
  /**
   * Permission request of the host, rendered under the gutter instead of the waiting line. Taken
   * from the `approvals` of `AgentChat` for this call id when omitted.
   */
  approval?: React.ReactNode;
  /**
   * Result formatters by part type, as `toolRenderers` are keyed; a server-wide
   * `tool-mcp__tracker__*` is allowed. A formatter that returns `null` leaves the default summary.
   */
  toolOutputs?: ToolOutputFormatters;
  /** Locale of numbers and dates in results, the locale of the runtime by default */
  locale?: string;
  /** Syntax highlighter for the opened result; the JSON stays plain when omitted */
  highlighter?: SyntaxHighlighter;
  /** Overrides of the default English labels */
  labels?: Partial<ToolPartRowLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** A tool call of the transcript as flat rows: the call itself and the rows that answer it */
export function ToolPartRow({
  part,
  chatStatus,
  lookups,
  showActivity = false,
  approval,
  toolOutputs,
  locale,
  highlighter,
  labels: labelsProp,
  className,
  style,
}: ToolPartRowProps) {
  const callStateLabels = useChatLabels('toolCall');
  const rowLabels = useChatLabels('toolRow');
  const labels = {
    ...DEFAULT_TOOL_PART_ROW_LABELS,
    ...callStateLabels,
    ...rowLabels,
    ...labelsProp,
  };
  const presentation = useToolPresentation();
  const outputFormatters = toolOutputs ?? presentation.outputs;
  const outputLocale = locale ?? presentation.locale;
  const catalogEntry = findToolCatalogEntry(presentation.catalog, part);
  const argsFormatter = resolveByPartType(presentation.args, part.type);
  const [expanded, setExpanded] = useState(false);
  const [opened, setOpened] = useState(false);
  const hostApproval = useToolApproval(part.toolCallId);
  const state = resolveToolCallState(part, hostApproval, { chatStatus, lookups });
  const isRunning = state === 'running';
  const isSettled = state === 'done' || state === 'error';
  const elapsed = useElapsed(part, showActivity && isRunning);
  const progress = showActivity && isRunning ? getToolProgress(part) : undefined;

  const { isPending: approvalPending, outcome, ...approvalFooter } = hostApproval ?? {};
  const approvalNode =
    approval ??
    (hostApproval && !outcome ? (
      <ToolApprovalFooter {...approvalFooter} isPending={approvalPending} />
    ) : undefined);
  const outcomeText =
    hostApproval && outcome ? getToolApprovalOutcomeText(hostApproval, labels) : undefined;
  const isReadable = Boolean(catalogEntry || argsFormatter);
  const args = isReadable ? readToolArgs(part.input) : {};
  const argsSummary = isReadable
    ? summarizeToolArgs(args, {
        schema: catalogEntry?.inputSchema,
        locale: outputLocale,
      })
    : '';
  const argsText = isReadable
    ? (argsFormatter?.(part, {
        state,
        args,
        summary: argsSummary,
        schema: catalogEntry?.inputSchema,
        locale: outputLocale,
      }) ?? argsSummary)
    : getToolRowArgs(part);

  const editSummary = isSettled ? getEditSummary(part) : undefined;
  const outputSchema = catalogEntry?.outputSchema;
  const output = part.state === 'output-error' ? part.errorText : (part.output ?? part.result);
  const callResult = readCallToolResult(output);
  const rawOutput = isSettled && !editSummary ? readPartOutput(part) : undefined;
  const summary =
    isSettled && !editSummary
      ? summarizeToolOutput(output, { locale: outputLocale, labels, schema: outputSchema })
      : '';
  const formatted = isSettled
    ? resolveByPartType(outputFormatters, part.type)?.(part, {
        state,
        output: getToolOutputValue(part),
        result: callResult ?? undefined,
        schema: outputSchema,
        summary,
        locale: outputLocale,
        labels,
      })
    : null;
  const customNode = formatted !== null && formatted !== undefined ? formatted : undefined;
  const isCustomText = typeof customNode === 'string';
  const clamped = clampLines(
    isCustomText ? customNode : customNode !== undefined ? '' : summary,
    state === 'error'
      ? ERROR_LINES
      : customNode === undefined && outputSchema?.type === 'array'
        ? OUTPUT_LINES + 1
        : OUTPUT_LINES
  );
  const structured = callResult ? readStructuredResult(callResult, outputSchema) : rawOutput;
  const resultText =
    isSettled && callResult && structured === undefined
      ? clipText(readResultText(callResult), MAX_OUTPUT_CHARS)
      : '';
  const isStructured = typeof structured === 'object' && structured !== null;
  const canExpand =
    customNode === undefined &&
    Boolean(clamped.text) &&
    (clamped.hidden > 0 || isStructured || summary.length > clamped.text.length);

  return (
    <ToolCallRow
      name={getToolCatalogTitle(catalogEntry) ?? getToolRowName(part)}
      args={argsText}
      state={state}
      className={className}
      style={style}
      trailingContent={elapsed ? <ToolActivity elapsed={elapsed} /> : undefined}
    >
      {approvalNode && <ResponseRow>{approvalNode}</ResponseRow>}
      {outcomeText && <ResponseRow tone="muted">{outcomeText}</ResponseRow>}
      {!approvalNode && !outcomeText && state === 'awaiting-permission' && (
        <ResponseRow tone="muted">{labels.awaitingPermission}</ResponseRow>
      )}
      {state === 'queued' && <ResponseRow tone="muted">{labels.queued}</ResponseRow>}
      {state === 'interrupted' && <ResponseRow tone="muted">{labels.interrupted}</ResponseRow>}
      {state === 'rejected' && !outcomeText && (
        <ResponseRow tone="muted">{labels.rejected}</ResponseRow>
      )}
      {isRunning &&
        (progress ? (
          <ResponseRow tone="muted">
            <ToolActivity progress={progress} />
          </ResponseRow>
        ) : (
          <ResponseRow tone="muted">{labels.running}</ResponseRow>
        ))}
      {editSummary && (
        <ResponseRow>
          {fillTemplate(labels.edited, {
            file: editSummary.file,
            added: String(editSummary.added),
            removed: String(editSummary.removed),
          })}
        </ResponseRow>
      )}
      {customNode !== undefined && !isCustomText && <ResponseRow>{customNode}</ResponseRow>}
      {isSettled && !editSummary && customNode === undefined && !clamped.text && !resultText && (
        <ResponseRow tone="muted">{labels.noOutput}</ResponseRow>
      )}
      {resultText && customNode === undefined && !clamped.text && (
        <ResponseRow tone="muted">
          <UnstyledButton
            className={classes.outputToggle}
            onClick={() => {
              setOpened(true);
              setExpanded((open) => !open);
            }}
            aria-expanded={expanded}
          >
            <span className={classes.hiddenLines}>{labels.showResult}</span>
          </UnstyledButton>
          {opened && (
            <Collapse
              expanded={expanded}
              transitionDuration={150}
              transitionTimingFunction="ease-out"
            >
              <div className={classes.outputDetail}>{resultText}</div>
            </Collapse>
          )}
        </ResponseRow>
      )}
      {clamped.text && (
        <ResponseRow tone={state === 'error' ? 'error' : 'default'}>
          {canExpand ? (
            <UnstyledButton
              className={classes.outputToggle}
              onClick={() => {
                setOpened(true);
                setExpanded((open) => !open);
              }}
              aria-expanded={expanded}
            >
              {clamped.text}
              <span className={classes.hiddenLines}>
                {clamped.hidden > 0 ? labels.hiddenLines(clamped.hidden) : labels.showResult}
              </span>
            </UnstyledButton>
          ) : (
            <>
              {clamped.text}
              {clamped.hidden > 0 && (
                <span className={classes.hiddenLines}>{labels.hiddenLines(clamped.hidden)}</span>
              )}
            </>
          )}
          {canExpand && opened && (
            <Collapse
              expanded={expanded}
              transitionDuration={150}
              transitionTimingFunction="ease-out"
            >
              <div className={classes.outputDetail}>
                {isStructured ? (
                  <CodeBlock
                    code={clipText(JSON.stringify(structured, null, 2), MAX_OUTPUT_CHARS)}
                    language="json"
                    highlighter={highlighter}
                    wrapLines
                  />
                ) : (
                  clipText(String(rawOutput ?? ''), MAX_OUTPUT_CHARS)
                )}
                {callResult && (
                  <ToolResultContent result={callResult} messageId={part.toolCallId ?? part.type} />
                )}
              </div>
            </Collapse>
          )}
        </ResponseRow>
      )}
    </ToolCallRow>
  );
}

ToolPartRow.displayName = 'ToolPartRow';
