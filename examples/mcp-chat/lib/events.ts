import type { PermissionRule } from '@sinups/ai-kit';

/** `ToolApprovalRisk` is not exported by the kit, see scratchpad kit-issues */
export type ApprovalRisk = 'low' | 'medium' | 'high';

/** What the user picked in the approval footer */
export type ApprovalChoice = 'once' | 'session' | 'always' | 'deny';

/** How a tool call was settled, including the calls nobody was asked about */
export type ApprovalOutcome = ApprovalChoice | 'auto' | 'rule' | 'blocked' | 'interrupted';

/** How the chat treats tool calls: ask before changes, ask always, only read, or never ask */
export type PermissionMode = 'ask-writes' | 'ask-all' | 'read-only' | 'auto';

export type PermissionState = {
  /** Rules saved for this chat */
  rules: PermissionRule[];
  mode: PermissionMode;
};

/**
 * What a call does to the data of its server, from its MCP annotations: `read` for `readOnlyHint`,
 * `write` for `destructiveHint: false`, `destructive` for `destructiveHint: true`, and `unmarked`
 * when the server said neither, which the protocol defaults treat as destructive
 */
export type ApprovalEffect = 'read' | 'write' | 'destructive' | 'unmarked';

/** Facts the client turns into the words of the approval footer */
export type ApprovalDetails = {
  risk: ApprovalRisk;
  effect: ApprovalEffect;
  /** Description of the tool as its server sends it */
  reasoning?: string;
  /** Rule the footer offers to save */
  ruleSuggestion: string;
  /** Server the tool belongs to */
  server: string;
};

export type TurnUsage = {
  tokens: number;
  contextTokens: number;
  contextWindow: number;
  durationMs: number;
};

export type AgentEvent =
  | { kind: 'session'; sessionId: string; tools: string[] }
  | { kind: 'text'; delta: string }
  | { kind: 'thinking'; delta: string }
  | { kind: 'tool-start'; toolCallId: string; name: string; input: Record<string, unknown> }
  | { kind: 'tool-end'; toolCallId: string; output: unknown; isError: boolean }
  | {
      kind: 'approval';
      requestId: string;
      toolCallId: string;
      name: string;
      details: ApprovalDetails;
      /** `ask` rule that made the chat ask about this call */
      matchedRule?: string;
    }
  | {
      kind: 'approval-settled';
      requestId: string;
      toolCallId: string;
      name: string;
      outcome: ApprovalOutcome;
    }
  | { kind: 'permissions'; state: PermissionState }
  | { kind: 'usage'; usage: TurnUsage }
  | { kind: 'error'; message: string }
  | { kind: 'done' };

export type ChatRequest = {
  chatId: string;
  prompt: string;
  sessionId?: string;
  model?: string;
  /** File from the sample folder the user keeps in context */
  contextFile?: string;
};

export type ApprovalRequest = {
  chatId: string;
  requestId: string;
  choice: ApprovalChoice;
};

export type PermissionRequest = {
  chatId: string;
  mode?: PermissionMode;
  reset?: boolean;
  save?: PermissionRule;
  remove?: string;
};

export type StatusResponse = {
  servers: { name: string; transport: 'stdio' | 'http'; target: string }[];
  model: string;
};
