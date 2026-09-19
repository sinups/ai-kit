import React, { memo, useMemo } from 'react';
import { Box, Text } from '@mantine/core';
import { CodeBlock } from '../CodeBlock/CodeBlock';
import { Markdown } from '../Markdown/Markdown';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { ToolPart } from '../types';
import { cx } from '../utils/cx';
import { fillTemplate } from '../utils/fill-template';
import { useChatLabels } from '../labels/chat-labels';
import { areToolPropsEqual, getPartInput, getToolStatus } from '../utils/format-tool';
import type { JsonSchema } from '../primitives/SchemaView/schema';
import type { McpToolInfo } from './tool-registry';
import { readToolArgs, summarizeToolArgs } from './tool-args';
import { useToolApproval } from '../approvals/approval-context';
import { deriveToolCallState } from './tool-call-state';
import {
  findToolCatalogEntry,
  getToolCatalogTitle,
  useToolPresentation,
} from './tool-presentation';
import {
  clipText,
  DEFAULT_TOOL_OUTPUT_LABELS,
  getToolOutputValue,
  MAX_OUTPUT_CHARS,
  readCallToolResult,
  readResultText,
  readStructuredResult,
  resolveByPartType,
  summarizeToolOutput,
  unwrapToolOutput,
  type ToolOutputLabels,
} from '../rows/tool-output';
import { ToolResultContent } from './ToolResultContent';
import classes from './McpTool.module.css';

export interface McpToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Parsed server/tool names, see `parseMcpToolType` */
  mcpInfo: McpToolInfo;
  /** Content rendered at the end of the row, for example `ToolActivity` with elapsed time */
  trailingContent?: React.ReactNode;
  /** Chat status from `useChat()`, used to tell a pending tool from an interrupted one */
  chatStatus?: string;
  /** Initial expanded state of the output panel */
  defaultOpen?: boolean;
  /** Overrides of the default English labels; verb dictionaries are merged with the defaults */
  labels?: Partial<McpToolLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const PRIORITY_ARGS = [
  'query',
  'question',
  'email',
  'name',
  'id',
  'customer',
  'url',
  'issue',
  'body',
  'summary',
  'title',
];

export interface McpToolLabels extends ToolOutputLabels {
  /** Form of the leading verb of the tool name while the call runs, keyed by that verb: `{ List: 'Listing' }` */
  activeVerbs: Record<string, string>;
  /** Form of the leading verb once the call finished, keyed by that verb: `{ List: 'Listed' }` */
  completedVerbs: Record<string, string>;
  /** Title while the arguments stream in, `{name}` is replaced, `Preparing {name}` by default */
  preparing: string;
  /** Shown for a call interrupted before its result, `{name}` is replaced, `{name} interrupted` by default */
  interrupted: string;
  /** Title of the full arguments in the opened card, `Arguments` by default */
  arguments: string;
  /** Title of the result in the opened quiet row, `Result` by default */
  result: string;
  /** Short state of a failed call in the quiet row, `Error` by default */
  failed: string;
}

const ACTIVE_VERBS: Record<string, string> = {
  List: 'Listing',
  Get: 'Getting',
  Create: 'Creating',
  Update: 'Updating',
  Delete: 'Deleting',
  Search: 'Searching',
  Fetch: 'Fetching',
  Retrieve: 'Retrieving',
  Send: 'Sending',
  Generate: 'Generating',
  Add: 'Adding',
  Remove: 'Removing',
  Modify: 'Modifying',
  Draft: 'Drafting',
  Manage: 'Managing',
  Query: 'Querying',
  Start: 'Starting',
  Set: 'Setting',
  Check: 'Checking',
  Find: 'Finding',
};

const COMPLETED_VERBS: Record<string, string> = {
  List: 'Listed',
  Get: 'Got',
  Create: 'Created',
  Update: 'Updated',
  Delete: 'Deleted',
  Search: 'Searched',
  Fetch: 'Fetched',
  Retrieve: 'Retrieved',
  Send: 'Sent',
  Generate: 'Generated',
  Add: 'Added',
  Remove: 'Removed',
  Modify: 'Modified',
  Draft: 'Drafted',
  Manage: 'Managed',
  Query: 'Queried',
  Start: 'Started',
  Set: 'Set',
  Check: 'Checked',
  Find: 'Found',
};

export const DEFAULT_MCP_TOOL_LABELS: McpToolLabels = {
  activeVerbs: ACTIVE_VERBS,
  completedVerbs: COMPLETED_VERBS,
  preparing: 'Preparing {name}',
  ...DEFAULT_TOOL_OUTPUT_LABELS,
  arguments: 'Arguments',
  result: 'Result',
  failed: 'Error',
  interrupted: '{name} interrupted',
};

