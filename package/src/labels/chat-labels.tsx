import React, { createContext, useContext, useMemo, useState } from 'react';
import { mergeLabels, sameLabels } from '../utils/merge-labels';
import type { ErrorMessageLabels } from '../ErrorMessage/ErrorMessage';
import type { ToolPartRowLabels } from '../rows/ToolPartRow';
import type { BashToolLabels } from '../tools/BashTool';
import type { EditToolLabels } from '../tools/EditTool';
import type { McpToolLabels } from '../tools/McpTool';
import type { PlanToolLabels } from '../tools/PlanTool';
import type { SearchToolLabels } from '../tools/SearchTool';
import type { ToolCallStateLabels } from '../tools/tool-call-state';
import type { ToolCardLabels } from '../tools/tool-card-labels';
import type { ToolTitleLabels } from '../tools/tool-registry';
import type { TodoToolLabels } from '../tools/todo-utils';
import type { ToolGroupLabels } from '../tools/ToolGroup';
import type { TurnSummaryLabels } from '../TurnSummary/turn-summary';
import type { ThinkingToolLabels } from '../tools/ThinkingTool';
import type { DurationUnits } from '../utils/format-elapsed';

/** Labels of the components the transcript renders deep inside its rows */
export interface ChatComponentLabels {
  /** Error card: title, retry, countdown, show more */
  errorMessage: Partial<ErrorMessageLabels>;
  /** End-of-turn line: duration, tokens, background tasks */
  turnSummary: Partial<TurnSummaryLabels>;
  /** MCP tool rows: verb forms, preparing and interrupted titles */
  mcpTool: Partial<McpToolLabels>;
  /** Derived states of a tool call: queued, waiting for permission, failed to render */
  toolCall: Partial<ToolCallStateLabels>;
  /** Row titles of the built-in tools: `Read`, `Ran command`, `Grepped {count} files` */
  toolTitles: Partial<ToolTitleLabels>;
  /** Titles of subagent groups and of tools the kit has no card for */
  toolCard: Partial<ToolCardLabels>;
  /** Rows of `rowsPresentation`: running, no output, hidden lines, result summaries */
  toolRow: Partial<ToolPartRowLabels>;
  /** Terminal card of `Bash`: header and output panel */
  bashTool: Partial<BashToolLabels>;
  /** Diff card of `Edit` and `Write` */
  editTool: Partial<EditToolLabels>;
  /** Result rows of `WebSearch`, `Grep` and `Glob` */
  searchTool: Partial<SearchToolLabels>;
  /** Checklist of `TodoWrite` */
  todoTool: Partial<TodoToolLabels>;
  /** Plan card of `PlanWrite` */
  planTool: Partial<PlanToolLabels>;
  /** Nested steps of `Task` and `Agent` groups */
  toolGroup: Partial<ToolGroupLabels>;
  /** Thinking row: while the model thinks and once it is done, `Thought for 4s` */
  thinkingTool: Partial<ThinkingToolLabels>;
  /** Units of every duration in the transcript: turn summary, working line, running calls */
  durationUnits: Partial<DurationUnits>;
}

const ChatLabelsContext = createContext<Partial<ChatComponentLabels>>({});

export interface ChatLabelsProviderProps {
  /** Labels by component, each merged under the `labels` prop of that component */
  labels?: Partial<ChatComponentLabels>;
  children: React.ReactNode;
}

const EMPTY_LABELS: Partial<ChatComponentLabels> = {};

/**
 * Translates the components a transcript renders inside its rows. `AgentChat` provides it from its
 * `labels`; wrap a standalone `MessageList` in it to do the same. Nested providers merge into the outer one.
 */
export function ChatLabelsProvider({ labels = EMPTY_LABELS, children }: ChatLabelsProviderProps) {
  const outer = useContext(ChatLabelsContext);
  const merged = useMemo(() => mergeLabels(outer, labels), [outer, labels]);
  const [stable, setStable] = useState(merged);
  const same = sameLabels(stable, merged);
  if (!same) {
    setStable(merged);
  }
  return (
    <ChatLabelsContext.Provider value={same ? stable : merged}>
      {children}
    </ChatLabelsContext.Provider>
  );
}

ChatLabelsProvider.displayName = 'ChatLabelsProvider';

/** Labels of one component from the nearest `ChatLabelsProvider`, `undefined` outside of it */
export function useChatLabels<K extends keyof ChatComponentLabels>(
  component: K
): ChatComponentLabels[K] | undefined {
  return useContext(ChatLabelsContext)[component] as ChatComponentLabels[K] | undefined;
}
