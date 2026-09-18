import type {
  AgentDefinition,
  AgentDraft,
  AgentDraftErrors,
  AgentSource,
  AgentToolSelection,
  ToolCatalogItem,
} from './types';
import { fillTemplate } from '../utils/fill-template';

export const AGENT_NAME_PATTERN = /^[a-z][a-z0-9-]{1,63}$/;

export const AGENT_DESCRIPTION_MIN_LENGTH = 20;

export const AGENT_SOURCE_ORDER: AgentSource[] = ['project', 'user', 'plugin', 'builtin'];

export interface AgentValidationMessages {
  nameRequired: string;
  nameFormat: string;
  nameTaken: string;
  /** `{min}` is replaced with the minimum length */
  descriptionTooShort: string;
  systemPromptRequired: string;
  toolsRequired: string;
  /** `{tools}` is replaced with the conflicting tool names */
  toolsConflict: string;
  maxTurns: string;
}

export const DEFAULT_AGENT_VALIDATION_MESSAGES: AgentValidationMessages = {
  nameRequired: 'Enter a name',
  nameFormat:
    'Use 2-64 lowercase letters, digits and hyphens, starting with a letter, for example code-reviewer',
  nameTaken: 'An agent with this name already exists',
  descriptionTooShort: 'Describe when to use the agent in at least {min} characters',
  systemPromptRequired: 'Write the system prompt',
  toolsRequired: 'Select at least one tool',
  toolsConflict: 'Allowed and disallowed at the same time: {tools}',
  maxTurns: 'Enter a whole number greater than 0',
};

export interface AgentToolSummaryLabels {
  all: string;
  none: string;
  /** `{count}` is replaced */
  one: string;
  /** `{count}` is replaced */
  many: string;
  /** `{count}` and `{group}` are replaced */
  oneGroup: string;
  /** `{count}` and `{groups}` are replaced */
  manyGroups: string;
}

export const DEFAULT_AGENT_TOOL_SUMMARY_LABELS: AgentToolSummaryLabels = {
  all: 'All tools',
  none: 'No tools',
  one: '1 tool',
  many: '{count} tools',
  oneGroup: '{count} from {group}',
  manyGroups: '{count} tools from {groups} groups',
};

export function validateAgentName(
  name: string,
  existingNames: readonly string[] = [],
  messages: Partial<AgentValidationMessages> = {}
): string | null {
  const text = { ...DEFAULT_AGENT_VALIDATION_MESSAGES, ...messages };
  if (!name.trim()) {
    return text.nameRequired;
  }
  if (!AGENT_NAME_PATTERN.test(name)) {
    return text.nameFormat;
  }
  return existingNames.includes(name) ? text.nameTaken : null;
}

export interface ValidateAgentDraftOptions {
  /** Names of other agents, the draft name must not repeat them */
  existingNames?: readonly string[];
  /** Overrides for the English messages */
  messages?: Partial<AgentValidationMessages>;
}

export function validateAgentDraft(
  draft: AgentDraft,
  { existingNames = [], messages = {} }: ValidateAgentDraftOptions = {}
): AgentDraftErrors {
  const text = { ...DEFAULT_AGENT_VALIDATION_MESSAGES, ...messages };
  const errors: AgentDraftErrors = {};

  const nameError = validateAgentName(draft.name, existingNames, text);
  if (nameError) {
    errors.name = nameError;
  }
  if (draft.description.trim().length < AGENT_DESCRIPTION_MIN_LENGTH) {
    errors.description = fillTemplate(text.descriptionTooShort, {
      min: AGENT_DESCRIPTION_MIN_LENGTH,
    });
  }
  if (!draft.systemPrompt.trim()) {
    errors.systemPrompt = text.systemPromptRequired;
  }
  if (Array.isArray(draft.tools) && draft.tools.length === 0) {
    errors.tools = text.toolsRequired;
  } else if (Array.isArray(draft.tools)) {
    const conflicts = draft.tools.filter((tool) => draft.disallowedTools.includes(tool));
    if (conflicts.length > 0) {
      errors.disallowedTools = fillTemplate(text.toolsConflict, { tools: conflicts.join(', ') });
    }
  }
  if (draft.maxTurns !== undefined && (!Number.isInteger(draft.maxTurns) || draft.maxTurns < 1)) {
    errors.maxTurns = text.maxTurns;
  }
  return errors;
}

