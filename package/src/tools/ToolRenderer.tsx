import React, { memo, useMemo } from 'react';
import { QuestionTool, type QuestionToolPart } from '../question/QuestionTool';
import type { CustomToolRendererProps, ToolPart } from '../types';
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
  /** Custom renderers for `mcp__user-tools__<name>` tools, keyed by tool name */
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
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
}: ToolRendererProps) {
  const isDynamic = rawPart.type === 'dynamic-tool' && typeof rawPart.toolName === 'string';
  const part = useMemo<ToolPart>(
    () => (isDynamic ? { ...rawPart, type: `tool-${rawPart.toolName}` } : rawPart),
    [isDynamic, rawPart]
  );
  const partType = part.type;

  switch (partType) {
    case 'tool-Bash':
      return <BashTool part={part} />;
    case 'tool-Edit':
    case 'tool-Write':
      return <EditTool part={part} />;
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

  const mcpInfo = parseMcpToolType(partType);
  if (mcpInfo) {
    if (toolRenderers && mcpInfo.serverName === 'user-tools') {
      const CustomRenderer = toolRenderers[mcpInfo.toolName];
      if (CustomRenderer) {
        return (
          <CustomRenderer
            name={mcpInfo.toolName}
            input={getPartInput(part)}
            output={part.output ? unwrapMcpOutput(part.output) : undefined}
            status={deriveToolStatus(part, chatStatus)}
          />
        );
      }
    }
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

  const toolName = partType.startsWith('tool-') ? partType.slice(5) : partType;
  const { isPending, isError } = getToolStatus(part, chatStatus);
  return (
    <GenericTool
      title={isPending ? `Running ${toolName}` : toolName}
      isPending={isPending}
      isError={isError}
    />
  );
});
