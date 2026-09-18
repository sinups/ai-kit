import React, { useMemo, useState } from 'react';
import { Stack, Text } from '@mantine/core';
import { getToolApprovalOutcomeText, ToolApprovalSlot } from '../approvals/tool-approvals';
import { resolveToolCallState, useToolApproval } from '../approvals/approval-context';
import { CodeBlock } from '../CodeBlock/CodeBlock';
import { useChatLabels } from '../labels/chat-labels';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import { DEFAULT_MCP_TOOL_LABELS } from '../tools/McpTool';
import { ToolActivity } from '../tools/ToolActivity';
import { readToolArgs } from '../tools/tool-args';
import { DEFAULT_TOOL_CALL_STATE_LABELS, type ToolCallLookups } from '../tools/tool-call-state';
import {
  findToolCatalogEntry,
  getToolCatalogTitle,
  useFirstSeen,
  useToolPresentation,
} from '../tools/tool-presentation';
import { parseMcpToolType } from '../tools/tool-registry';
import { ThinkingTool } from '../tools/ThinkingTool';
import { ToolRenderer } from '../tools/ToolRenderer';
import { useElapsed } from '../tools/use-elapsed';
import type { ToolPart } from '../types';
import type { SyntaxHighlighter } from '../utils/highlighter';
import { cx } from '../utils/cx';
import {
  clipText,
  MAX_OUTPUT_CHARS,
  readCallToolResult,
  readResultText,
  readStructuredResult,
} from '../rows/tool-output';
import type { JsonSchema } from '../primitives/SchemaView/schema';
import { ToolResultContent } from '../tools/ToolResultContent';
import { getToolRowName } from '../rows/rows-format';
import { summarizeQuietResult } from './quiet-summary';
import classes from './Quiet.module.css';

export interface QuietToolRowProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Chat status from `useChat()`, used to tell a running call from an interrupted one */
  chatStatus?: string;
  /** Transcript lookups behind the visible state of the call, see `createToolCallLookups` */
  lookups?: ToolCallLookups;
  /** Shows how long the call has been running */
  showActivity?: boolean;
  /** Syntax highlighter of the opened arguments and result */
  highlighter?: SyntaxHighlighter;
  /** Wraps long lines in the opened details instead of scrolling them sideways */
  wrapLines?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Title of a quiet call: the catalog title, the readable MCP name, then the bare tool name */
export function readTitle(part: ToolPart, catalogTitle: string | undefined): string {
  return catalogTitle || parseMcpToolType(part.type)?.displayName || getToolRowName(part);
}

/**
 * A tool call as one quiet line: the title of the tool and what came of it. Arguments, the full
 * result and the approval outcome stay behind the chevron; only a call that waits for a decision
 * shows its card and the approve buttons.
 */
