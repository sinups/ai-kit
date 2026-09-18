import type {
  ChatMessage,
  CompactionPart,
  ContextEventPart,
  HookActivityPart,
  ToolPart,
  TurnSummaryPart,
} from '../types';
import { getToolStatus } from '../utils/format-tool';
import { isRecord, isTextPart, isV5ToolPart } from '../utils/parts';

/** `{ type: 'compaction' }` */
export function isCompactionPart(part: unknown): part is CompactionPart {
  return isRecord(part) && part.type === 'compaction';
}

/** `{ type: 'turn-summary' }` */
export function isTurnSummaryPart(part: unknown): part is TurnSummaryPart {
  return isRecord(part) && part.type === 'turn-summary';
}

/** `{ type: 'context-event' }` */
export function isContextEventPart(part: unknown): part is ContextEventPart {
  return isRecord(part) && part.type === 'context-event';
}

/** `{ type: 'hook-activity' }` */
export function isHookActivityPart(part: unknown): part is HookActivityPart {
  return isRecord(part) && part.type === 'hook-activity';
}

/** A part shown in the turn feed regardless of the role of its message */
export function isFeedPart(part: unknown): boolean {
  return (
    isCompactionPart(part) ||
    isTurnSummaryPart(part) ||
    isContextEventPart(part) ||
    isHookActivityPart(part)
  );
}

export type Turn = { userMsg?: ChatMessage; assistantMsgs: ChatMessage[] };

export type TranscriptIndex = {
  /** Messages grouped into turns: a user message followed by the answers to it */
  turns: Turn[];
  /** Id of the newest user message, `null` without one */
  lastUserMessageId: string | null;
  /** Whether the newest assistant message already carries text or a tool call */
  lastAssistantHasContent: boolean;
};

function hasAssistantContent(message: ChatMessage): boolean {
  return (message.parts ?? []).some((part) => {
    if (isTextPart(part)) {
      return part.text.trim().length > 0;
    }
    return isV5ToolPart(part);
  });
}

/** Builds every whole-transcript lookup the list needs in one pass over the messages */
export function indexTranscript(messages: readonly ChatMessage[]): TranscriptIndex {
  const turns: Turn[] = [];
  let current: Turn | null = null;
  let lastUserMessageId: string | null = null;
  let lastAssistantMsg: ChatMessage | null = null;

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (current) {
        turns.push(current);
      }
      current = { userMsg: msg, assistantMsgs: [] };
      lastUserMessageId = msg.id;
      continue;
    }
    if (msg.role === 'assistant') {
      if (!current) {
        current = { assistantMsgs: [] };
      }
      current.assistantMsgs.push(msg);
      lastAssistantMsg = msg;
      continue;
    }
    const feedParts = (msg.parts ?? []).filter(isFeedPart);
    if (feedParts.length === 0) {
      continue;
    }
    if (!current) {
      current = { assistantMsgs: [] };
    }
    current.assistantMsgs.push({ ...msg, parts: feedParts });
  }
  if (current) {
    turns.push(current);
  }

  return {
    turns,
    lastUserMessageId,
    lastAssistantHasContent: lastAssistantMsg ? hasAssistantContent(lastAssistantMsg) : false,
  };
}

export type MessagePartIndex = {
  /** Every tool part of the message by its `toolCallId` */
  toolCallById: ReadonlyMap<string, ToolPart>;
  /** Ids of the tool calls that already have a result, successful or not */
  resolvedToolCallIds: ReadonlySet<string>;
  /** Ids of the tool calls that failed */
  erroredToolCallIds: ReadonlySet<string>;
  /** Output of a finished tool call by its `toolCallId`; a call still running has no entry */
  resultByToolCallId: ReadonlyMap<string, unknown>;
  /** Nested calls of a `Task` or `Agent` call, by the `toolCallId` of that call */
  siblingsByParentId: ReadonlyMap<string, ToolPart[]>;
  /** Ids of the calls rendered inside their parent instead of on their own */
  nestedToolCallIds: ReadonlySet<string>;
  /** Index of the last text part, `-1` when the message has none */
  lastTextIndex: number;
  /** How many tool calls are still waiting for a result */
  unresolvedToolCallCount: number;
};

const EMPTY_INDEX: MessagePartIndex = {
  toolCallById: new Map(),
  resolvedToolCallIds: new Set(),
  erroredToolCallIds: new Set(),
  resultByToolCallId: new Map(),
  siblingsByParentId: new Map(),
  nestedToolCallIds: new Set(),
  lastTextIndex: -1,
  unresolvedToolCallCount: 0,
};

function buildMessagePartIndex(parts: readonly unknown[]): MessagePartIndex {
  if (parts.length === 0) {
    return EMPTY_INDEX;
  }

  const toolCallById = new Map<string, ToolPart>();
  const resolvedToolCallIds = new Set<string>();
  const erroredToolCallIds = new Set<string>();
  const resultByToolCallId = new Map<string, unknown>();
  const siblingsByParentId = new Map<string, ToolPart[]>();
  const nestedToolCallIds = new Set<string>();
  const parentToolCallIds = new Set<string>();
  const nestedCandidates: Array<{ parentId: string; part: ToolPart }> = [];
  let lastTextIndex = -1;
  let unresolvedToolCallCount = 0;

  parts.forEach((part, index) => {
    if (isTextPart(part)) {
      lastTextIndex = index;
      return;
    }
    if (!isV5ToolPart(part)) {
      return;
    }
    const isResolved = part.state === 'output-available' || part.state === 'output-error';
    if (!isResolved) {
      unresolvedToolCallCount += 1;
    }
    const toolCallId = typeof part.toolCallId === 'string' ? part.toolCallId : null;
    if (!toolCallId) {
      return;
    }
    toolCallById.set(toolCallId, part);
    if (isResolved) {
      resolvedToolCallIds.add(toolCallId);
      resultByToolCallId.set(toolCallId, part.output ?? part.result);
      if (getToolStatus(part).isError) {
        erroredToolCallIds.add(toolCallId);
      }
    }
    if (part.type === 'tool-Task' || part.type === 'tool-Agent') {
      parentToolCallIds.add(toolCallId);
    }
    if (part.type !== 'tool-TaskOutput' && toolCallId.includes(':')) {
      nestedCandidates.push({ parentId: toolCallId.split(':')[0], part });
    }
  });

  for (const { parentId, part } of nestedCandidates) {
    if (!parentToolCallIds.has(parentId)) {
      continue;
    }
    const siblings = siblingsByParentId.get(parentId);
    if (siblings) {
      siblings.push(part);
    } else {
      siblingsByParentId.set(parentId, [part]);
    }
    nestedToolCallIds.add(part.toolCallId as string);
  }

  return {
    toolCallById,
    resolvedToolCallIds,
    erroredToolCallIds,
    resultByToolCallId,
    siblingsByParentId,
    nestedToolCallIds,
    lastTextIndex,
    unresolvedToolCallCount,
  };
}

const indexCache = new WeakMap<object, MessagePartIndex>();

/** Per-message lookups, built once per parts array and reused while that array stays the same */
export function getMessagePartIndex(parts: readonly unknown[] | undefined): MessagePartIndex {
  if (!parts) {
    return EMPTY_INDEX;
  }
  const cached = indexCache.get(parts);
  if (cached) {
    return cached;
  }
  const index = buildMessagePartIndex(parts);
  indexCache.set(parts, index);
  return index;
}

/** Whether any tool call of the message is still waiting for a result */
export function hasUnresolvedToolCalls(parts: readonly unknown[] | undefined): boolean {
  return getMessagePartIndex(parts).unresolvedToolCallCount > 0;
}
