import type {
  AgentChatLabels,
  ChatHeaderLabels,
  ChatWelcomeLabels,
  ContextUsageLabels,
  InputBarLabels,
  McpServerDetailLabels,
  McpServerStatus,
  ModeOption,
  PermissionRulesPanelLabels,
  ToolApprovalLabels,
  ToolApprovalOption,
} from '@sinups/ai-kit';
import type { ApprovalEffect } from '@/lib/events';

/** Labels of the kit components; English needs none, the kit ships English defaults */
export type KitLabels = {
  chat?: Partial<AgentChatLabels>;
  chatHeader?: Partial<ChatHeaderLabels>;
  approval?: Partial<ToolApprovalLabels>;
  serverDetail?: Partial<McpServerDetailLabels>;
  rulesPanel?: Partial<PermissionRulesPanelLabels>;
  input?: Partial<InputBarLabels>;
  welcome?: Partial<ChatWelcomeLabels>;
  contextUsage?: Partial<ContextUsageLabels>;
};

export type WelcomePromptId = 'team' | 'release' | 'note' | 'docs' | 'repo';

export const en = {
  /** BCP 47 tag for dates and numbers */
  locale: 'en-US',
  languageName: 'English',
  title: 'MCP chat',
  header: {
    inspector: 'Servers and rules',
    showInspector: 'Show servers and rules',
    toggleTheme: 'Toggle color scheme',
    language: 'Language',
  },
  me: 'me',
  context: {
    description: 'Goes with every message until you remove it',
  },
  composer: {
    placeholder: 'Ask anything…',
    approvalMode: 'Approval mode',
    approvalModeTitle: 'Mode',
    chooseModel: 'Choose a model',
    model: 'Model',
    contextUsage: 'Context usage',
  },
  welcome: {
    title: 'Chat with your MCP servers',
    description:
      'Ask about files, library docs or how a repository works. Answers come from the connected servers, and the chat asks before it changes anything.',
    prompts: {
      team: 'Who is on the team and in which time zones?',
      release: 'What is new in the latest release?',
      note: 'Write three onboarding steps to notes.md, one line each',
      docs: 'How do I build a Splitter in Mantine?',
      repo: 'What is inside the mantinedev/mantine repository?',
    } satisfies Record<WelcomePromptId, string>,
    short: {
      team: 'Team',
      release: 'What is new',
      docs: 'Splitter in Mantine',
    } as Partial<Record<WelcomePromptId, string>>,
  },
  approvalModes: [
    {
      id: 'ask-writes',
      label: 'Ask',
      badge: 'Default',
      description: 'Reads run right away, writes and deletes wait for your decision',
    },
    { id: 'ask-all', label: 'Always ask', description: 'Every call waits for your decision' },
    { id: 'read-only', label: 'Read only', description: 'Tools that change anything never run' },
    { id: 'auto', label: 'No questions', description: 'Every call runs right away' },
  ] as ModeOption[],
  approval: {
    options: [
      { value: 'once', label: 'Allow once', description: 'Ask again next time' },
      { value: 'session', label: 'Allow in this chat', description: 'Until the chat starts over' },
    ] as ToolApprovalOption[],
    alwaysAllowTool: 'Always allow this tool',
    byRule: 'by rule',
    interrupted: 'the turn ended',
    automatic: 'automatically',
    effect: {
      read: () => 'Only reads, changes nothing.',
      write: (server: string) => `Writes changes to ${server}.`,
      destructive: () => 'May change or delete data.',
      unmarked: () =>
        'The server did not mark this tool as read-only, so it is treated as one that can change data.',
    } satisfies Record<ApprovalEffect, (server: string) => string>,
    askedForEveryCall: 'You asked to confirm every call.',
    needsPermission: 'The call will not run without your permission.',
  },
  chat: {
    interrupted: 'Interrupted: the turn ended before the tool answered.',
    approvalFailed: 'The server did not accept the decision. Try again.',
    chatFailed: 'The chat endpoint answered {status}.',
  },
  serverLost: {
    title: (server: string) => `${server} is unavailable`,
    fallback: 'The server stopped responding.',
    reconnect: 'Reconnect',
  },
  inspector: {
    servers: 'Servers',
    rules: 'Rules',
    noServers: 'No MCP servers are configured.',
    serverUnavailable: (server: string) => `Server ${server} is unavailable`,
    toolCount: (count: number) => `${count} ${count === 1 ? 'tool' : 'tools'}`,
    status: {
      connected: 'Connected',
      connecting: 'Connecting',
      disconnected: 'Disconnected',
      error: 'Error',
      'needs-auth': 'Needs sign-in',
      disabled: 'Disabled',
    } satisfies Record<McpServerStatus, string>,
  },
  /** Tool titles by `server/tool`; English keeps the titles the servers send */
  toolTitles: {} as Record<string, string>,
  kit: undefined as KitLabels | undefined,
};

export type Messages = typeof en;