/** Tools the agent can actually call: the selection without disallowed tools, `all` expanded against the catalog */
export function resolveAgentTools(
  tools: AgentToolSelection,
  disallowedTools: readonly string[] = [],
  catalog: readonly ToolCatalogItem[] = []
): string[] {
  const names = tools === 'all' ? catalog.map((tool) => tool.name) : tools;
  return names.filter((name) => !disallowedTools.includes(name));
}

export function summarizeTools(
  tools: AgentToolSelection,
  catalog: readonly ToolCatalogItem[] = [],
  labels: Partial<AgentToolSummaryLabels> = {}
): string {
  const text = { ...DEFAULT_AGENT_TOOL_SUMMARY_LABELS, ...labels };
  if (tools === 'all') {
    return text.all;
  }
  if (tools.length === 0) {
    return text.none;
  }
  const count = tools.length === 1 ? text.one : fillTemplate(text.many, { count: tools.length });
  const groups = new Set<string>();
  for (const name of tools) {
    const item = catalog.find((tool) => tool.name === name);
    if (item) {
      groups.add(item.group);
    }
  }
  if (groups.size === 1) {
    return fillTemplate(text.oneGroup, { count, group: [...groups][0] });
  }
  if (groups.size > 1) {
    return fillTemplate(text.manyGroups, { count: tools.length, groups: groups.size });
  }
  return count;
}

/** Destructive catalog tools the draft can call */
export function getDestructiveTools(
  draft: Pick<AgentDraft, 'tools' | 'disallowedTools'>,
  catalog: readonly ToolCatalogItem[]
): string[] {
  const allowed = resolveAgentTools(draft.tools, draft.disallowedTools, catalog);
  return catalog
    .filter((tool) => tool.destructive && allowed.includes(tool.name))
    .map((tool) => tool.name);
}

export function slugifyAgentName(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^[^a-z]+/, '')
    .replace(/-+$/, '')
    .slice(0, 64)
    .replace(/-+$/, '');
  return slug;
}

/** `name-copy`, `name-copy-2`, ... that does not repeat `existingNames` */
export function getCopyName(name: string, existingNames: readonly string[]): string {
  const base = `${name}-copy`.slice(0, 64);
  if (!existingNames.includes(base)) {
    return base;
  }
  for (let index = 2; ; index++) {
    const suffix = `-${index}`;
    const candidate = `${base.slice(0, 64 - suffix.length)}${suffix}`;
    if (!existingNames.includes(candidate)) {
      return candidate;
    }
  }
}

export function createAgentDraft(agent?: Partial<AgentDefinition>): AgentDraft {
  return {
    name: agent?.name ?? '',
    displayName: agent?.displayName ?? '',
    description: agent?.description ?? '',
    systemPrompt: agent?.systemPrompt ?? '',
    model: agent?.model ?? 'inherit',
    tools: agent?.tools === 'all' ? 'all' : [...(agent?.tools ?? [])],
    disallowedTools: [...(agent?.disallowedTools ?? [])],
    skills: [...(agent?.skills ?? [])],
    color: agent?.color,
    icon: agent?.icon,
    maxTurns: agent?.maxTurns,
  };
}

function sameList(a: AgentToolSelection, b: AgentToolSelection): boolean {
  if (a === 'all' || b === 'all') {
    return a === b;
  }
  return a.length === b.length && a.every((item) => b.includes(item));
}

export function isAgentDraftEqual(a: AgentDraft, b: AgentDraft): boolean {
  return (
    a.name === b.name &&
    a.displayName === b.displayName &&
    a.description === b.description &&
    a.systemPrompt === b.systemPrompt &&
    a.model === b.model &&
    sameList(a.tools, b.tools) &&
    sameList(a.disallowedTools, b.disallowedTools) &&
    sameList(a.skills, b.skills) &&
    a.color === b.color &&
    a.icon === b.icon &&
    a.maxTurns === b.maxTurns
  );
}

export function matchesAgentQuery(agent: AgentDefinition, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return [agent.name, agent.displayName ?? '', agent.description].some((text) =>
    text.toLowerCase().includes(needle)
  );
}
