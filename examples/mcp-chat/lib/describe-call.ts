import type { McpToolDefinition } from '@sinups/ai-kit';
import type { ApprovalDetails, ApprovalRisk } from './events';
import { toolDefinition } from './mcp-tools';

function readable(toolName: string, server: string): string {
  return toolName.replace(`mcp__${server}__`, '').replace(/[_-]+/g, ' ').trim();
}

function riskOf(definition: McpToolDefinition | undefined): ApprovalRisk {
  if (definition?.annotations?.destructiveHint) {
    return 'high';
  }
  if (definition?.annotations?.readOnlyHint) {
    return 'low';
  }
  return 'medium';
}

function flatten(input: Record<string, unknown>): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.trim().startsWith('{')) {
      try {
        Object.assign(flat, JSON.parse(value) as Record<string, unknown>);
        continue;
      } catch {
        flat[key] = value;
        continue;
      }
    }
    flat[key] = value;
  }
  return flat;
}

function firstValues(input: Record<string, unknown>, limit = 2): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(flatten(input))) {
    if (parts.length >= limit) {
      break;
    }
    if (key.toLowerCase().endsWith('id')) {
      continue;
    }
    if (typeof value === 'string' && value.length <= 60) {
      parts.push(`${key}: ${value}`);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.join(', ');
}

function firstSentence(text: string | undefined, fallback: string): string {
  const source = (text ?? '').trim();
  if (!source) {
    return fallback;
  }
  const end = source.search(/\.\s/);
  const sentence = end > 0 ? source.slice(0, end + 1) : source;
  return sentence.length > 180 ? `${sentence.slice(0, 177)}...` : sentence;
}

export async function describeCall(
  toolName: string,
  input: Record<string, unknown>,
  server: string
): Promise<ApprovalDetails> {
  const definition = await toolDefinition(toolName);
  const action = definition?.title ?? readable(toolName, server);
  const arguments_ = firstValues(input);
  const risk = riskOf(definition);
  const effect = definition?.annotations?.readOnlyHint
    ? 'It only reads, nothing is changed.'
    : definition?.annotations?.destructiveHint
      ? 'It can change or remove data that is already there.'
      : 'It can write to the server.';

  return {
    risk,
    reason: arguments_ ? `${action} — ${arguments_}` : action,
    explanation: `${firstSentence(definition?.description, action)} ${effect}`,
    reasoning: definition?.description,
    ruleSuggestion: toolName,
    server,
  };
}