function conjugate(info: McpToolInfo, verbs: Record<string, string>): string {
  const words = info.displayName.split(' ');
  const verb = words[0];
  const rest = words.slice(1).join(' ');
  const form = verbs[verb];
  if (!form) {
    return info.displayName;
  }
  return rest ? `${form} ${rest}` : form;
}

function formatMcpArgs(input: unknown): string {
  if (!input || typeof input !== 'object') {
    return '';
  }
  const entries = Object.entries(input as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) {
    return '';
  }

  const sorted = [...entries].sort(([a], [b]) => {
    const ai = PRIORITY_ARGS.indexOf(a);
    const bi = PRIORITY_ARGS.indexOf(b);
    if (ai !== -1 && bi !== -1) {
      return ai - bi;
    }
    if (ai !== -1) {
      return -1;
    }
    if (bi !== -1) {
      return 1;
    }
    return 0;
  });

  const parts: string[] = [];
  for (const [key, value] of sorted) {
    if (parts.length >= 2) {
      break;
    }
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    const display = val.length > 30 ? `${val.slice(0, 27)}...` : val;
    parts.push(`${key}: ${display}`);
  }
  return parts.join('  ');
}

/** Output of an MCP call as 0.3 read it, kept for existing renderers; see `unwrapToolOutput` */
export function unwrapMcpOutput(output: any): any {
  return output ? unwrapToolOutput(output) : output;
}

