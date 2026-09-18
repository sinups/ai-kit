import type { ApprovalDetails, ApprovalEffect, ApprovalRisk } from './events';
import { isReadOnlyTool, toolDefinition } from './mcp-tools';

const RISK: Record<ApprovalEffect, ApprovalRisk> = {
  read: 'low',
  write: 'medium',
  destructive: 'high',
};

export async function describeCall(toolName: string, server: string): Promise<ApprovalDetails> {
  const definition = await toolDefinition(toolName);
  const readOnly = await isReadOnlyTool(toolName);
  const destructive = definition?.annotations?.destructiveHint === true;
  const effect: ApprovalEffect = readOnly ? 'read' : destructive ? 'destructive' : 'write';

  return {
    risk: RISK[effect],
    effect,
    reasoning: definition?.description,
    ruleSuggestion: toolName,
    server,
  };
}
