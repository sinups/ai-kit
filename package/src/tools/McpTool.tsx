import React, { memo, useMemo } from 'react';
import { Box, Text } from '@mantine/core';
import { Markdown } from '../Markdown/Markdown';
import { ToolRowBase } from '../ToolRowBase/ToolRowBase';
import type { ToolPart } from '../types';
import { cx } from '../utils/cx';
import { areToolPropsEqual, getPartInput, getToolStatus } from '../utils/format-tool';
import type { McpToolInfo } from './tool-registry';
import classes from './McpTool.module.css';

export interface McpToolProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Parsed server/tool names, see `parseMcpToolType` */
  mcpInfo: McpToolInfo;
  /** Chat status from `useChat()`, used to tell a pending tool from an interrupted one */
  chatStatus?: string;
  /** Initial expanded state of the output panel */
  defaultOpen?: boolean;
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

/** Parses a JSON object or array, any other text (including JSON scalars) is returned as is */
function parseJsonContainer(text: string): unknown {
  try {
    const parsed = JSON.parse(text);
    return parsed !== null && typeof parsed === 'object' ? parsed : text;
  } catch {
    return text;
  }
}

/** Unwraps MCP results (`CallToolResult`, `[{ type: 'text', text }]`) and parses JSON payloads when possible */
export function unwrapMcpOutput(output: any): any {
  if (!output) {
    return output;
  }
  if (typeof output === 'object' && !Array.isArray(output) && Array.isArray(output.content)) {
    return unwrapMcpOutput(output.content);
  }
  if (Array.isArray(output)) {
    const textParts: string[] = [];
    for (const block of output) {
      if (block?.type === 'text' && typeof block?.text === 'string') {
        textParts.push(block.text);
      }
    }
    if (textParts.length > 0) {
      return parseJsonContainer(textParts.join(''));
    }
    return output;
  }
  if (output?.type === 'text' && typeof output?.text === 'string') {
    return parseJsonContainer(output.text);
  }
  if (typeof output === 'string') {
    return parseJsonContainer(output);
  }
  return output;
}

/** Backtick fence longer than any backtick run inside the text, at least three characters */
function codeFence(text: string): string {
  let longest = 0;
  for (const match of text.matchAll(/`+/g)) {
    longest = Math.max(longest, match[0].length);
  }
  return '`'.repeat(Math.max(3, longest + 1));
}

function formatOutputForDisplay(output: unknown): string {
  const unwrapped = unwrapMcpOutput(output);
  if (typeof unwrapped === 'string') {
    return unwrapped.length > 3000 ? `${unwrapped.slice(0, 3000)}\n...` : unwrapped;
  }
  const text = JSON.stringify(unwrapped, null, 2);
  return text.length > 3000 ? `${text.slice(0, 3000)}\n...` : text;
}

/** Renders `tool-mcp__<server>__<tool>` parts with a verb-conjugated title and JSON output */
export const McpTool = memo(function McpTool({
  part,
  mcpInfo,
  chatStatus,
  defaultOpen,
  className,
  style,
}: McpToolProps) {
  const { isPending, isInterrupted } = getToolStatus(part, chatStatus);

  const title = useMemo(() => {
    if (part.state === 'input-streaming') {
      return `Preparing ${mcpInfo.displayName}`;
    }
    if (isPending) {
      return conjugate(mcpInfo, ACTIVE_VERBS);
    }
    return conjugate(mcpInfo, COMPLETED_VERBS);
  }, [part.state, isPending, mcpInfo]);

  const subtitle = useMemo(() => formatMcpArgs(getPartInput(part)), [part]);

  const displayOutput = useMemo(() => {
    if (!part.output) {
      return null;
    }
    return formatOutputForDisplay(part.output);
  }, [part.output]);

  const codeBlock = useMemo(() => {
    if (!displayOutput) {
      return null;
    }
    const trimmed = displayOutput.trim();
    if (!trimmed) {
      return null;
    }
    const language = trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : 'text';
    const fence = codeFence(displayOutput);
    return `${fence}${language}\n${displayOutput}\n${fence}`;
  }, [displayOutput]);

  const hasExpandableContent = !!codeBlock && !isPending;

  if (isInterrupted && !part.output) {
    return (
      <Text component="span" className={cx(classes.interrupted, className)} style={style}>
        {mcpInfo.displayName} interrupted
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
        trailingContent={undefined}
        expandable={hasExpandableContent}
        defaultOpen={defaultOpen}
      >
        {codeBlock && (
          <Markdown content={codeBlock} className={classes.output} controls={{ code: false }} />
        )}
      </ToolRowBase>
    </Box>
  );
}, areToolPropsEqual);

McpTool.displayName = 'McpTool';
