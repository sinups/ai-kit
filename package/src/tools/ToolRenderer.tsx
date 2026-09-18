import React, { memo, useMemo } from 'react';
import { QuestionTool, type QuestionToolPart } from '../question/QuestionTool';
import type { CustomToolRendererProps, ToolActionHandler, ToolPart } from '../types';
import { getPartInput, getToolStatus } from '../utils/format-tool';
import { parsePartialRecord } from '../utils/partial-json';
import { BashTool } from './BashTool';
import { EditTool } from './EditTool';
import { GenericTool } from './GenericTool';
import { McpTool, unwrapMcpOutput } from './McpTool';
import { PlanTool } from './PlanTool';
import { SearchTool } from './SearchTool';
import { ThinkingTool } from './ThinkingTool';
import { TodoTool } from './TodoTool';
import {
  DEFAULT_TOOL_CALL_STATE_LABELS,
  deriveToolCallState,
  type ToolCallLookups,
  type ToolCallState,
  type ToolCallStateLabels,
} from './tool-call-state';
import { ToolActivity } from './ToolActivity';
import { ToolCardBoundary } from './ToolCardBoundary';
import { getToolProgress } from './tool-progress';
import { useElapsed } from './use-elapsed';
import { parseMcpToolType, toolRegistry } from './tool-registry';
import { ToolGroup } from './ToolGroup';

export interface ToolRendererProps {
  /** Tool part in AI SDK v5 shape: `{ type, toolCallId, state, input, output }` */
  part: ToolPart;
  /** Tool parts nested under this part, passed to `ToolGroup` for `tool-Task` / `tool-Agent` */
  nestedTools?: ToolPart[];
  /** Chat status from `useChat()`, used to tell a pending tool from an interrupted one */
  chatStatus?: string;
  /** Custom renderers keyed by part type (`tool-Bash`, `tool-mcp__git__search`), which take precedence over the built-in card, or by `<name>` for `mcp__user-tools__<name>` */
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
  /** Receives actions reported by custom renderers through `onAction` */
  onToolAction?: ToolActionHandler;
  /** Wraps long lines in diffs instead of scrolling them sideways */
  wrapLines?: boolean;
  /** Transcript lookups behind the visible state of the call, see `createToolCallLookups` */
  lookups?: ToolCallLookups;
  /** Shows how long a running call has been going and the progress its server reports, `false` by default */
  showActivity?: boolean;
  /** Overrides of the default English labels of the derived states */
  labels?: Partial<ToolCallStateLabels>;
  /** Called when a card throws and degrades to the generic row */
  onRenderError?: (error: unknown, part: ToolPart) => void;
}

function deriveToolStatus(part: ToolPart, chatStatus?: string): CustomToolRendererProps['status'] {
  if (part.state === 'input-streaming') {
    return 'streaming';
  }
  if (part.state === 'output-available') {
    return 'success';
  }
  if (part.state === 'output-error') {
    return 'error';
  }
  const { isPending } = getToolStatus(part, chatStatus);
  return isPending ? 'pending' : 'success';
}

/** Registry titles read raw tool input, so a malformed entry must not escape as an exception */
function safeText(read: () => string | undefined): string | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}

/** Whether the host attached its own approval request to the call, which the card renders itself */
function hasApprovalFooter(part: ToolPart): boolean {
  const approval = getPartInput(part).approval;
  return Boolean(approval) && typeof approval === 'object';
}

/** Dispatches a tool part to the matching card by `part.type` (`dynamic-tool` parts by `tool-${toolName}`) */
export const ToolRenderer = memo(function ToolRenderer({
  part: rawPart,
  nestedTools,
  chatStatus,
  toolRenderers,
  onToolAction,
  wrapLines,
  lookups,
  showActivity = false,
  labels: labelsProp,
  onRenderError,
}: ToolRendererProps) {
  const isDynamic = rawPart.type === 'dynamic-tool' && typeof rawPart.toolName === 'string';
  const part = useMemo<ToolPart>(() => {
    const typed = isDynamic ? { ...rawPart, type: `tool-${rawPart.toolName}` } : rawPart;
    const parsedInput =
      typeof typed.input === 'string' ? parsePartialRecord(typed.input) : undefined;
    return parsedInput ? { ...typed, input: parsedInput } : typed;
  }, [isDynamic, rawPart]);
  const partType = part.type;
  const toolName = partType.startsWith('tool-') ? partType.slice(5) : partType;
  const mcpInfo = parseMcpToolType(partType);
  const customKey = !toolRenderers
    ? null
    : Object.hasOwn(toolRenderers, partType)
      ? partType
      : mcpInfo?.serverName === 'user-tools' && Object.hasOwn(toolRenderers, mcpInfo.toolName)
        ? mcpInfo.toolName
        : null;

  const labels = { ...DEFAULT_TOOL_CALL_STATE_LABELS, ...labelsProp };
  const callState = deriveToolCallState(part, { chatStatus, lookups });
  const settledElsewhere =
    callState === 'done' &&
    part.state !== 'output-available' &&
    part.state !== 'output-error' &&
    Boolean(part.toolCallId && lookups?.hasResult?.(part.toolCallId));
  const cardPart = useMemo(
    () => (settledElsewhere ? { ...part, state: 'output-available' } : part),
    [part, settledElsewhere]
  );
  const isRunning = showActivity && callState === 'running';
  const elapsed = useElapsed(cardPart, isRunning);
  const progress = isRunning ? getToolProgress(cardPart) : undefined;
  const activity =
    elapsed || progress ? <ToolActivity elapsed={elapsed} progress={progress} /> : undefined;
  const meta = toolRegistry[partType];
  const registryTitle = (meta ? safeText(() => meta.title(part)) : undefined) || toolName;
  const registrySubtitle = safeText(() => meta?.subtitle?.(part));

  const quietRow = (title: string, subtitle?: string) => (
    <GenericTool
      icon={meta?.icon}
      title={title}
      subtitle={subtitle}
      isPending={false}
      tone="quiet"
    />
  );

  if (callState === 'queued' || (callState === 'awaiting-permission' && !hasApprovalFooter(part))) {
    const label = callState === 'queued' ? labels.queued : labels.awaitingPermission;
    return quietRow(label, registrySubtitle || registryTitle);
  }

  const card = renderToolCard({
    part: cardPart,
    partType,
    toolName,
    mcpInfo,
    meta,
    registryTitle,
    registrySubtitle,
    customKey,
    toolRenderers,
    chatStatus,
    nestedTools,
    onToolAction,
    wrapLines,
    callState,
    activity,
  });

  return (
    <ToolCardBoundary
      resetKey={`${part.toolCallId ?? partType}:${part.state ?? ''}`}
      onError={onRenderError ? (error) => onRenderError(error, part) : undefined}
      fallback={quietRow(registryTitle, labels.renderError)}
    >
      {card}
    </ToolCardBoundary>
  );
});

