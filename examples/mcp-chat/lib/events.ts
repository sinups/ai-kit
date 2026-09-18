import type { PermissionRule } from '@sinups/ai-kit';

/** `ToolApprovalRisk` is not exported by the kit, see scratchpad kit-issues */
export type ApprovalRisk = 'low' | 'medium' | 'high';

/** What the user picked in the approval footer */
export type ApprovalChoice = 'once' | 'session' | 'always' | 'deny';

/** How a tool call was settled, including the calls nobody was asked about */
export type ApprovalOutcome = ApprovalChoice | 'auto' | 'rule';

export type PermissionState = {
  /** Rules saved for this chat */
  rules: PermissionRule[];
  /** Approve everything without asking */
  auto: boolean;
};

/** What the approval footer needs to explain a call in human words */
export type ApprovalDetails = {
  risk: ApprovalRisk;
  /** One sentence: what the call will do */
  reason: string;
  /** Longer explanation behind the "Why?" button */
  explanation: string;
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
  | { kind: 'tool-start'; toolCallId: string; name: string; input: Record<string, unknown> }
  | { kind: 'tool-end'; toolCallId: string; output: unknown; isError: boolean }
  | {
      kind: 'approval';
      requestId: string;
      toolCallId: string;
      name: string;
      details: ApprovalDetails;
    }
  | {
      kind: 'approval-settled';
      requestId: string;
      toolCallId: string;
      name: string;
      outcome: ApprovalOutcome;
      /** Rule that approved the call without asking */
      matchedRule?: string;
    }
  | { kind: 'permissions'; state: PermissionState }
  | { kind: 'usage'; usage: TurnUsage }
  | { kind: 'error'; message: string }
  | { kind: 'done' };

export type ChatRequest = {
  chatId: string;
  prompt: string;
  sessionId?: string;
};

export type ApprovalRequest = {
  requestId: string;
  choice: ApprovalChoice;
};

export type PermissionRequest = {
  chatId: string;
  auto?: boolean;
  reset?: boolean;
  save?: PermissionRule;
  remove?: string;
};

export type StatusResponse = {
  server: string;
  transport: 'stdio' | 'http';
  target: string;
  model: string;
  sampleDir?: string;
};
