import type { ApprovalDetails, ApprovalEffect, ApprovalRisk } from './events';
import { toolDefinition } from './mcp-tools';

const RISK: Record<ApprovalEffect, ApprovalRisk> = {
  read: 'low',
  write: 'medium',
  destructive: 'high',
  unmarked: 'high',
};

/**
 * Effect of a call by the MCP tool annotations and their defaults: `readOnlyHint` is `false` and
 * `destructiveHint` is `true` unless the server says otherwise
 */
function effectOf(annotations: { readOnlyHint?: boolean; destructiveHint?: boolean } | undefined) {
  if (annotations?.readOnlyHint === true) {
    return 'read';
  }
  if (annotations?.destructiveHint === false) {
    return 'write';
  }
  return annotations?.destructiveHint === true ? 'destructive' : 'unmarked';
}

export async function describeCall(toolName: string, server: string): Promise<ApprovalDetails> {
  const definition = await toolDefinition(toolName);
  const effect: ApprovalEffect = effectOf(definition?.annotations);

  return {
    risk: RISK[effect],
    effect,
    reasoning: definition?.description,
    ruleSuggestion: toolName,
    server,
  };
}
