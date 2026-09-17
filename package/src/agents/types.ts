import type { MantineColor } from '@mantine/core';

/** Where an agent definition comes from */
export type AgentSource = 'builtin' | 'user' | 'project' | 'plugin';

/** Tools available to an agent: a list of tool names or every tool */
export type AgentToolSelection = string[] | 'all';

export interface AgentDefinition {
  /** Stable identifier */
  id: string;
  /** Slug used to invoke the agent, for example `code-reviewer` */
  name: string;
  /** Human readable name, `name` is shown when omitted */
  displayName?: string;
  /** When the agent should be used */
  description: string;
  /** System prompt in Markdown */
  systemPrompt: string;
  /** Model id, `inherit` uses the model of the parent session */
  model?: string | 'inherit';
  /** Tools the agent may use */
  tools: AgentToolSelection;
  /** Tools removed from `tools`, useful together with `all` */
  disallowedTools?: string[];
  /** Skills loaded for the agent */
  skills?: string[];
  /** Accent color of the agent avatar */
  color?: MantineColor;
  /** Emoji or short text shown in the avatar instead of initials */
  icon?: string;
  /** Where the definition comes from */
  source: AgentSource;
  /** Built-in and plugin agents usually cannot be edited or deleted */
  readOnly?: boolean;
  /** Maximum number of agentic turns */
  maxTurns?: number;
  /** ISO date of the last change */
  updatedAt?: string;
}

export interface ToolCatalogItem {
  /** Tool name as the agent calls it, for example `Read` or `mcp__git__create_issue` */
  name: string;
  /** Human readable title */
  title?: string;
  /** What the tool does */
  description?: string;
  /** Group the tool is listed under, for example `Built-in` or `MCP: git` */
  group: string;
  /** The tool never changes anything */
  readOnly?: boolean;
  /** The tool can delete data or run arbitrary commands */
  destructive?: boolean;
}

/** Editable part of an agent definition */
export interface AgentDraft {
  name: string;
  displayName: string;
  description: string;
  systemPrompt: string;
  model: string | 'inherit';
  tools: AgentToolSelection;
  disallowedTools: string[];
  skills: string[];
  color?: MantineColor;
  icon?: string;
  maxTurns?: number;
}

export type AgentDraftField = keyof AgentDraft;

export type AgentDraftErrors = Partial<Record<AgentDraftField, string>>;