export function QuietToolRow({
  part,
  chatStatus,
  lookups,
  showActivity = false,
  highlighter,
  wrapLines,
  className,
  style,
}: QuietToolRowProps) {
  useFirstSeen()(part.toolCallId);
  const presentation = useToolPresentation();
  const mcpContext = useChatLabels('mcpTool');
  const callContext = useChatLabels('toolCall');
  const mcpLabels = { ...DEFAULT_MCP_TOOL_LABELS, ...mcpContext };
  const callLabels = { ...DEFAULT_TOOL_CALL_STATE_LABELS, ...callContext };
  const hostApproval = useToolApproval(part.toolCallId);
  const state = resolveToolCallState(part, hostApproval, { chatStatus, lookups });
  const isDeciding = state === 'awaiting-permission';
  const elapsed = useElapsed(part, showActivity && state === 'running' && !isDeciding);
  const [expanded, setExpanded] = useState(false);
  const [opened, setOpened] = useState(false);

  const outputSchema = findToolCatalogEntry(presentation.catalog, part)?.outputSchema;
  const { summary, hasDetails } = useMemo(() => {
    const isSettled = state === 'done' || state === 'error';
    const output = part.output ?? part.result;
    return {
      summary: summarizeQuietResult(
        part,
        state,
        {
          ...mcpLabels,
          rejected: callLabels.rejected,
          queued: callLabels.queued,
          interrupted: callLabels.interrupted,
        },
        outputSchema
      ),
      hasDetails:
        Object.keys(readToolArgs(part.input)).length > 0 ||
        (isSettled && output !== undefined && output !== null && output !== ''),
    };
  }, [part, state, mcpContext, callContext, outputSchema]);

  if (part.type === 'tool-Thinking') {
    return <ThinkingTool part={part} className={cx(classes.quiet, className)} style={style} />;
  }

  if (isDeciding) {
    const card = (
      <ToolRenderer
        part={part}
        chatStatus={chatStatus}
        lookups={lookups}
        showActivity={showActivity}
        wrapLines={wrapLines}
      />
    );
    return hostApproval ? (
      <ToolApprovalSlot toolCallId={part.toolCallId} framed className={className} style={style}>
        {card}
      </ToolApprovalSlot>
    ) : (
      card
    );
  }

  const title = readTitle(
    part,
    getToolCatalogTitle(findToolCatalogEntry(presentation.catalog, part))
  );
  const outcome = hostApproval?.outcome ? getToolApprovalOutcomeText(hostApproval) : null;

  return (
    <ToolRowBase
      shimmerLabel={title}
      completeLabel={title}
      isAnimating={state === 'running'}
      detail={summary || undefined}
      trailingContent={elapsed ? <ToolActivity elapsed={elapsed} /> : undefined}
      expandable={hasDetails || Boolean(outcome)}
      expanded={expanded}
      onToggleExpand={() => {
        setOpened(true);
        setExpanded((open) => !open);
      }}
      className={cx(classes.quiet, className)}
      style={style}
      data-state={state}
    >
      {opened && (
        <QuietToolDetails
          part={part}
          isSettled={state === 'done' || state === 'error'}
          outcome={outcome}
          schema={outputSchema}
          labels={mcpLabels}
          highlighter={highlighter}
          wrapLines={wrapLines}
        />
      )}
    </ToolRowBase>
  );
}

QuietToolRow.displayName = 'QuietToolRow';

function QuietToolDetails({
  part,
  isSettled,
  outcome,
  schema,
  labels,
  highlighter,
  wrapLines,
}: {
  part: ToolPart;
  isSettled: boolean;
  outcome: React.ReactNode;
  schema?: JsonSchema;
  labels: { arguments: string; result: string };
  highlighter?: SyntaxHighlighter;
  wrapLines?: boolean;
}) {
  const details = useMemo(() => {
    const args = readToolArgs(part.input);
    const output = isSettled ? (part.output ?? part.result) : undefined;
    const result = readCallToolResult(output);
    const structured = result ? readStructuredResult(result, schema) : output;
    const text = result ? readResultText(result) : typeof output === 'string' ? output : '';
    return {
      argsJson: Object.keys(args).length > 0 ? JSON.stringify(args, null, 2) : null,
      result,
      json:
        structured !== undefined && structured !== null && typeof structured !== 'string'
          ? clipText(JSON.stringify(structured, null, 2), MAX_OUTPUT_CHARS)
          : null,
      text: clipText(text, MAX_OUTPUT_CHARS),
    };
  }, [part, isSettled, schema]);
  const { argsJson, result, json, text } = details;

  const resultNode = json ? (
    <CodeBlock
      code={json}
      language="json"
      title={labels.result}
      highlighter={highlighter}
      wrapLines={wrapLines}
    />
  ) : text ? (
    <CodeBlock
      code={text}
      language="text"
      title={labels.result}
      highlighter={highlighter}
      wrapLines
    />
  ) : null;

  return (
    <Stack gap="xs" className={classes.details}>
      {argsJson && (
        <CodeBlock
          code={argsJson}
          language="json"
          title={labels.arguments}
          highlighter={highlighter}
          wrapLines
        />
      )}
      {resultNode}
      {result && <ToolResultContent result={result} messageId={part.toolCallId ?? part.type} />}
      {outcome && (
        <Text size="xs" c="dimmed">
          {outcome}
        </Text>
      )}
    </Stack>
  );
}
