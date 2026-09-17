export type ApprovalDecision = 'allow' | 'deny';

export type AgentEvent =
  | { kind: 'session'; sessionId: string; tools: string[] }
  | { kind: 'text'; delta: string }
  | { kind: 'tool-start'; toolCallId: string; name: string; input: Record<string, unknown> }
  | { kind: 'tool-end'; toolCallId: string; output: unknown; isError: boolean }
  | { kind: 'approval'; requestId: string; toolCallId: string; name: string; title?: string }
  | { kind: 'approval-settled'; requestId: string; toolCallId: string; decision: ApprovalDecision }
  | { kind: 'error'; message: string }
  | { kind: 'done' };

export type ChatRequest = {
  prompt: string;
  sessionId?: string;
};

export type ApprovalRequest = {
  requestId: string;
  decision: ApprovalDecision;
};

export type StatusResponse = {
  server: string;
  transport: 'stdio' | 'http';
  target: string;
  model: string;
  sampleDir?: string;
};
