import type { KeyValuePair } from '../primitives/KeyValueEditor/key-value';
import type { JsonSchema } from '../primitives/SchemaView/schema';

export type McpTransport = 'stdio' | 'http' | 'sse';

export type McpServerStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'error'
  | 'needs-auth'
  | 'disabled';

export type McpServerScope = 'user' | 'project' | 'local';

/** Called with the server when the user triggers a row or detail action */
export type McpServerAction = (server: McpServer) => void | Promise<void>;

export interface McpToolAnnotations {
  /** Human-readable name of the tool, used when the tool itself has no `title` */
  title?: string;
  /** The tool does not modify its environment */
  readOnlyHint?: boolean;
  /** The tool may perform destructive updates */
  destructiveHint?: boolean;
  /** Repeated calls with the same arguments have no additional effect */
  idempotentHint?: boolean;
  /** The tool interacts with an open world of external entities */
  openWorldHint?: boolean;
}

export interface McpToolDefinition {
  /** Unique tool name within the server */
  name: string;
  /** Human-readable name */
  title?: string;
  description?: string;
  /** JSON Schema of the tool arguments */
  inputSchema?: JsonSchema;
  /** JSON Schema of the structured result */
  outputSchema?: JsonSchema;
  annotations?: McpToolAnnotations;
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: McpPromptArgument[];
}

export interface McpServerCapabilities {
  tools?: boolean;
  resources?: boolean;
  prompts?: boolean;
  logging?: boolean;
}

export interface McpServer {
  /** Stable server id */
  id: string;
  /** Server name shown in lists and used as the tool prefix */
  name: string;
  transport: McpTransport;
  status: McpServerStatus;
  /** Last connection error, shown when `status` is `error` */
  error?: string;
  /** Where the server is configured */
  scope?: McpServerScope;
  /** Executable started for `stdio` servers */
  command?: string;
  /** Arguments of `command` */
  args?: string[];
  /** Endpoint of `http` and `sse` servers */
  url?: string;
  /** Environment variables of `stdio` servers */
  env?: KeyValuePair[];
  /** Request headers of `http` and `sse` servers */
  headers?: KeyValuePair[];
  /** Server version reported during initialization */
  version?: string;
  /** Usage instructions reported during initialization */
  instructions?: string;
  capabilities?: McpServerCapabilities;
  tools?: McpToolDefinition[];
  resources?: McpResource[];
  prompts?: McpPrompt[];
  /** Number of tools when `tools` is not loaded */
  toolCount?: number;
}

export interface McpServerDraft {
  /** Id of the edited server, `undefined` when adding */
  id?: string;
  name: string;
  scope: McpServerScope;
  transport: McpTransport;
  command: string;
  args: string[];
  url: string;
  env: KeyValuePair[];
  headers: KeyValuePair[];
}

export interface McpServerCandidate {
  /** Stable id of the candidate inside the list */
  id: string;
  /** Server name as found in the source configuration */
  name: string;
  transport: McpTransport;
  command?: string;
  args?: string[];
  url?: string;
  env?: KeyValuePair[];
  headers?: KeyValuePair[];
  /** Where the server was found, for example `.mcp.json` or `settings.json` */
  source?: string;
}

export interface McpDiscoveredServer extends McpServerCandidate {
  source: string;
}

export type McpConfigWarningKind =
  | 'duplicate-name'
  | 'unknown-field'
  | 'invalid-value'
  | (string & {});

export interface McpConfigWarning {
  id?: string;
  /** Configuration file the warning belongs to */
  file: string;
  /** Path to the field inside the file, for example `mcpServers.git.env` */
  path?: string;
  kind: McpConfigWarningKind;
  message: string;
  serverName?: string;
}