type ToolCardOptions = {
  part: ToolPart;
  partType: string;
  toolName: string;
  mcpInfo: ReturnType<typeof parseMcpToolType>;
  meta: (typeof toolRegistry)[string] | undefined;
  registryTitle: string;
  registrySubtitle: string | undefined;
  customKey: string | null;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
  chatStatus?: string;
  nestedTools?: ToolPart[];
  onToolAction?: ToolActionHandler;
  wrapLines?: boolean;
  callState: ToolCallState;
  activity?: React.ReactNode;
};

function renderToolCard({
  part,
  partType,
  toolName,
  mcpInfo,
  meta,
  registryTitle,
  registrySubtitle,
  customKey,
  toolRenderers,
  chatStatus,
  nestedTools,
  onToolAction,
  wrapLines,
  callState,
  activity,
}: ToolCardOptions): React.ReactNode {
  if (toolRenderers && customKey !== null) {
    const CustomRenderer = toolRenderers[customKey];
    const toolCallId = part.toolCallId;
    return (
      <CustomRenderer
        name={customKey === partType ? toolName : customKey}
        input={getPartInput(part)}
        output={mcpInfo ? (part.output ? unwrapMcpOutput(part.output) : undefined) : part.output}
        status={deriveToolStatus(part, chatStatus)}
        callState={callState}
        toolCallId={toolCallId}
        part={part}
        onAction={
          onToolAction
            ? (action, payload) => onToolAction(toolCallId ?? '', action, payload)
            : undefined
        }
      />
    );
  }

  switch (partType) {
    case 'tool-Bash':
      return <BashTool part={part} />;
    case 'tool-Edit':
    case 'tool-Write':
      return <EditTool part={part} wrapLines={wrapLines} />;
    case 'tool-WebSearch':
    case 'tool-Grep':
    case 'tool-Glob':
      return <SearchTool part={part} />;
    case 'tool-PlanWrite':
      return <PlanTool part={part} chatStatus={chatStatus} />;
    case 'tool-TodoWrite':
      return <TodoTool part={part} chatStatus={chatStatus} />;
    case 'tool-Question':
      return <QuestionTool part={part as unknown as QuestionToolPart} chatStatus={chatStatus} />;
    case 'tool-Task':
    case 'tool-Agent': {
      const labelBase = partType === 'tool-Agent' ? 'Agent' : 'Task';
      return (
        <ToolGroup
          part={part}
          nestedTools={nestedTools}
          chatStatus={chatStatus}
          completeLabel={`${labelBase} completed`}
          shimmerLabel={`Running ${labelBase.toLowerCase()}`}
          interruptedLabel={`${labelBase} interrupted`}
          defaultOpen={false}
        />
      );
    }
    case 'tool-Thinking':
      return <ThinkingTool part={part} />;
    default:
      break;
  }

  if (mcpInfo) {
    return (
      <McpTool part={part} mcpInfo={mcpInfo} chatStatus={chatStatus} trailingContent={activity} />
    );
  }

  const { isPending, isError } = getToolStatus(part, chatStatus);
  if (meta) {
    return (
      <GenericTool
        title={registryTitle}
        subtitle={registrySubtitle}
        isPending={isPending}
        isError={isError}
        trailingContent={activity}
      />
    );
  }

  return (
    <GenericTool
      title={isPending ? `Running ${toolName}` : toolName}
      isPending={isPending}
      isError={isError}
      trailingContent={activity}
    />
  );
}

ToolRenderer.displayName = 'ToolRenderer';