/** Backtick fence longer than any backtick run inside the text, at least three characters */
function codeFence(text: string): string {
  let longest = 0;
  for (const match of text.matchAll(/`+/g)) {
    longest = Math.max(longest, match[0].length);
  }
  return '`'.repeat(Math.max(3, longest + 1));
}

function formatOutputForDisplay(output: unknown, schema: JsonSchema | undefined): string {
  const result = readCallToolResult(output);
  const structured = result ? readStructuredResult(result, schema) : output;
  const text =
    structured !== undefined && typeof structured !== 'string'
      ? JSON.stringify(structured, null, 2)
      : result
        ? readResultText(result)
        : String(structured ?? '');
  return clipText(text, MAX_OUTPUT_CHARS);
}

/** Renders `tool-mcp__<server>__<tool>` parts with a verb-conjugated title and JSON output */
export const McpTool = memo(function McpTool({
  part,
  mcpInfo,
  trailingContent,
  chatStatus,
  defaultOpen,
  labels: labelsProp,
  className,
  style,
}: McpToolProps) {
  const status = getToolStatus(part, chatStatus);
  const hostApproval = useToolApproval(part.toolCallId);
  const isWaitingForDecision = Boolean(hostApproval && !hostApproval.outcome);
  const isPending = status.isPending && !isWaitingForDecision;
  const isRejected =
    hostApproval?.outcome?.decision === 'rejected' ||
    deriveToolCallState(part, { chatStatus }) === 'rejected';
  const { isInterrupted } = status;
  const contextLabels = useChatLabels('mcpTool');
  const labels = useMemo(
    () => ({
      ...DEFAULT_MCP_TOOL_LABELS,
      ...contextLabels,
      ...labelsProp,
      activeVerbs: {
        ...DEFAULT_MCP_TOOL_LABELS.activeVerbs,
        ...contextLabels?.activeVerbs,
        ...labelsProp?.activeVerbs,
      },
      completedVerbs: {
        ...DEFAULT_MCP_TOOL_LABELS.completedVerbs,
        ...contextLabels?.completedVerbs,
        ...labelsProp?.completedVerbs,
      },
    }),
    [contextLabels, labelsProp]
  );

  const presentation = useToolPresentation();
  const catalogEntry = findToolCatalogEntry(presentation.catalog, part);
  const result = useMemo(() => readCallToolResult(part.output), [part.output]);
  const isError = part.state === 'output-error' || result?.isError === true;
  const catalogTitle = getToolCatalogTitle(catalogEntry);
  const argsFormatter = resolveByPartType(presentation.args, part.type);
  const outputFormatter = resolveByPartType(presentation.outputs, part.type);
  const isReadable = Boolean(catalogEntry || argsFormatter || outputFormatter);
  const args = useMemo(
    () => (isReadable ? readToolArgs(getPartInput(part)) : {}),
    [isReadable, part]
  );

  const title = useMemo(() => {
    const name = catalogTitle ?? mcpInfo.displayName;
    if (part.state === 'input-streaming') {
      return fillTemplate(labels.preparing, { name });
    }
    if (catalogTitle) {
      return catalogTitle;
    }
    if (isPending) {
      return conjugate(mcpInfo, labels.activeVerbs);
    }
    return conjugate(mcpInfo, labels.completedVerbs);
  }, [part.state, isPending, mcpInfo, labels, catalogTitle]);

  const subtitle = useMemo(() => {
    if (!isReadable) {
      return part.state === 'input-streaming' ? '' : formatMcpArgs(getPartInput(part));
    }
    const summary = summarizeToolArgs(args, {
      schema: catalogEntry?.inputSchema,
      locale: presentation.locale,
    });
    return (
      argsFormatter?.(part, {
        state: isPending ? 'running' : 'done',
        args,
        summary,
        schema: catalogEntry?.inputSchema,
        locale: presentation.locale,
      }) ?? summary
    );
  }, [isReadable, args, catalogEntry, labels, presentation.locale, argsFormatter, part, isPending]);

  const resultLines = useMemo(() => {
    if (
      !isReadable ||
      isPending ||
      isRejected ||
      (part.output === undefined && part.state !== 'output-error')
    ) {
      return null;
    }
    const schema = catalogEntry?.outputSchema;
    const summary = summarizeToolOutput(
      part.state === 'output-error' ? part.errorText : part.output,
      { labels, locale: presentation.locale, schema }
    );
    const formatted = outputFormatter?.(part, {
      state: isError ? 'error' : 'done',
      output: getToolOutputValue(part),
      result: result ?? undefined,
      schema,
      summary,
      locale: presentation.locale,
      labels,
    });
    if (formatted !== null && formatted !== undefined && typeof formatted !== 'string') {
      return formatted;
    }
    const text = typeof formatted === 'string' ? formatted : summary;
    const lines = text.split('\n').filter((line) => line.trim());
    return lines.length > 0 && lines.length <= 4 ? lines : null;
  }, [
    isReadable,
    isPending,
    isRejected,
    isError,
    part,
    result,
    catalogEntry,
    labels,
    presentation.locale,
    outputFormatter,
  ]);

  const displayOutput = useMemo(() => {
    if (!part.output) {
      return null;
    }
    return formatOutputForDisplay(part.output, catalogEntry?.outputSchema);
  }, [part.output, catalogEntry]);

  const codeBlock = useMemo(() => {
    if (!displayOutput || (isReadable && isRejected)) {
      return null;
    }
    const trimmed = displayOutput.trim();
    if (!trimmed) {
      return null;
    }
    const language = trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : 'text';
    const fence = codeFence(displayOutput);
    return `${fence}${language}\n${displayOutput}\n${fence}`;
  }, [displayOutput, isReadable, isRejected]);

  const argsJson =
    isReadable && Object.keys(args).length > 0 ? JSON.stringify(args, null, 2) : null;
  const hasMedia = Boolean(result?.content.some((block) => block.type !== 'text'));
  const hasExpandableContent = ((!!codeBlock || hasMedia) && !isPending) || !!argsJson;

  if (isInterrupted && !part.output && !isWaitingForDecision) {
    return (
      <Text component="span" className={cx(classes.interrupted, className)} style={style}>
        {fillTemplate(labels.interrupted, { name: mcpInfo.displayName })}
      </Text>
    );
  }

  return (
    <Box className={cx(classes.root, className)} style={style}>
      <ToolRowBase
        shimmerLabel={title}
        completeLabel={title}
        isAnimating={isPending}
        detail={subtitle || undefined}
        detailLines={isReadable ? 2 : 1}
        trailingContent={trailingContent}
        expandable={hasExpandableContent}
        defaultOpen={defaultOpen}
      >
        {argsJson && (
          <CodeBlock
            code={argsJson}
            language="json"
            title={labels.arguments}
            wrapLines
            className={classes.output}
          />
        )}
        {codeBlock && (
          <Markdown content={codeBlock} className={classes.output} controls={{ code: false }} />
        )}
        {result && hasMedia && (
          <Box className={classes.output}>
            <ToolResultContent result={result} messageId={part.toolCallId ?? mcpInfo.toolName} />
          </Box>
        )}
      </ToolRowBase>
      {resultLines &&
        (Array.isArray(resultLines) ? (
          <div className={classes.result} data-error={isError || undefined}>
            {resultLines.map((line, index) => (
              <div key={index} className={classes.resultLine} data-head={index === 0 || undefined}>
                {line}
              </div>
            ))}
          </div>
        ) : (
          <div className={classes.result}>{resultLines}</div>
        ))}
    </Box>
  );
}, areToolPropsEqual);

McpTool.displayName = 'McpTool';
