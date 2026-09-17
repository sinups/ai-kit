import { createId } from '../utils/create-id';
import {
  HOOK_EVENTS,
  HOOK_EVENT_ORDER,
  HOOK_SCOPES,
  type HookConfig,
  type HookEvent,
  type HookEventText,
  type HookEventTextOverrides,
  type HookScope,
  type HookScopeText,
  type HookScopeTextOverrides,
  type HookType,
} from './types';

export interface HookDraft {
  event: HookEvent | null;
  matcher: string;
  type: HookType;
  command: string;
  prompt: string;
  timeout: number | '';
  scope: HookScope;
  enabled: boolean;
}

export type HookDraftErrors = Partial<Record<keyof HookDraft, string>>;

export const MAX_HOOK_TIMEOUT = 3600;

export interface HookMessages {
  eventRequired: string;
  invalidMatcher: string;
  commandRequired: string;
  promptRequired: string;
  invalidTimeout: string;
  timeoutTooLong: (max: number) => string;
  allTools: string;
  toolsMatching: (pattern: string) => string;
}

export const DEFAULT_HOOK_MESSAGES: HookMessages = {
  eventRequired: 'Choose an event',
  invalidMatcher: 'Not a valid regular expression',
  commandRequired: 'Enter a command',
  promptRequired: 'Enter a prompt',
  invalidTimeout: 'Use a whole number of seconds',
  timeoutTooLong: (max) => `At most ${max} seconds`,
  allTools: 'All tools',
  toolsMatching: (pattern) => `Tools matching ${pattern}`,
};

export function getHookEventText(
  event: HookEvent,
  overrides?: HookEventTextOverrides
): HookEventText {
  const { label, description } = HOOK_EVENTS[event];
  return { label, description, ...overrides?.[event] };
}

export function getHookScopeText(
  scope: HookScope,
  overrides?: HookScopeTextOverrides
): HookScopeText {
  const { label, description } = HOOK_SCOPES[scope];
  return { label, description, ...overrides?.[scope] };
}

export function createHookDraft(hook?: Partial<HookConfig>): HookDraft {
  return {
    event: hook?.event ?? null,
    matcher: hook?.matcher ?? '',
    type: hook?.type ?? 'command',
    command: hook?.command ?? '',
    prompt: hook?.prompt ?? '',
    timeout: hook?.timeout ?? '',
    scope: hook?.scope ?? 'project',
    enabled: hook?.enabled ?? true,
  };
}

export function eventSupportsMatcher(event: HookEvent | null): boolean {
  return !!event && HOOK_EVENTS[event].supportsMatcher;
}

export function validateEventStep(
  draft: HookDraft,
  messages: HookMessages = DEFAULT_HOOK_MESSAGES
): HookDraftErrors | null {
  return draft.event && HOOK_EVENT_ORDER.includes(draft.event)
    ? null
    : { event: messages.eventRequired };
}

export function isRegexMatcher(matcher: string): boolean {
  return /[\\^$.|?*+()[\]{}]/.test(matcher) && matcher.trim() !== '*';
}

export function validateMatcher(
  matcher: string,
  messages: HookMessages = DEFAULT_HOOK_MESSAGES
): string | null {
  const value = matcher.trim();
  if (!value || value === '*') {
    return null;
  }
  try {
    new RegExp(value);
    return null;
  } catch {
    return messages.invalidMatcher;
  }
}

export function validateMatcherStep(
  draft: HookDraft,
  messages: HookMessages = DEFAULT_HOOK_MESSAGES
): HookDraftErrors | null {
  if (!eventSupportsMatcher(draft.event)) {
    return null;
  }
  const error = validateMatcher(draft.matcher, messages);
  return error ? { matcher: error } : null;
}

export function validateActionStep(
  draft: HookDraft,
  messages: HookMessages = DEFAULT_HOOK_MESSAGES
): HookDraftErrors | null {
  const errors: HookDraftErrors = {};
  if (draft.type === 'command' && !draft.command.trim()) {
    errors.command = messages.commandRequired;
  }
  if (draft.type === 'prompt' && !draft.prompt.trim()) {
    errors.prompt = messages.promptRequired;
  }
  if (draft.timeout !== '') {
    if (!Number.isInteger(draft.timeout) || draft.timeout < 1) {
      errors.timeout = messages.invalidTimeout;
    } else if (draft.timeout > MAX_HOOK_TIMEOUT) {
      errors.timeout = messages.timeoutTooLong(MAX_HOOK_TIMEOUT);
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateHookDraft(
  draft: HookDraft,
  messages: HookMessages = DEFAULT_HOOK_MESSAGES
): HookDraftErrors {
  return {
    ...validateEventStep(draft, messages),
    ...validateMatcherStep(draft, messages),
    ...validateActionStep(draft, messages),
  };
}

export function buildHook(draft: HookDraft, id: string): HookConfig {
  if (!draft.event) {
    throw new Error('Hook event is required');
  }
  const hook: HookConfig = {
    id,
    event: draft.event,
    type: draft.type,
    scope: draft.scope,
    enabled: draft.enabled,
  };
  const matcher = draft.matcher.trim();
  if (eventSupportsMatcher(draft.event) && matcher) {
    hook.matcher = matcher;
  }
  if (draft.type === 'command') {
    hook.command = draft.command.trim();
  } else {
    hook.prompt = draft.prompt.trim();
  }
  if (draft.timeout !== '') {
    hook.timeout = draft.timeout;
  }
  return hook;
}

export function describeMatcher(
  matcher: string | undefined,
  messages: Pick<HookMessages, 'allTools' | 'toolsMatching'> = DEFAULT_HOOK_MESSAGES
): string {
  const value = matcher?.trim();
  if (!value || value === '*') {
    return messages.allTools;
  }
  return isRegexMatcher(value) ? messages.toolsMatching(value) : value;
}

export function getHookPayloadExample(event: HookEvent, matcher?: string): string {
  const payload = { ...HOOK_EVENTS[event].examplePayload };
  const value = matcher?.trim();
  if (
    HOOK_EVENTS[event].supportsMatcher &&
    value &&
    value !== '*' &&
    !isRegexMatcher(value) &&
    'tool_name' in payload
  ) {
    payload.tool_name = value;
  }
  return JSON.stringify(payload, null, 2);
}

export function countHooksByEvent(hooks: HookConfig[]): Record<HookEvent, number> {
  const counts = Object.fromEntries(HOOK_EVENT_ORDER.map((event) => [event, 0])) as Record<
    HookEvent,
    number
  >;
  for (const hook of hooks) {
    if (hook.event in counts) {
      counts[hook.event] += 1;
    }
  }
  return counts;
}

export function getHookSummary(hook: Pick<HookConfig, 'type' | 'command' | 'prompt'>): string {
  return (hook.type === 'command' ? hook.command : hook.prompt)?.trim() ?? '';
}

export const DEFAULT_HOOK_TOOLS = [
  'Bash',
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'WebFetch',
  'WebSearch',
];

export function createHookId(): string {
  return createId('hook');
}
