export type MemoryScope = 'user' | 'project' | 'local' | 'agent';

export interface MemoryFile {
  /** Stable file id */
  id: string;
  /** Where the memory applies */
  scope: MemoryScope;
  /** File path shown to the user, for example `~/.agent/AGENTS.md` */
  path: string;
  /** Markdown content of the file */
  content: string;
  /** Last modification time as an ISO string */
  updatedAt?: string;
  /** Name of the agent the memory belongs to, for `agent` files */
  agentName?: string;
}
