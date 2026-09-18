/** What the user picked in the approval footer */
export type ApprovalChoice = 'allow' | 'always' | 'deny';

/** How a tool call was settled, including the calls nobody was asked about */
export type ApprovalOutcome = ApprovalChoice | 'auto';

export type PermissionState = {
  /** Tool names approved for the rest of this chat */
  allowed: string[];
  /** Approve everything without asking */
  auto: boolean;
};

export type AgentEvent =
  | { kind: 'session'; sessionId: string; tools: string[] }
  | { kind: 'text'; delta: string }
  | { kind: 'tool-start'; toolCallId: string; name: string; input: Record<string, unknown> }
  | { kind: 'tool-end'; toolCallId: string; output: unknown; isError: boolean }
  | { kind: 'approval'; requestId: string; toolCallId: string; name: string; title?: string }
  | {
      kind: 'approval-settled';
      requestId: string;
      toolCallId: string;
      name: string;
      outcome: ApprovalOutcome;
    }
  | { kind: 'permissions'; state: PermissionState }
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
};

export type StatusResponse = {
  server: string;
  transport: 'stdio' | 'http';
  target: string;
  model: string;
  sampleDir?: string;
};
