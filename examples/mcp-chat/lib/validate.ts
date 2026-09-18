import type { PermissionRule } from '@sinups/ai-kit';
import type {
  ApprovalChoice,
  ApprovalRequest,
  ChatRequest,
  PermissionMode,
  PermissionRequest,
} from './events';

export class BadRequest extends Error {}

const CHOICES: readonly ApprovalChoice[] = ['once', 'session', 'always', 'deny'];
const MODES: readonly PermissionMode[] = ['ask-writes', 'ask-all', 'read-only', 'auto'];
const BEHAVIORS: readonly PermissionRule['behavior'][] = ['allow', 'ask', 'deny'];
const SCOPES: readonly PermissionRule['scope'][] = ['session', 'local', 'project', 'user'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequest(`${key} must be a non-empty string`);
  }
  return value;
}

function optionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new BadRequest(`${key} must be a string`);
  }
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], key: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new BadRequest(`${key} must be one of ${allowed.join(', ')}`);
  }
  return value as T;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new BadRequest('The body is not valid JSON');
  }
  if (!isRecord(body)) {
    throw new BadRequest('The body must be a JSON object');
  }
  return body;
}

export async function parseChatRequest(request: Request): Promise<ChatRequest> {
  const body = await readBody(request);
  return {
    chatId: requiredString(body, 'chatId'),
    prompt: requiredString(body, 'prompt'),
    sessionId: optionalString(body, 'sessionId'),
    model: optionalString(body, 'model'),
    contextFile: optionalString(body, 'contextFile'),
  };
}

export async function parseApprovalRequest(request: Request): Promise<ApprovalRequest> {
  const body = await readBody(request);
  return {
    chatId: requiredString(body, 'chatId'),
    requestId: requiredString(body, 'requestId'),
    choice: oneOf(body.choice, CHOICES, 'choice'),
  };
}

/** MCP tools take no specifier, so a rule with one would look saved and never match */
function parseRule(value: unknown): PermissionRule {
  if (!isRecord(value)) {
    throw new BadRequest('save must be a rule object');
  }
  if (typeof value.specifier === 'string' && value.specifier.trim() !== '') {
    throw new BadRequest('Rules for MCP tools cannot have a specifier');
  }
  return {
    id: requiredString(value, 'id'),
    behavior: oneOf(value.behavior, BEHAVIORS, 'save.behavior'),
    toolName: requiredString(value, 'toolName'),
    scope: oneOf(value.scope, SCOPES, 'save.scope'),
    createdAt: optionalString(value, 'createdAt'),
    source: optionalString(value, 'source'),
  };
}

export async function parsePermissionRequest(request: Request): Promise<PermissionRequest> {
  const body = await readBody(request);
  if (body.reset !== undefined && typeof body.reset !== 'boolean') {
    throw new BadRequest('reset must be a boolean');
  }
  return {
    chatId: requiredString(body, 'chatId'),
    mode: body.mode === undefined ? undefined : oneOf(body.mode, MODES, 'mode'),
    reset: body.reset === true,
    save: body.save === undefined ? undefined : parseRule(body.save),
    remove: optionalString(body, 'remove'),
  };
}

export function badRequest(error: unknown): Response {
  if (error instanceof BadRequest) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  throw error;
}
