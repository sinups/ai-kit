import React, { memo, useMemo } from 'react';
import { QuestionTool, type QuestionToolPart } from '../question/QuestionTool';
import type { CustomToolRendererProps, ToolActionHandler, ToolPart } from '../types';
import { getPartInput, getToolStatus } from '../utils/format-tool';
import { BashTool } from './BashTool';
import { EditTool } from './EditTool';
import { GenericTool } from './GenericTool';
import { McpTool, unwrapMcpOutput } from './McpTool';
import { PlanTool } from './PlanTool';
import { SearchTool } from './SearchTool';
import { ThinkingTool } from './ThinkingTool';
import { TodoTool } from './TodoTool';
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

/** Dispatches a tool part to the matching card by `part.type` (`dynamic-tool` parts by `tool-${toolName}`) */
export const ToolRenderer = memo(function ToolRenderer({
  part: rawPart,
  nestedTools,
  chatStatus,
  toolRenderers,
  onToolAction,
  wrapLines,
}: ToolRendererProps) {
  const isDynamic = rawPart.type === 'dynamic-tool' && typeof rawPart.toolName === 'string';
  const part = useMemo<ToolPart>(
    () => (isDynamic ? { ...rawPart, type: `tool-${rawPart.toolName}` } : rawPart),
    [isDynamic, rawPart]
  );
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

  if (toolRenderers && customKey !== null) {
    const CustomRenderer = toolRenderers[customKey];
    const toolCallId = part.toolCallId;
    return (
      <CustomRenderer
        name={customKey === partType ? toolName : customKey}
        input={getPartInput(part)}
        output={mcpInfo ? (part.output ? unwrapMcpOutput(part.output) : undefined) : part.output}
        status={deriveToolStatus(part, chatStatus)}
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
    return <McpTool part={part} mcpInfo={mcpInfo} chatStatus={chatStatus} />;
  }

  const meta = toolRegistry[partType];
  if (meta) {
    const { isPending, isError } = getToolStatus(part, chatStatus);
    return (
      <GenericTool
        title={meta.title(part)}
        subtitle={meta.subtitle?.(part)}
        isPending={isPending}
        isError={isError}
      />
    );
  }

  const { isPending, isError } = getToolStatus(part, chatStatus);
  return (
    <GenericTool
      title={isPending ? `Running ${toolName}` : toolName}
      isPending={isPending}
      isError={isError}
    />
  );
});
