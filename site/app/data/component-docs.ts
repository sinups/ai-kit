import { AGENTS_COMPONENT_DOCS, SKILLS_COMPONENT_DOCS } from '@/app/data/component-docs-agents';
import {
  CHAT_ACTIONS_COMPONENT_DOCS,
  HELP_COMPONENT_DOCS,
  SESSIONS_COMPONENT_DOCS,
} from '@/app/data/component-docs-sessions';
import {
  DIFF_COMPONENT_DOCS,
  SETTINGS_COMPONENT_DOCS,
  TASKS_COMPONENT_DOCS,
} from '@/app/data/component-docs-workspace';
import { CHAT_EXTRA_COMPONENT_DOCS } from '@/app/data/component-docs-chat';
import { COMPOSER_COMPONENT_DOCS } from '@/app/data/component-docs-composer';
import { CONFIG_EXTRA_COMPONENT_DOCS } from '@/app/data/component-docs-config';
import { PRIMITIVE_COMPONENT_DOCS } from '@/app/data/component-docs-primitives';
import {
  HOOKS_COMPONENT_DOCS,
  MCP_COMPONENT_DOCS,
  PERMISSIONS_COMPONENT_DOCS,
} from '@/app/data/component-docs-settings';

export type ComponentBlockType = 'code' | 'usage' | 'example';

export type ComponentTextBlock = {
  type: 'code' | 'usage';
  title: string;
  content: string;
};

export type ComponentExampleBlock = {
  type: 'example';
  title: string;
  previewId: string;
  code: string;
};

export type ComponentBlock = ComponentTextBlock | ComponentExampleBlock;

export type ComponentDoc = {
  name: string;
  blocks?: ComponentBlock[];
};

export const componentIdFromName = (name: string) =>
  name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();

/**
 * Import path for each component. Everything ships from the package root.
 */
export const COMPONENT_IMPORT_PATH: Record<string, string> = {
  AgentChat: '@sinups/ai-kit',
  MessageList: '@sinups/ai-kit',
  InputBar: '@sinups/ai-kit',
  Suggestions: '@sinups/ai-kit',
  ModelPicker: '@sinups/ai-kit',
  ModelBadge: '@sinups/ai-kit',
  ModeSelector: '@sinups/ai-kit',
  UserMessage: '@sinups/ai-kit',
  ErrorMessage: '@sinups/ai-kit',
  Markdown: '@sinups/ai-kit',
  SendButton: '@sinups/ai-kit',
  AttachmentButton: '@sinups/ai-kit',
  FileAttachment: '@sinups/ai-kit',
  ChatDropZone: '@sinups/ai-kit',
  CommandToggles: '@sinups/ai-kit',
  StarterCategories: '@sinups/ai-kit',
  MediaPart: '@sinups/ai-kit',
  ArtifactPanel: '@sinups/ai-kit',
  MicButton: '@sinups/ai-kit',
  VoiceLevel: '@sinups/ai-kit',
  SpeakingIndicator: '@sinups/ai-kit',
  TextShimmer: '@sinups/ai-kit',
  SpiralLoader: '@sinups/ai-kit',
  BashTool: '@sinups/ai-kit',
  EditTool: '@sinups/ai-kit',
  SearchTool: '@sinups/ai-kit',
  TodoTool: '@sinups/ai-kit',
  PlanTool: '@sinups/ai-kit',
  ToolGroup: '@sinups/ai-kit',
  SubagentTool: '@sinups/ai-kit',
  McpTool: '@sinups/ai-kit',
  ThinkingTool: '@sinups/ai-kit',
  GenericTool: '@sinups/ai-kit',
  QuestionTool: '@sinups/ai-kit',
  ElicitationForm: '@sinups/ai-kit',
  ToolApprovalFooter: '@sinups/ai-kit',
  AgentStatus: '@sinups/ai-kit',
  ContextUsage: '@sinups/ai-kit',
  CompactBoundary: '@sinups/ai-kit',
};

const defaultCodeSnippet = (name: string) => {
  const path = COMPONENT_IMPORT_PATH[name] ?? '@sinups/ai-kit';
  return `import { ${name} } from "${path}";\n\nexport function Example() {\n  return (\n    <${name} />\n  );\n}`;
};

const defaultUsageText = () => 'Use this building block to extend your chat UI.';

export const buildComponentBlocks = (name: string): ComponentBlock[] => [
  {
    type: 'code',
    title: 'Code',
    content: defaultCodeSnippet(name),
  },
  {
    type: 'usage',
    title: 'Usage',
    content: defaultUsageText(),
  },
  {
    type: 'example',
    title: 'Example',
    previewId: name,
    code: `export function Example() {\n  return (\n    <${name} />\n  );\n}`,
  },
];

export const COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: 'AgentChat',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { AgentChat } from "@sinups/ai-kit";
import { IconGitPullRequest, IconTestPipe } from "@tabler/icons-react";

const messages = [
  {
    id: "msg-1",
    role: "assistant",
    parts: [{ type: "text", text: "Welcome to AI UI Kit." }],
  },
];

const welcomeActions = [
  { id: "review", label: "Review my pull request", value: "Review the changes in my branch.", icon: <IconGitPullRequest /> },
  { id: "tests", label: "Write tests for a file", value: "Write tests for ", icon: <IconTestPipe /> },
];

export function Example() {
  return (
    <div className="h-[560px] border border-border rounded-lg overflow-hidden bg-background">
      <AgentChat
        messages={messages}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        showCopyToolbar
        emptyState={{
          layout: "welcome",
          title: "How can I help you today?",
          actions: welcomeActions,
        }}
      />
    </div>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          "Create a full chat surface with messages, status, and send/stop handlers. Add `attachments` to wire file/image context, `questionTool` to handle Question tool answers, and `showCopyToolbar` for text copy actions. The same component works as a narrow side widget and as a full-page chat: set `contentWidth` (for example `760` or `'100%'`) so the transcript and composer use the available width, and `collapseToolRuns` to keep long tool sequences compact. Use `emptyState` with `layout: 'welcome'` for an empty chat: avatar, greeting and starter actions placed in the free space above the composer, a little below the middle, and close to the composer in containers narrower than 600px. Suggestions always sit above the composer (`emptySuggestionsPosition='bottom'` is deprecated and behaves as `'top'`).",
      },
      {
        type: 'example',
        title: 'Basic',
        previewId: 'AgentChat/basic',
        code: `<AgentChat
  messages={messages}
  status="ready"
  onSend={() => {}}
  onStop={() => {}}
/>`,
      },
      {
        type: 'example',
        title: 'Empty centered',
        previewId: 'AgentChat/empty-centered',
        code: `<AgentChat
  messages={[]}
  status="ready"
  onSend={() => {}}
  onStop={() => {}}
  emptyStatePosition="center"
/>`,
      },
      {
        type: 'example',
        title: 'Welcome empty state',
        previewId: 'AgentChat/welcome',
        code: `const actions = [
  { id: "review", label: "Review my pull request", value: "Review the changes in my current branch.", icon: <IconGitPullRequest />, badge: "New" },
  { id: "bug", label: "Find the cause of a bug", value: "Help me find why ", icon: <IconBug /> },
  { id: "tests", label: "Write tests for a file", value: "Write tests for ", icon: <IconTestPipe /> },
];

<AgentChat
  messages={messages}
  status={status}
  onSend={send}
  onStop={stop}
  contentWidth="100%"
  alignComposer
  hideSuggestionsWhenNotEmpty
  emptyState={{
    layout: "welcome",
    avatar: <IconSparkles size={22} />,
    title: "How can I help you today?",
    description: "Ask about the code, fix a bug or plan a change.",
    actions,
  }}
/>`,
      },
      {
        type: 'example',
        title: 'With attachments',
        previewId: 'AgentChat/attachments',
        code: `<AgentChat
  messages={messages}
  status="ready"
  onSend={() => {}}
  onStop={() => {}}
  attachments={{
    onAttach: () => {},
    images: [{ id: "img-1", filename: "preview.png", url: imageUrl }],
    files: [{ id: "file-1", filename: "spec.md", size: 3200 }],
    onRemoveImage: () => {},
    onRemoveFile: () => {},
  }}
/>`,
      },
      {
        type: 'example',
        title: 'Copy toolbar',
        previewId: 'AgentChat/copy-toolbar',
        code: `<AgentChat
  messages={messages}
  status="ready"
  onSend={() => {}}
  onStop={() => {}}
  showCopyToolbar
/>`,
      },
      {
        type: 'usage',
        title: 'Tool approvals',
        content:
          "`approvals` attaches a confirmation to a tool call by its `toolCallId` without replacing the card that renders it, so an MCP call gets Allow/Deny with the same renderer. Each entry takes what `ToolApprovalFooter` understands — `reason`, `approveOptions`, `ruleSuggestion`, `matchedRule`, `requestedBy`, `onExplain`, `onApprove`, `onReject`, `onRejectWithFeedback`, `labels` — plus `isPending` while the call is still running. Once the host settles the request, replace the entry with `{ outcome: { decision: 'approved' | 'rejected', scope } }` and the footer gives way to a quiet settled line. An id with no call in the transcript is ignored, and dropping the entry removes the footer. `MessageList` rendered on its own takes the same map through `ToolApprovalsProvider`. The settled line names the scope the call was approved with: set `labels.toolApproval.scopes`, for example `{ session: 'for this session' }`, or it falls back to the label of the matching approve option and then to the scope itself.",
      },
      {
        type: 'example',
        title: 'Approving an MCP call',
        previewId: 'AgentChat/approvals',
        code: `const [approvals, setApprovals] = useState<ToolApprovals>({
  "call-create-issue": {
    isPending: true,
    reason: "Creates an issue in the tracker workspace",
    requestedBy: { name: "triage agent", color: "blue" },
    approveOptions: [
      { value: "once", label: "Allow once" },
      { value: "session", label: "Allow for this session" },
    ],
    onApprove: (scope) =>
      setApprovals({ "call-create-issue": { outcome: { decision: "approved", scope } } }),
    onReject: () =>
      setApprovals({ "call-create-issue": { outcome: { decision: "rejected" } } }),
  },
});

<AgentChat
  messages={messages}
  status="ready"
  onSend={send}
  onStop={stop}
  approvals={approvals}
/>`,
      },
      {
        type: 'usage',
        title: 'Presentation',
        content:
          "`presentation` sets how the transcript lays out tool calls. `'cards'`, the default, keeps a card per call. `rowsPresentation` shows the flat transcript of a terminal client: a marker, the call and its answer under a gutter, with even spacing. `quietPresentation` turns MCP calls and thinking into muted lines that open into their arguments and result; the thinking and the finished or running calls a turn makes before its answer fold into one line such as `Thought · used 2 tools · 26s`, and a call that waits for a decision in `approvals` stays outside that line with a frame and its buttons. Other tool parts keep their cards. Both presentations are values imported from the package root, so a host that does not import them does not ship their code.",
      },
      {
        type: 'example',
        title: 'Cards rows and quiet lines',
        previewId: 'AgentChat/presentation',
        code: `import { AgentChat, quietPresentation, rowsPresentation } from "@sinups/ai-kit";

<>
  <AgentChat
    messages={messages}
    status={status}
    onSend={send}
    onStop={stop}
    presentation={quietPresentation}
    toolCatalog={catalog}
  />
  <AgentChat {...chat} presentation={rowsPresentation} />
</>`,
      },
      {
        type: 'usage',
        title: 'Tool catalog and formatters',
        content:
          "`toolCatalog` takes the tool definitions of the connected MCP servers keyed by `mcp__<server>__<tool>`; the full part type and the bare tool name also match. Each entry is the `Tool` of the MCP specification (https://modelcontextprotocol.io/specification): `title`, `description`, `annotations`, `inputSchema` and `outputSchema`. A call then reads by the tool title instead of its name, its arguments by the order, titles and formats of `inputSchema` (a string argument stays a string), and its result strictly by the `CallToolResult`: `structuredContent` by `outputSchema` (an array is counted only when the schema declares one, dates are dates only by `format`), else no inline summary: a result of text alone shows only when the call is opened, as it is, never parsed as JSON (give it a summary with `toolOutputs`); image and audio blocks show as a preview and a player, `resource_link` and `resource` as file chips, `isError` as a failure. The result may arrive as the `CallToolResult` object or as its bare array of content blocks. `toolArgs` and `toolOutputs` format the arguments line and the result of a call. They are keyed like `toolRenderers`, by the full part type or a server-wide `tool-mcp__<server>__*`, and return `null` to keep the summary the kit builds. A formatter receives the part and a context with `state`, `summary` and `locale`, plus `args` and `schema` for arguments, or `output`, `result`, `schema` and `labels` for results. `result` is the `CallToolResult` and the recommended input; `output` keeps the value 0.3 gave: the text of the content, parsed when it holds JSON. `locale` formats numbers and dates; the runtime locale is the default.",
      },
      {
        type: 'example',
        title: 'Catalog formatters and locale',
        previewId: 'AgentChat/tool-catalog',
        code: `const catalog = {
  mcp__issues__list_issues: {
    title: "Find issues",
    description: "Lists issues that match a filter",
    annotations: { readOnlyHint: true },
  },
  mcp__git__log: { title: "Read the commit log" },
};

<AgentChat
  {...chat}
  presentation={quietPresentation}
  toolCatalog={catalog}
  toolArgs={{
    "tool-mcp__issues__list_issues": (part, { args }) =>
      args.assignee === "__me__" ? "Open issues assigned to me" : null,
  }}
  toolOutputs={{
    "tool-mcp__issues__*": (part, { state, summary }) =>
      state === "done" ? summary + " in the tracker" : null,
  }}
  locale="de-DE"
/>`,
      },
      {
        type: 'usage',
        title: 'Labels',
        content:
          "`labels` translates the whole chat. Its sections merge key by key with the English defaults: `messageList` (including `search`, `toolRuns` and `planning`), `inputBar`, `welcome`, `errorMessage`, `turnSummary`, `toolApproval`, the tool sections `toolTitles`, `toolCall`, `toolCard`, `toolRow`, `mcpTool`, `bashTool`, `editTool`, `searchTool`, `todoTool`, `planTool`, `toolGroup` and `thinkingTool`, plus `durationUnits`, `errorTitle` and `placeholder`. `durationUnits` (`hours`, `minutes`, `seconds`, `milliseconds`) applies to every duration in the transcript: the turn summary, the working line, running calls and thinking. `messageList.toolRuns` holds the phrases of folded runs, such as `otherTools` and `thought`; `messageList.planning` is the row shown before the first token when `workingRow` is off. `inputBarProps.labels`, `emptyState.labels` and the `labels` of an approval request win over the matching section. A `MessageList` rendered on its own reads the same sections from `ChatLabelsProvider`.",
      },
      {
        type: 'example',
        title: 'Translated chat',
        previewId: 'AgentChat/labels',
        code: `const labels: Partial<AgentChatLabels> = {
  placeholder: "Nachricht schreiben…",
  thinkingTool: {
    thinking: "Denkt nach",
    thought: (duration) => (duration ? duration + " nachgedacht" : "Nachgedacht"),
  },
  durationUnits: { hours: " Std.", minutes: " Min.", seconds: " s", milliseconds: " ms" },
  messageList: {
    planning: "Wird vorbereitet…",
    toolRuns: { thought: "nachgedacht", otherTools: (count) => count + " Werkzeuge genutzt" },
  },
  toolApproval: {
    approve: "Erlauben",
    reject: "Ablehnen",
    approved: "Erlaubt",
    scopes: { once: "einmal", session: "für diese Sitzung" },
  },
};

<AgentChat {...chat} labels={labels} locale="de-DE" approvals={approvals} />`,
      },
      {
        type: 'usage',
        title: 'Working row and motion',
        content:
          "`workingRow` shows a quiet line at the end of the transcript while the agent works between tool calls, `true` by default; pass a node, for example an `AgentStatus` with your own label and token count, to replace it. `toolActivity` shows how long a running call has been going and the progress its MCP server reports, `true` by default. `evenSpacing` puts one gap between every two blocks (prompt, answer text, tool call) instead of the tighter gaps around the prompt, `false` by default and always on with `rowsPresentation`. `animateAppearance` fades a newly arrived message or part in over 150ms, `true` by default; the transcript already on screen at mount never animates, and `prefers-reduced-motion` turns it off. `frameBatched` commits the streaming answer at most once per animation frame, `true` by default; a finished stream, a hidden tab and reduced motion commit right away. `tailGranularity` reveals the streaming tail by character (`'char'`, the default) or by finished line (`'line'`).",
      },
      {
        type: 'example',
        title: 'Working row and tool activity',
        previewId: 'AgentChat/working-row',
        code: `<AgentChat
  {...chat}
  status="streaming"
  toolActivity
  workingRow={<AgentStatus label="Querying postgres" startedAt={turnStartedAt} tokens={usage.tokens} />}
/>`,
      },
      {
        type: 'example',
        title: 'Full-page chat',
        previewId: 'AgentChat/full-page',
        code: `<AgentChat
  messages={messages}
  status={status}
  onSend={handleSend}
  onStop={handleStop}
  contentWidth={760}
  collapseToolRuns
/>`,
      },
    ],
  },
  {
    name: 'MessageList',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { MessageList } from "@sinups/ai-kit";
import type { ChatMessage } from "@sinups/ai-kit";

const messages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "user",
    parts: [{ type: "text", text: "Share the latest status." }],
    createdAt: new Date(),
  },
  {
    id: "msg-2",
    role: "assistant",
    parts: [{ type: "text", text: "All systems are green." }],
  },
];

export function Example() {
  return <MessageList messages={messages} status="ready" />;
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render the full transcript from ChatMessage[]. Use showCopyToolbar for user/assistant text copy, className for container sizing, and slots/classNames/toolRenderers for custom rendering. contentWidth sets the column width: keep the 420px default in a side widget, pass 720 or "100%" in a full-page chat. collapseToolRuns folds three or more consecutive read and search calls into one summary row, and a compaction part renders a CompactBoundary divider.',
      },
      {
        type: 'usage',
        title: 'Presentation and tool context',
        content:
          "`MessageList` takes the same transcript props as `AgentChat`: `presentation` (`'cards'`, `rowsPresentation` or `quietPresentation`), `toolCatalog`, `toolArgs`, `toolOutputs`, `locale`, `evenSpacing`, `workingRow`, `toolActivity`, `animateAppearance`, `frameBatched` and `withSearch`. The defaults differ: `AgentChat` turns on `frameBatched`, `animateAppearance`, `workingRow` and `toolActivity`, while a standalone `MessageList` keeps all four off until you pass `true`. Its own `labels` cover the list: `working`, `planning`, `search`, `toolRuns` and the message toolbar. The rows inside a standalone list read their labels from `ChatLabelsProvider` and their approvals from `ToolApprovalsProvider`; `AgentChat` sets up both from its `labels` and `approvals`.",
      },
      {
        type: 'usage',
        title: 'Custom parts, scrolling and screen readers',
        content:
          "`partRenderers` renders part types the list does not know, keyed by `part.type`; each renderer gets `part`, `messageId`, `index` and `chatStatus`, and a part without one stays hidden. Create the object once, outside the component or with `useMemo`: a new object on every render re-renders finished messages, and the list warns about it in development. `sendScroll=\"prompt-top\"` puts a sent question at the top and grows the answer under it, `streamingCaret` shows a caret after the growing text, and `lazyTurns` (a turn count, `true` means 50) skips layout and paint of finished turns out of view with `content-visibility`. All three are off by default in `MessageList` and `AgentChat`. The list is a `log` with `aria-busy` while an answer streams; `labels.answerReady`, `labels.answerFailed` or, after `stopped`, `labels.answerStopped` is announced once when it ends; `AgentChat` sets `stopped` from its stop button. `messageActions.actions` adds host buttons to the toolbar of each message, usually `MessageActionButton`.",
      },
      {
        type: 'example',
        title: 'Presentations',
        previewId: 'MessageList/presentation',
        code: `import {
  ChatLabelsProvider,
  MessageList,
  ToolApprovalsProvider,
  quietPresentation,
} from "@sinups/ai-kit";

<ChatLabelsProvider labels={{ durationUnits: { seconds: " s" } }}>
  <ToolApprovalsProvider approvals={approvals}>
    <MessageList
      messages={messages}
      status={status}
      presentation={quietPresentation}
      toolCatalog={catalog}
      evenSpacing
    />
  </ToolApprovalsProvider>
</ChatLabelsProvider>`,
      },
      {
        type: 'example',
        title: 'Basic transcript',
        previewId: 'MessageList/basic',
        code: `const messages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "user",
    parts: [{ type: "text", text: "Share the latest status." }],
  },
  {
    id: "msg-2",
    role: "assistant",
    parts: [{ type: "text", text: "All systems are green." }],
  },
  {
    id: "msg-3",
    role: "user",
    parts: [{ type: "text", text: "Any regressions from last deploy?" }],
  },
  {
    id: "msg-4",
    role: "assistant",
    parts: [{ type: "text", text: "No new errors in the last 24 hours." }],
  },
  {
    id: "msg-5",
    role: "user",
    parts: [{ type: "text", text: "Summarize open tickets." }],
  },
  {
    id: "msg-6",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "3 open: billing follow-up, onboarding issue, and API timeout investigation.",
      },
    ],
  },
];

<MessageList messages={messages} status="ready" />`,
      },
      {
        type: 'example',
        title: 'With timestamps',
        previewId: 'MessageList/timestamps',
        code: `const messages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "user",
    parts: [{ type: "text", text: "Can you summarize this?" }],
    createdAt: new Date(),
  },
  {
    id: "msg-2",
    role: "assistant",
    parts: [{ type: "text", text: "Here is the summary." }],
  },
];

<MessageList messages={messages} status="ready" />`,
      },
      {
        type: 'example',
        title: 'Collapsed tool runs',
        previewId: 'MessageList/tool-runs',
        code: `<MessageList
  messages={messages}
  status="ready"
  collapseToolRuns
  contentWidth={720}
/>`,
      },
      {
        type: 'example',
        title: 'Compacted history',
        previewId: 'MessageList/compaction',
        code: `const messages: ChatMessage[] = [
  {
    id: "cmp-s1",
    role: "system",
    parts: [
      {
        type: "compaction",
        tokensBefore: 182_400,
        tokensAfter: 12_300,
        summary: "- Migrated the upload client\\n- Tests for backoff are green",
      },
    ],
  },
  { id: "cmp-u1", role: "user", parts: [{ type: "text", text: "Keep 5 attempts and ship it." }] },
];

<MessageList messages={messages} status="ready" contentWidth={720} />`,
      },
    ],
  },
  {
    name: 'InputBar',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { InputBar } from "@sinups/ai-kit";\n\nexport function Example() {\n  return (\n    <InputBar\n      onSend={({ content }) => console.log(content)}\n      status=\"ready\"\n      onStop={() => {}}\n    />\n  );\n}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Collect prompts and attachments in the composer. Supports controlled mode (value/onChange), drag/paste handling, info bar, typing animation, multi-question navigation, and free-form toolbar slots (leftActions/rightActions) for composing model/mode pickers or any custom controls.',
      },
      {
        type: 'example',
        title: 'Basic input',
        previewId: 'InputBar/basic',
        code: `<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n/>`,
      },
      {
        type: 'example',
        title: 'With attachments',
        previewId: 'InputBar/attachments',
        code: `<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n  onAttach={onAttach}\n  attachedImages={images}\n  attachedFiles={files}\n  onRemoveImage={onRemoveImage}\n  onRemoveFile={onRemoveFile}\n/>`,
      },
      {
        type: 'example',
        title: 'Focus outline',
        previewId: 'InputBar/outline',
        code: `<div style={{ "--ae-input-focus-outline": "var(--mantine-color-cyan-5)" } as React.CSSProperties }>\n  <InputBar\n    onSend={handleSend}\n    status=\"ready\"\n    onStop={handleStop}\n    autoFocus\n  />\n</div>`,
      },
      {
        type: 'example',
        title: 'Info bar',
        previewId: 'InputBar/info',
        code: `<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n  infoBar={{\n    title: \"Syncing workspace\",\n    description: \"We will keep watching for changes.\",\n    onClose: () => {},\n  }}\n/>`,
      },
      {
        type: 'example',
        title: 'Info bar (bottom)',
        previewId: 'InputBar/info-bottom',
        code: `<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n  infoBar={{\n    title: \"Syncing workspace\",\n    description: \"We will keep watching for changes.\",\n    onClose: () => {},\n    position: \"bottom\",\n  }}\n/>`,
      },
      {
        type: 'example',
        title: 'Question bar',
        previewId: 'InputBar/question',
        code: `const questions = [\n  {\n    kind: "single",\n    title: "Which direction should I take?",\n    options: [\n      { id: "small", label: "Small patch" },\n      { id: "full", label: "Full refactor" },\n    ],\n    allowCustom: true,\n  },\n  {\n    kind: "single",\n    title: "How cautious should the rollout be?",\n    options: [\n      { id: "safe", label: "Safe and incremental" },\n      { id: "fast", label: "Fast rollout" },\n    ],\n    allowCustom: true,\n  },\n];\n\n<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n  questionBar={{\n    id: \"question-1\",\n    questions,\n    submitLabel: \"Submit\",\n    skipLabel: \"Skip\",\n    onSubmit: (answer, { questionIndex }) => console.log(questionIndex, answer),\n    onSkip: ({ questionIndex }) => console.log(\"skipped\", questionIndex),\n  }}\n/>`,
      },
      {
        type: 'example',
        title: 'Toolbar actions (model + mode)',
        previewId: 'InputBar/toolbar-actions',
        code: `import { InputBar } from "@sinups/ai-kit";\nimport { ModelPicker } from "@sinups/ai-kit";\nimport { ModeSelector } from "@sinups/ai-kit";\nimport { IconPointer, IconBulb } from "@tabler/icons-react";\n\nconst models = [\n  { id: "llama-3.3-70b", name: "Llama 3.3", version: "70B" },\n  { id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder", version: "32B" },\n];\n\nconst modes = [\n  { id: "agent", label: "Agent", icon: IconPointer },\n  { id: "plan", label: "Plan", icon: IconBulb },\n];\n\n<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n  leftActions={\n    <>\n      <ModeSelector modes={modes} defaultValue=\"agent\" />\n      <ModelPicker models={models} defaultValue=\"llama-3.3-70b\" />\n    </>\n  }\n/>`,
      },
      {
        type: 'example',
        title: 'Commands and mentions',
        previewId: 'InputBar/completions',
        code: `const completions: CompletionSource[] = [
  {
    trigger: "/",
    items: [
      { value: "review", label: "/review", description: "Review the current diff", group: "Commands" },
      { value: "compact", label: "/compact", description: "Summarize the conversation", group: "Commands" },
    ],
  },
  { trigger: "@", items: async (query) => searchPeople(query) },
];

<InputBar
  onSend={handleSend}
  status="ready"
  onStop={handleStop}
  completions={completions}
/>`,
      },
      {
        type: 'example',
        title: 'Message queue',
        previewId: 'InputBar/queue',
        code: `<InputBar
  status="streaming"
  onSend={handleSend}
  onStop={handleStop}
  onQueue={({ content }) => setQueue((prev) => [...prev, { id: crypto.randomUUID(), content }])}
  queuedMessages={queue}
  onRemoveQueued={(id) => setQueue((prev) => prev.filter((item) => item.id !== id))}
/>`,
      },
      {
        type: 'example',
        title: 'Full-width composer',
        previewId: 'InputBar/full-width',
        code: `<InputBar
  onSend={handleSend}
  status="ready"
  onStop={handleStop}
  contentWidth="100%"
/>`,
      },
    ],
  },
  {
    name: 'Suggestions',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { InputBar } from "@sinups/ai-kit";
import { IconCalendar, IconCode, IconPencil, IconSearch } from "@tabler/icons-react";
import { useState } from "react";

const items = [
  {
    id: "write",
    label: "Write",
    value: "Write a concise project update with key milestones.",
    icon: <IconPencil className="h-3.5 w-3.5" aria-hidden />,
  },
  {
    id: "learn",
    label: "Learn",
    value: "Explain this codebase architecture in plain language.",
    icon: <IconSearch className="h-3.5 w-3.5" aria-hidden />,
  },
  {
    id: "code",
    label: "Code",
    value: "Generate a clean starter implementation for this feature.",
    icon: <IconCode className="h-3.5 w-3.5" aria-hidden />,
  },
  {
    id: "calendar",
    label: "From Calendar",
    value: "Draft my agenda from tomorrow's calendar events.",
    icon: <IconCalendar className="h-3.5 w-3.5" aria-hidden />,
  },
];

export function Example() {
  const [value, setValue] = useState("");

  return (
    <InputBar
      value={value}
      onChange={setValue}
      onSend={({ content }) => console.log(content)}
      status="ready"
      onStop={() => {}}
      suggestions={{
        items,
        className: "justify-center",
        itemClassName: "h-7 rounded-[6px] px-2 text-sm",
      }}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Show quick prompt chips and write the selected suggestion into InputBar for fast message drafting. Use disabled to pause interaction and item.className for per-chip styling.',
      },
      {
        type: 'example',
        title: 'Icons + text',
        previewId: 'Suggestions/basic',
        code: `import { IconCalendar, IconCode, IconPencil, IconSearch } from "@tabler/icons-react";

const items = [
  { id: "write", label: "Write", icon: <IconPencil className="h-3.5 w-3.5" aria-hidden /> },
  { id: "learn", label: "Learn", icon: <IconSearch className="h-3.5 w-3.5" aria-hidden /> },
  { id: "code", label: "Code", icon: <IconCode className="h-3.5 w-3.5" aria-hidden /> },
  { id: "calendar", label: "From Calendar", icon: <IconCalendar className="h-3.5 w-3.5" aria-hidden /> },
];

<Suggestions
  items={items}
  onSelect={(item) => console.log(item)}
  className="justify-center"
  itemClassName="h-7 rounded-[6px] px-2 text-sm"
/>`,
      },
      {
        type: 'example',
        title: 'Fill InputBar',
        previewId: 'Suggestions/fill',
        code: `const [value, setValue] = useState("");

<InputBar
  value={value}
  onChange={setValue}
  onSend={handleSend}
  status="ready"
  onStop={handleStop}
  suggestions={{
    items,
    className: "justify-center",
    itemClassName: "h-7 rounded-[6px] px-2 text-sm",
  }}
/>`,
      },
    ],
  },
  {
    name: 'ModelPicker',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { ModelPicker } from "@sinups/ai-kit";
import { useState } from "react";

const models = [
  { id: "llama-3.3-70b", name: "Llama 3.3", version: "70B" },
  { id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder", version: "32B" },
  { id: "mistral-small-24b", name: "Mistral Small", version: "24B" },
];

export function Example() {
  const [model, setModel] = useState("llama-3.3-70b");
  return (
    <ModelPicker
      models={models}
      value={model}
      onChange={setModel}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Standalone model picker. Drop it into InputBar via leftActions/rightActions, a header, a settings sheet, or anywhere else. It does not depend on InputBar. Supports controlled and uncontrolled modes. Use ModelBadge for a read-only variant.',
      },
      {
        type: 'example',
        title: 'Uncontrolled',
        previewId: 'ModelPicker/basic',
        code: `<ModelPicker models={models} defaultValue="llama-3.3-70b" />`,
      },
      {
        type: 'example',
        title: 'Inside InputBar',
        previewId: 'ModelPicker/in-input-bar',
        code: `<InputBar
  onSend={handleSend}
  status="ready"
  onStop={handleStop}
  leftActions={
    <ModelPicker models={models} defaultValue="llama-3.3-70b" />
  }
/>`,
      },
      {
        type: 'example',
        title: 'Read-only badge',
        previewId: 'ModelPicker/badge',
        code: `<ModelBadge models={models} value="qwen-2.5-coder-32b" />`,
      },
    ],
  },
  {
    name: 'ModeSelector',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { ModeSelector, type ModeOption } from "@sinups/ai-kit";
import { IconPointer, IconBulb } from "@tabler/icons-react";
import { useState } from "react";

const modes: ModeOption[] = [
  { id: "agent", label: "Agent", icon: IconPointer },
  { id: "plan", label: "Plan", icon: IconBulb, description: "Think before acting" },
];

export function Example() {
  const [mode, setMode] = useState("agent");
  return <ModeSelector modes={modes} value={mode} onChange={setMode} />;
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Standalone mode selector: agent mode, plan mode, or any custom set. Bring your own icons or omit them. With a single mode the selector renders a non-interactive label.',
      },
      {
        type: 'example',
        title: 'Uncontrolled',
        previewId: 'ModeSelector/basic',
        code: `<ModeSelector modes={modes} defaultValue=\"agent\" />`,
      },
      {
        type: 'example',
        title: 'Inside InputBar',
        previewId: 'ModeSelector/in-input-bar',
        code: `<InputBar
  onSend={handleSend}
  status="ready"
  onStop={handleStop}
  leftActions={<ModeSelector modes={modes} defaultValue="agent" />}
/>`,
      },
    ],
  },
  {
    name: 'UserMessage',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { UserMessage } from "@sinups/ai-kit";
import type { ChatMessage } from "@sinups/ai-kit";

const message: ChatMessage = {
  id: "user-1",
  role: "user",
  parts: [{ type: "text", text: "Share the latest status." }],
};

export function Example() {
  return <UserMessage message={message} />;
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render a single user bubble. Supports text, image parts (image/data-image/image file), and file attachments.',
      },
      {
        type: 'example',
        title: 'Text only',
        previewId: 'UserMessage/basic',
        code: `const message: ChatMessage = {
  id: "user-1",
  role: "user",
  parts: [{ type: "text", text: "Share the latest status." }],
};

<UserMessage message={message} />`,
      },
      {
        type: 'example',
        title: 'With image',
        previewId: 'UserMessage/images',
        code: `const message: ChatMessage = {
  id: "user-2",
  role: "user",
  parts: [
    { type: "text", text: "Here is the screenshot." },
    { type: "data-image", data: { url: imageUrl } },
  ],
};

<UserMessage message={message} />`,
      },
    ],
  },
  {
    name: 'Markdown',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { Markdown } from "@sinups/ai-kit";\n\n' +
          'const content = [\n' +
          '  "# Release notes",\n' +
          '  "",\n' +
          '  "- Added streaming markdown",\n' +
          '  "- Improved tool rendering",\n' +
          '  "",\n' +
          '  "## Example",\n' +
          '  "",\n' +
          '  "Use \\"Markdown\\" to render assistant text as it streams.",\n' +
          '  "",\n' +
          '  "```ts",\n' +
          '  "console.log(\\"Hello from markdown\\");",\n' +
          '  "```",\n' +
          '].join("\\n");\n\n' +
          'export function Example() {\n' +
          '  return <Markdown content={content} />;\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render streaming markdown with headings, lists, tables, blockquotes, and code fences. External links get safe target/rel handling.',
      },
      {
        type: 'usage',
        title: 'Links and caret',
        content:
          'Links render as links, except `javascript:`, `vbscript:`, `data:`, `blob:` and `file:` ones, which render as text. `onLinkClick(href, event)` sees every click, and `linkSchemes` names your own schemes such as `artifact:`: such a link never navigates and only reaches `onLinkClick`. Wrap a chat in `MarkdownLinksProvider` to set both for every answer. `streamingCaret` shows a caret after the growing text while `streaming`.',
      },
      {
        type: 'example',
        title: 'Release note snippet',
        previewId: 'Markdown/release',
        code:
          'const content = [\n' +
          '  "# Release notes",\n' +
          '  "",\n' +
          '  "- Added streaming markdown",\n' +
          '  "- Improved tool rendering",\n' +
          '  "",\n' +
          '  "## Example",\n' +
          '  "",\n' +
          '  "Use \\"Markdown\\" to render assistant text as it streams.",\n' +
          '  "",\n' +
          '  "```ts",\n' +
          '  "console.log(\\"Hello from markdown\\");",\n' +
          '  "```",\n' +
          '].join("\\n");\n\n' +
          '<Markdown content={content} />',
      },
      {
        type: 'example',
        title: 'Tables + links',
        previewId: 'Markdown/table',
        code:
          'const content = [\n' +
          '  "| Tool | Status |",\n' +
          '  "| --- | --- |",\n' +
          '  "| Search | Ready |",\n' +
          '  "| Bash | Ready |",\n' +
          '  "",\n' +
          '  "Visit [docs](https://example.com) for details.",\n' +
          '].join("\\n");\n\n' +
          '<Markdown content={content} />',
      },
      {
        type: 'example',
        title: 'Streaming update',
        previewId: 'Markdown/streaming',
        code:
          'import { useEffect, useState } from "react";\n' +
          '\n' +
          'const fullContent = [\n' +
          '  "### Working plan",\n' +
          '  "",\n' +
          '  "- Parse input context",\n' +
          '  "- Extract constraints",\n' +
          '  "- Draft outline",\n' +
          '  "",\n' +
          '  "#### Draft",\n' +
          '  "We will deliver a tight summary, then provide supporting details.",\n' +
          '  "",\n' +
          '  "```ts",\n' +
          '  "const steps = [\\"parse\\", \\"outline\\", \\"draft\\"];",\n' +
          '  "```",\n' +
          '  "",\n' +
          '  "| Step | Status |",\n' +
          '  "| --- | --- |",\n' +
          '  "| Parse | Done |",\n' +
          '  "| Outline | Done |",\n' +
          '  "| Draft | Running |",\n' +
          '  "",\n' +
          '  "Final answer coming next...",\n' +
          '].join("\\n");\n' +
          '\n' +
          'export function Example() {\n' +
          '  const [content, setContent] = useState("");\n' +
          '  const [isStreaming, setIsStreaming] = useState(false);\n' +
          '\n' +
          '  const runStream = () => {\n' +
          '    setContent("");\n' +
          '    setIsStreaming(true);\n' +
          '    let i = 0;\n' +
          '    const tick = () => {\n' +
          '      i += 1;\n' +
          '      setContent(fullContent.slice(0, i));\n' +
          '      if (i >= fullContent.length) {\n' +
          '        setIsStreaming(false);\n' +
          '        return;\n' +
          '      }\n' +
          '      setTimeout(tick, 18);\n' +
          '    };\n' +
          '    setTimeout(tick, 120);\n' +
          '  };\n' +
          '\n' +
          '  useEffect(() => {\n' +
          '    runStream();\n' +
          '  }, []);\n' +
          '\n' +
          '  return (\n' +
          '    <div className="space-y-2">\n' +
          '      <div className="flex items-center justify-between">\n' +
          '        <div className="text-xs text-muted-foreground">\n' +
          '          {isStreaming ? "Streaming..." : "Idle"}\n' +
          '        </div>\n' +
          '        <button\n' +
          '          type="button"\n' +
          '          onClick={runStream}\n' +
          '          className="text-xs px-2 py-1 rounded-md border border-border bg-background hover:bg-muted transition-colors"\n' +
          '        >\n' +
          '          Replay\n' +
          '        </button>\n' +
          '      </div>\n' +
          '      <Markdown content={content} />\n' +
          '    </div>\n' +
          '  );\n' +
          '}',
      },
    ],
  },
  {
    name: 'AttachmentButton',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { AttachmentButton } from "@sinups/ai-kit";

export function Example() {
  return <AttachmentButton onClick={() => {}} />;
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render the round plus attachment trigger used by InputBar. Use onClick to open your picker action.',
      },
      {
        type: 'example',
        title: 'Default',
        previewId: 'AttachmentButton/basic',
        code: `<AttachmentButton onClick={() => {}} />`,
      },
      {
        type: 'example',
        title: 'Paperclip icon',
        previewId: 'AttachmentButton/paperclip',
        code: `<AttachmentButton onClick={() => {}} icon="paperclip" />`,
      },
      {
        type: 'example',
        title: 'Without handler',
        previewId: 'AttachmentButton/passive',
        code: `<AttachmentButton />`,
      },
    ],
  },
  {
    name: 'SendButton',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { SendButton } from "@sinups/ai-kit";

export function Example() {
  return (
    <SendButton state="idle" />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content: 'Render the send/stop control. Use state=idle | typing | streaming.',
      },
      {
        type: 'example',
        title: 'Idle',
        previewId: 'SendButton/idle',
        code: `<SendButton state="idle" />`,
      },
      {
        type: 'example',
        title: 'Typing',
        previewId: 'SendButton/typing',
        code: `<SendButton state="typing" />`,
      },
      {
        type: 'example',
        title: 'Streaming',
        previewId: 'SendButton/streaming',
        code: `<SendButton state="streaming" />`,
      },
    ],
  },
  {
    name: 'FileAttachment',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { FileAttachment } from "@sinups/ai-kit";

export function Example() {
  return (
    <FileAttachment
      id="file-1"
      filename="report.pdf"
      size={23000}
      onRemove={() => {}}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render a file/image chip. Use isImage + url for thumbnails, display="image-only" for previews, and onRemove to show the close control. While you upload, pass `status="uploading"` with `progress` from 0 to 100 (a bar in the chip, a ring over a thumbnail; without `progress` the bar animates, the thumbnail shows a loader and neither reports a value) and `onCancel`, which the × button then calls instead of `onRemove`. After a failure pass `status="error"` with `error` and `onRetry`; screen readers hear the failure once. In `InputBar` the same fields go on `attachedFiles` and `attachedImages`, with `onCancelFile` and `onRetryFile`; Send stays off while anything uploads (`blockSendWhileUploading`) and says `labels.waitForUploads`. The kit never uploads: the network is yours.',
      },
      {
        type: 'example',
        title: 'Upload states',
        previewId: 'FileAttachment/uploads',
        code: `<FileAttachment id="1" filename="dataset.csv" status="uploading" progress={64} onCancel={cancel} />
<FileAttachment id="2" filename="recording.m4a" status="uploading" onCancel={cancel} />
<FileAttachment id="3" filename="archive.zip" status="error" error="The file is larger than 20 MB" onRetry={retry} onRemove={remove} />`,
      },
      {
        type: 'example',
        title: 'File + image',
        previewId: 'FileAttachment/basic',
        code: `<FileAttachment id="file-1" filename="report.pdf" size={23000} />
<FileAttachment
  id="file-2"
  filename="design.png"
  size={120000}
  isImage
  url="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80"
/>`,
      },
      {
        type: 'example',
        title: 'Image only',
        previewId: 'FileAttachment/image',
        code: `<FileAttachment
  id="img-1"
  filename="hero.png"
  isImage
  url="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80"
  display="image-only"
  onRemove={() => {}}
/>`,
      },
      {
        type: 'example',
        title: 'Removable file',
        previewId: 'FileAttachment/removable',
        code: `<FileAttachment
  id="file-3"
  filename="notes.md"
  size={4200}
  onRemove={() => {}}
/>`,
      },
    ],
  },
  {
    name: 'TextShimmer',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { TextShimmer } from "@sinups/ai-kit";

export function Example() {
  return (
    <TextShimmer as="span" duration={1.4} spread={80}>
      Syncing metadata
    </TextShimmer>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content: 'Render shimmering status text. Tune duration, spread, and delay.',
      },
      {
        type: 'example',
        title: 'Inline status',
        previewId: 'TextShimmer/inline',
        code: `<TextShimmer as="span" duration={1.4} spread={80}>
  Syncing metadata
</TextShimmer>`,
      },
      {
        type: 'example',
        title: 'Delayed shimmer',
        previewId: 'TextShimmer/delayed',
        code: `<TextShimmer as="span" duration={2.2} spread={140} delay={0.6}>
  Calculating risk score
</TextShimmer>`,
      },
      {
        type: 'example',
        title: 'Fast shimmer',
        previewId: 'TextShimmer/fast',
        code: `<TextShimmer as="span" duration={0.9} spread={60}>
  Rapid sync
</TextShimmer>`,
      },
    ],
  },
  {
    name: 'SpiralLoader',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { SpiralLoader } from "@sinups/ai-kit";

export function Example() {
  return <SpiralLoader size={24} />;
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render the spiral loader. Use size to control the square canvas and className for layout styling.',
      },
      {
        type: 'example',
        title: 'Sizes',
        previewId: 'SpiralLoader/sizes',
        code: `<div className="flex items-center gap-4">
  <SpiralLoader size={16} />
  <SpiralLoader size={24} />
  <SpiralLoader size={32} />
</div>`,
      },
    ],
  },
  {
    name: 'BashTool',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { BashTool } from "@sinups/ai-kit";\n\n' +
          'const part = {\n' +
          '  type: "tool-Bash",\n' +
          '  toolCallId: "bash-1",\n' +
          '  state: "output-available",\n' +
          '  input: { command: "ls -la" },\n' +
          '  output: { stdout: "app\\nlib\\nREADME.md" },\n' +
          '};\n\n' +
          'export function Example() {\n' +
          '  return <BashTool part={part} />;\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render a command tool card. Provide input.command and optional output.stdout; use input.approval for the footer.',
      },
      {
        type: 'example',
        title: 'Terminal card',
        previewId: 'BashTool/terminal',
        code: `<BashTool
  part={part}
/>`,
      },
      {
        type: 'example',
        title: 'Running state',
        previewId: 'BashTool/pending',
        code:
          'const pendingPart = {\n' +
          '  type: "tool-Bash",\n' +
          '  toolCallId: "bash-2",\n' +
          '  state: "input-streaming",\n' +
          '  input: { command: "git status" },\n' +
          '};\n\n' +
          '<BashTool part={pendingPart} />',
      },
      {
        type: 'example',
        title: 'Approval footer',
        previewId: 'BashTool/approval',
        code:
          'const approvalPart = {\n' +
          '  type: "tool-Bash",\n' +
          '  toolCallId: "bash-3",\n' +
          '  state: "input-available",\n' +
          '  input: {\n' +
          '    command: "pnpm test --filter ./apps/web -- --runInBand",\n' +
          '    approval: { labels: { approve: "Run", reject: "Skip" } },\n' +
          '  },\n' +
          '};\n\n' +
          '<BashTool part={approvalPart} />',
      },
    ],
  },
  {
    name: 'EditTool',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { EditTool } from "@sinups/ai-kit";\n\n' +
          'const part = {\n' +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-1",\n' +
          '  state: "output-available",\n' +
          '  input: { file_path: "/app/page.tsx" },\n' +
          '  output: {\n' +
          '    old_content: "export const metadata = { title: \'Old\' };\\n\\nexport default function Page() {\\n  return <div>Old content</div>;\\n}\\n",\n' +
          '    content: "export const metadata = { title: \'Updated\' };\\n\\nexport default function Page() {\\n  return (\\n    <div>\\n      <h1>Release notes</h1>\\n      <p>New layout applied.</p>\\n    </div>\\n  );\\n}\\n",\n' +
          '  },\n' +
          '};\n\n' +
          'export function Example() {\n' +
          '  return <EditTool part={part} />;\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render a diff card for file edits. Supply input.file_path plus diff content (old/new or structuredPatch); use input.approval for the footer.',
      },
      {
        type: 'example',
        title: 'Diff card',
        previewId: 'EditTool/diff',
        code: `<EditTool
  part={part}
/>`,
      },
      {
        type: 'example',
        title: 'Approval footer',
        previewId: 'EditTool/approval',
        code:
          'const approvalPart = {\n' +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-7",\n' +
          '  state: "output-available",\n' +
          '  input: {\n' +
          '    file_path: "/app/page.tsx",\n' +
          '    approval: { labels: { approve: "Apply", reject: "Skip" } },\n' +
          '  },\n' +
          '  output: {\n' +
          '    old_content: "export const metadata = { title: \'Old\' };\\n\\nexport default function Page() {\\n  return <div>Old content</div>;\\n}\\n",\n' +
          '    content: "export const metadata = { title: \'Updated\' };\\n\\nexport default function Page() {\\n  return <div>New content</div>;\\n}\\n",\n' +
          '  },\n' +
          '};\n\n' +
          '<EditTool part={approvalPart} />',
      },
      {
        type: 'example',
        title: 'Collapsible diff',
        previewId: 'EditTool/collapsible',
        code:
          'const longPart = {\n' +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-1b",\n' +
          '  state: "output-available",\n' +
          '  input: { file_path: "/app/page.tsx" },\n' +
          '  output: {\n' +
          '    old_content: "export const metadata = { title: \'Old\' };\\n\\nexport default function Page() {\\n  return (\\n    <div>\\n      <h1>Dashboard</h1>\\n      <p>Old copy here.</p>\\n      <section>\\n        <h2>Highlights</h2>\\n        <ul>\\n          <li>Shipping ETA</li>\\n          <li>Billing status</li>\\n          <li>Support inbox</li>\\n        </ul>\\n      </section>\\n      <section>\\n        <h2>Activity</h2>\\n        <p>Recent items...</p>\\n      </section>\\n    </div>\\n  );\\n}\\n",\n' +
          '    content: "export const metadata = { title: \'Updated\' };\\n\\nexport default function Page() {\\n  return (\\n    <div>\\n      <header>\\n        <h1>Release notes</h1>\\n        <p>New layout applied.</p>\\n      </header>\\n      <section>\\n        <h2>Highlights</h2>\\n        <ul>\\n          <li>Sync latency improvements</li>\\n          <li>Workspace search redesign</li>\\n          <li>Billing transparency</li>\\n        </ul>\\n      </section>\\n      <section>\\n        <h2>Activity</h2>\\n        <p>Recent items with timestamps...</p>\\n      </section>\\n      <section>\\n        <h2>More</h2>\\n        <p>Additional details and links.</p>\\n      </section>\\n    </div>\\n  );\\n}\\n",\n' +
          '  },\n' +
          '};\n\n' +
          '<EditTool part={longPart} isCollapsible />',
      },
      {
        type: 'example',
        title: 'Pending edit',
        previewId: 'EditTool/pending',
        code:
          'const pendingPart = {\n' +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-2",\n' +
          '  state: "input-streaming",\n' +
          '  input: {\n' +
          '    file_path: "/app/page.tsx",\n' +
          '    old_string: "const title = \'Old\';\\n",\n' +
          '    new_string: "const title = \'Updated\';\\n",\n' +
          '  },\n' +
          '};\n\n' +
          '<EditTool part={pendingPart} />',
      },
      {
        type: 'example',
        title: 'Waiting for diff',
        previewId: 'EditTool/placeholder',
        code:
          'const placeholderPart = {\n' +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-2b",\n' +
          '  state: "input-streaming",\n' +
          '  input: {},\n' +
          '};\n\n' +
          '<EditTool part={placeholderPart} />',
      },
      {
        type: 'example',
        title: 'Structured patch',
        previewId: 'EditTool/patch',
        code:
          'const patchPart = {\n' +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-3",\n' +
          '  state: "output-available",\n' +
          '  input: { file_path: "/app/page.tsx" },\n' +
          '  output: {\n' +
          '    structuredPatch: [\n' +
          '      {\n' +
          '        lines: [\n' +
          '          "-const title = \'Old\';",\n' +
          '          "+const title = \'Updated\';",\n' +
          '        ],\n' +
          '      },\n' +
          '    ],\n' +
          '  },\n' +
          '};\n\n' +
          '<EditTool part={patchPart} />',
      },
      {
        type: 'example',
        title: 'Write tool',
        previewId: 'EditTool/write',
        code:
          'const writePart = {\n' +
          '  type: "tool-Write",\n' +
          '  toolCallId: "write-1",\n' +
          '  state: "output-available",\n' +
          '  input: { file_path: "/app/new.tsx" },\n' +
          '  output: { content: "export const Demo = () => null\\n" },\n' +
          '};\n\n' +
          '<EditTool part={writePart} />',
      },
      {
        type: 'example',
        title: 'Missing file path',
        previewId: 'EditTool/missing-path',
        code:
          'const noPathPart = {\n' +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-4",\n' +
          '  state: "output-available",\n' +
          '  input: { old_string: "foo", new_string: "bar" },\n' +
          '};\n\n' +
          '<EditTool part={noPathPart} />',
      },
    ],
  },
  {
    name: 'SearchTool',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { SearchTool } from "@sinups/ai-kit";\n\n' +
          'const mockResults = {\n' +
          '  results: [\n' +
          '    { source: "google", title: "United UA837 SFO→NRT · $1,105 economy", date: "google.com/flights" },\n' +
          '    { source: "expedia", title: "SFO–Tokyo · 14 results from $1,089", date: "expedia.com" },\n' +
          '  ],\n' +
          '};\n\n' +
          'const part = {\n' +
          '  type: "tool-WebSearch",\n' +
          '  toolCallId: "search-1",\n' +
          '  state: "output-available",\n' +
          '  input: { query: "best flights to Tokyo" },\n' +
          '  output: mockResults,\n' +
          '};\n\n' +
          'export function Example() {\n' +
          '  return <SearchTool part={part} />;\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render grouped search results. Provide input.query/pattern and output.results (or pass results directly with the results prop). Use defaultOpen to keep it expanded.',
      },
      {
        type: 'example',
        title: 'Rich results',
        previewId: 'SearchTool/rich',
        code: `<SearchTool
  part={part}
/>`,
      },
      {
        type: 'example',
        title: 'Pending search',
        previewId: 'SearchTool/pending',
        code:
          'const pendingPart = {\n' +
          '  type: "tool-WebSearch",\n' +
          '  toolCallId: "search-2",\n' +
          '  state: "input-streaming",\n' +
          '  input: { query: "redis sliding window rate limiting" },\n' +
          '};\n\n' +
          '<SearchTool part={pendingPart} />',
      },
      {
        type: 'example',
        title: 'Alt source set',
        previewId: 'SearchTool/alt',
        code:
          'const altResults = {\n' +
          '  results: [\n' +
          '    { source: "arxiv", title: "Quantum error correction below threshold · Acharya 2024", date: "arxiv.org" },\n' +
          '    { source: "scholar", title: "Utility of quantum computing · Kim et al · 567 cites", date: "scholar.google.com" },\n' +
          '  ],\n' +
          '};\n\n' +
          'const altPart = {\n' +
          '  type: "tool-WebSearch",\n' +
          '  toolCallId: "search-3",\n' +
          '  state: "output-available",\n' +
          '  input: { query: "quantum error correction" },\n' +
          '  output: altResults,\n' +
          '};\n\n' +
          '<SearchTool part={altPart} />',
      },
    ],
  },
  {
    name: 'TodoTool',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { TodoTool } from "@sinups/ai-kit";\n\n' +
          'const part = {\n' +
          '  type: "tool-TodoWrite",\n' +
          '  toolCallId: "todo-1",\n' +
          '  state: "output-available",\n' +
          '  input: {\n' +
          '    todos: [\n' +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "in_progress", activeForm: "Tightening spacing" },\n' +
          '      { content: "Ship updates", status: "pending" },\n' +
          '    ],\n' +
          '  },\n' +
          '  output: { oldTodos: [] },\n' +
          '};\n\n' +
          'export function Example() {\n' +
          '  return <TodoTool part={part} />;\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render task list changes from input.todos, optionally diffed against output.oldTodos.',
      },
      {
        type: 'example',
        title: 'New list',
        previewId: 'TodoTool/new',
        code:
          'const newListPart = {\n' +
          '  type: "tool-TodoWrite",\n' +
          '  toolCallId: "todo-1",\n' +
          '  state: "output-available",\n' +
          '  input: {\n' +
          '    todos: [\n' +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "in_progress", activeForm: "Tightening spacing" },\n' +
          '      { content: "Ship updates", status: "pending" },\n' +
          '    ],\n' +
          '  },\n' +
          '  output: { oldTodos: [] },\n' +
          '};\n\n' +
          '<TodoTool part={newListPart} />',
      },
      {
        type: 'example',
        title: 'Single update',
        previewId: 'TodoTool/single',
        code:
          'const singleUpdatePart = {\n' +
          '  type: "tool-TodoWrite",\n' +
          '  toolCallId: "todo-2",\n' +
          '  state: "output-available",\n' +
          '  input: {\n' +
          '    todos: [\n' +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "completed" },\n' +
          '      { content: "Ship updates", status: "pending" },\n' +
          '    ],\n' +
          '  },\n' +
          '  output: {\n' +
          '    oldTodos: [\n' +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "in_progress" },\n' +
          '      { content: "Ship updates", status: "pending" },\n' +
          '    ],\n' +
          '  },\n' +
          '};\n\n' +
          '<TodoTool part={singleUpdatePart} />',
      },
      {
        type: 'example',
        title: 'Multiple updates',
        previewId: 'TodoTool/multiple',
        code:
          'const multipleUpdatePart = {\n' +
          '  type: "tool-TodoWrite",\n' +
          '  toolCallId: "todo-3",\n' +
          '  state: "output-available",\n' +
          '  input: {\n' +
          '    todos: [\n' +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "completed" },\n' +
          '      { content: "Ship updates", status: "in_progress" },\n' +
          '    ],\n' +
          '  },\n' +
          '  output: {\n' +
          '    oldTodos: [\n' +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "pending" },\n' +
          '      { content: "Ship updates", status: "pending" },\n' +
          '    ],\n' +
          '  },\n' +
          '};\n\n' +
          '<TodoTool part={multipleUpdatePart} />',
      },
      {
        type: 'example',
        title: 'Pending update',
        previewId: 'TodoTool/pending',
        code:
          'const pendingPart = {\n' +
          '  type: "tool-TodoWrite",\n' +
          '  toolCallId: "todo-4",\n' +
          '  state: "input-streaming",\n' +
          '  input: { todos: [{ content: "Ship updates", status: "in_progress" }] },\n' +
          '  output: { oldTodos: [{ content: "Ship updates", status: "pending" }] },\n' +
          '};\n\n' +
          '<TodoTool part={pendingPart} />',
      },
    ],
  },
  {
    name: 'PlanTool',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { PlanTool } from "@sinups/ai-kit";\n\n' +
          'const part = {\n' +
          '  type: "tool-PlanWrite",\n' +
          '  toolCallId: "plan-1",\n' +
          '  state: "output-available",\n' +
          '  input: {\n' +
          '    plan: {\n' +
          '      id: "plan-1",\n' +
          '      title: "Refresh UI previews",\n' +
          '      summary: "Unify tool card spacing and interaction patterns so docs previews feel cohesive across all tool components.\\n\\n1. Standardize card chrome (header height, borders, radius, and muted labels) for Plan, Approval, Edit, Search, and Todo previews.\\n2. Align content density and typography so title, metadata, and body text read consistently at a glance.\\n3. Normalize interaction states: loading shimmer, pending indicators, hover affordances, and disabled action buttons.\\n4. Validate responsive behavior on narrow widths, including truncation rules and action-row wrapping.\\n5. Run a visual QA pass in both light and dark themes and tighten spacing where cards feel too loose or cramped.\\n\\nOutcome: preview gallery feels intentionally designed, easier to scan, and stable across viewport sizes.",\n' +
          '    },\n' +
          '  },\n' +
          '};\n\n' +
          'export function Example() {\n' +
          '  return <PlanTool part={part} />;\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Display a plan title and summary with expand/collapse. Set input.approved to hide approval controls.',
      },
      {
        type: 'example',
        title: 'In progress',
        previewId: 'PlanTool/in-progress',
        code: `<PlanTool
  part={planInProgressPart}
/>`,
      },
      {
        type: 'example',
        title: 'Approved',
        previewId: 'PlanTool/approved',
        code:
          'const approvedPart = {\n' +
          '  type: "tool-PlanWrite",\n' +
          '  toolCallId: "plan-2",\n' +
          '  state: "output-available",\n' +
          '  input: {\n' +
          '    approved: true,\n' +
          '    plan: { id: "plan-2", title: "Gateway rollout", summary: "Plan approved and ready to execute." },\n' +
          '  },\n' +
          '};\n\n' +
          '<PlanTool part={approvedPart} />',
      },
      {
        type: 'example',
        title: 'Pending update',
        previewId: 'PlanTool/pending',
        code:
          'const pendingPart = {\n' +
          '  type: "tool-PlanWrite",\n' +
          '  toolCallId: "plan-4",\n' +
          '  state: "input-streaming",\n' +
          '  input: { plan: { id: "plan-4", title: "Expand tool docs", summary: "Drafting an updated plan..." } },\n' +
          '};\n\n' +
          '<PlanTool part={pendingPart} chatStatus="streaming" />',
      },
    ],
  },
  {
    name: 'ToolGroup',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { ToolGroup } from "@sinups/ai-kit";\n\n' +
          'const part = {\n' +
          '  type: "tool-Task",\n' +
          '  toolCallId: "task-1",\n' +
          '  state: "output-available",\n' +
          '  input: { description: "Collect previews", subagent_type: "explore" },\n' +
          '  output: { totalDurationMs: 6200 },\n' +
          '};\n\n' +
          'const nestedTools = [\n' +
          '  { type: "tool-Bash", state: "output-available", input: { command: "pnpm lint" } },\n' +
          '  { type: "tool-Grep", state: "output-available", input: { pattern: "InputBar" } },\n' +
          '  { type: "tool-Read", state: "output-available", input: { file_path: "/package/src/input/InputBar.tsx" } },\n' +
          '];\n\n' +
          'export function Example() {\n' +
          '  return (\n' +
          '    <ToolGroup\n' +
          '      part={part}\n' +
          '      nestedTools={nestedTools}\n' +
          '      completeLabel="Task completed"\n' +
          '      shimmerLabel="Running task"\n' +
          '      interruptedLabel="Task interrupted"\n' +
          '    />\n' +
          '  );\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Summarize task runs with optional nested tools. Use defaultOpen for initial expand state, maxVisibleTools for streaming height, and showElapsed to hide/show elapsed time.',
      },
      {
        type: 'example',
        title: 'Completed with tools',
        previewId: 'ToolGroup/completed',
        code: `<ToolGroup
  part={taskCompletedPart}
  nestedTools={nestedToolGroupTools}
  completeLabel="Task completed"
  shimmerLabel="Running task"
  interruptedLabel="Task interrupted"
/>`,
      },
      {
        type: 'example',
        title: 'Streaming demo',
        previewId: 'ToolGroup/streaming',
        code: `<ToolGroup
  part={taskPendingPart}
  nestedTools={nestedToolGroupTools}
  chatStatus="streaming"
  completeLabel="Explored"
  shimmerLabel="Exploring"
  interruptedLabel="Exploration interrupted"
/>`,
      },
      {
        type: 'example',
        title: 'Interrupted',
        previewId: 'ToolGroup/interrupted',
        code: `<ToolGroup
  part={taskInterruptedPart}
  chatStatus="ready"
  completeLabel="Task completed"
  shimmerLabel="Running task"
  interruptedLabel="Task interrupted"
/>`,
      },
    ],
  },
  {
    name: 'SubagentTool',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { SubagentTool } from "@sinups/ai-kit";\n\n' +
          'const part = {\n' +
          '  type: "tool-Task",\n' +
          '  toolCallId: "task-1",\n' +
          '  state: "output-available",\n' +
          '  input: { description: "Collect previews", subagent_type: "explore" },\n' +
          '  output: { totalDurationMs: 6200 },\n' +
          '};\n\n' +
          'const nestedTools = [\n' +
          '  { type: "tool-Bash", state: "output-available", input: { command: "pnpm lint" } },\n' +
          '  { type: "tool-Grep", state: "output-available", input: { pattern: "InputBar" } },\n' +
          '  { type: "tool-Read", state: "output-available", input: { file_path: "/package/src/input/InputBar.tsx" } },\n' +
          '];\n\n' +
          'export function Example() {\n' +
          '  return <SubagentTool part={part} nestedTools={nestedTools} />;\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render a task with nested tool calls. Shows elapsed time and the last nested tool while running.',
      },
      {
        type: 'example',
        title: 'Completed',
        previewId: 'SubagentTool/completed',
        code: `<SubagentTool
  part={taskCompletedPart}
  nestedTools={nestedToolGroupTools}
/>`,
      },
      {
        type: 'example',
        title: 'Pending',
        previewId: 'SubagentTool/pending',
        code: `<SubagentTool
  part={taskPendingPart}
  nestedTools={nestedToolGroupTools}
  chatStatus="streaming"
/>`,
      },
      {
        type: 'example',
        title: 'Interrupted',
        previewId: 'SubagentTool/interrupted',
        code: `<SubagentTool
  part={taskInterruptedPart}
  chatStatus="ready"
/>`,
      },
    ],
  },
  {
    name: 'McpTool',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { McpTool } from "@sinups/ai-kit";\n' +
          'import { parseMcpToolType } from "@sinups/ai-kit";\n\n' +
          'const mcpInfo = parseMcpToolType("tool-ListMcpResources");\n' +
          'const part = {\n' +
          '  type: "tool-ListMcpResources",\n' +
          '  toolCallId: "mcp-1",\n' +
          '  state: "output-available",\n' +
          '  input: { query: "resources" },\n' +
          '  output: [\n' +
          '    { type: "text", text: "[{\\"id\\":\\"res_1\\",\\"name\\":\\"Billing\\"},{\\"id\\":\\"res_2\\",\\"name\\":\\"Support\\"}]" },\n' +
          '  ],\n' +
          '};\n\n' +
          'export function Example() {\n' +
          '  return <McpTool part={part} mcpInfo={mcpInfo} />;\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render MCP tool calls with expandable output. Provide part + mcpInfo from parseMcpToolType, use chatStatus to reflect streaming/interrupted state, and defaultOpen to keep output expanded.',
      },
      {
        type: 'example',
        title: 'Completed output',
        previewId: 'McpTool/complete',
        code: `<McpTool
  part={part}
  mcpInfo={mcpInfo}
/>`,
      },
      {
        type: 'example',
        title: 'Pending',
        previewId: 'McpTool/pending',
        code:
          'const pendingPart = {\n' +
          '  type: "tool-ListMcpResources",\n' +
          '  toolCallId: "mcp-2",\n' +
          '  state: "input-streaming",\n' +
          '  input: { query: "resources" },\n' +
          '};\n\n' +
          '<McpTool part={pendingPart} mcpInfo={mcpInfo} chatStatus="streaming" />',
      },
      {
        type: 'example',
        title: 'Interrupted',
        previewId: 'McpTool/interrupted',
        code:
          'const interruptedPart = {\n' +
          '  type: "tool-ListMcpResources",\n' +
          '  toolCallId: "mcp-3",\n' +
          '  state: "input-streaming",\n' +
          '  input: { query: "resources" },\n' +
          '};\n\n' +
          '<McpTool part={interruptedPart} mcpInfo={mcpInfo} chatStatus="ready" />',
      },
    ],
  },
  {
    name: 'ThinkingTool',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { ThinkingTool } from "@sinups/ai-kit";\n\n' +
          'const part = {\n' +
          '  type: "tool-Thinking",\n' +
          '  toolCallId: "think-1",\n' +
          '  state: "output-available",\n' +
          '  input: { thought: "Reviewing component coverage and preview density." },\n' +
          '};\n\n' +
          'export function Example() {\n' +
          '  return <ThinkingTool part={part} />;\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render assistant reasoning in a collapsible row. Use defaultOpen for uncontrolled expand, or expanded + onToggleExpand for controlled state. You can also render from mapped step/state/onComplete instead of part. The row reads `Thinking` with a running timer while the part streams and `Thought for 4s` once it is complete; the duration is measured from when the part first rendered until it finished. `labels.thinking` and `labels.thought(duration)` translate the row, and `duration` is an empty string when the time is unknown. Inside `AgentChat` pass the same keys as `labels.thinkingTool`; the units come from `labels.durationUnits`.',
      },
      {
        type: 'example',
        title: 'Streaming text',
        previewId: 'ThinkingTool/streaming',
        code:
          'const streamingPart = {\n' +
          '  type: "tool-Thinking",\n' +
          '  toolCallId: "think-2",\n' +
          '  state: "input-streaming",\n' +
          '  input: {\n' +
          '    thought: "Drafting a response with tool coverage and previews.\\n" +\n' +
          '      "First outline the sections, then refine the examples and polish copy.\\n" +\n' +
          '      "Keep the final response concise and actionable.",\n' +
          '  },\n' +
          '};\n\n' +
          '<ThinkingTool part={streamingPart} defaultOpen />',
      },
      {
        type: 'example',
        title: 'Custom labels',
        previewId: 'ThinkingTool/labels',
        code: `<ThinkingTool
  part={part}
  labels={{
    thinking: "Reasoning",
    thought: (duration) => (duration ? "Reasoned for " + duration : "Reasoned"),
  }}
/>`,
      },
      {
        type: 'example',
        title: 'Collapsed',
        previewId: 'ThinkingTool/collapsed',
        code: `<ThinkingTool
  part={part}
/>`,
      },
    ],
  },
  {
    name: 'GenericTool',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { GenericTool } from "@sinups/ai-kit";\n\n' +
          'export function Example() {\n' +
          '  return (\n' +
          '    <GenericTool\n' +
          '      title="Custom tool"\n' +
          '      subtitle="Preview"\n' +
          '      isPending={false}\n' +
          '    />\n' +
          '  );\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render a simple tool row for custom tools. Provide title/subtitle and control loading with isPending. icon lets you pass a custom icon component.',
      },
      {
        type: 'example',
        title: 'Completed',
        previewId: 'GenericTool/completed',
        code: `<GenericTool
  title="Custom tool"
  subtitle="Preview"
  isPending={false}
/>`,
      },
      {
        type: 'example',
        title: 'Pending',
        previewId: 'GenericTool/pending',
        code: `<GenericTool
  title="Fetching records"
  subtitle="db.orders"
  isPending={true}
/>`,
      },
      {
        type: 'example',
        title: 'Compatibility flag',
        previewId: 'GenericTool/error',
        code: `<GenericTool
  title="Webhook dispatch"
  subtitle="events/git"
  isPending={false}
  isError={true}
/>`,
      },
    ],
  },
  {
    name: 'QuestionTool',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content:
          'import { useState } from "react";\n' +
          'import { QuestionTool } from "@sinups/ai-kit";\n\n' +
          'const questions = [\n' +
          '  {\n' +
          '    kind: "single",\n' +
          '    title: "Which direction should I take?",\n' +
          '    options: [\n' +
          '      { id: "small", label: "Small patch" },\n' +
          '      { id: "full", label: "Full refactor" },\n' +
          '    ],\n' +
          '    allowCustom: true,\n' +
          '  },\n' +
          '  {\n' +
          '    kind: "single",\n' +
          '    title: "How cautious should the rollout be?",\n' +
          '    options: [\n' +
          '      { id: "safe", label: "Safe and incremental" },\n' +
          '      { id: "fast", label: "Fast rollout" },\n' +
          '    ],\n' +
          '    allowCustom: true,\n' +
          '  },\n' +
          '];\n\n' +
          'export function Example() {\n' +
          '  const [questionIndex, setQuestionIndex] = useState(1);\n' +
          '  const totalQuestions = questions.length;\n\n' +
          '  const part = {\n' +
          '    type: "tool-Question",\n' +
          '    toolCallId: "question-1",\n' +
          '    state: "input-available",\n' +
          '    input: {\n' +
          '      questions,\n' +
          '      questionIndex,\n' +
          '      totalQuestions,\n' +
          '      onPreviousQuestion: () =>\n' +
          '        setQuestionIndex((prev) => Math.max(1, prev - 1)),\n' +
          '      onNextQuestion: () =>\n' +
          '        setQuestionIndex((prev) => Math.min(totalQuestions, prev + 1)),\n' +
          '      submitLabel: "Submit",\n' +
          '      skipLabel: "Skip",\n' +
          '      onSubmitAnswer: (answer) => console.log(answer),\n' +
          '    },\n' +
          '  };\n\n' +
          '  return <QuestionTool part={part} />;\n' +
          '}',
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Support single, multi, and free-text questions. It auto-advances and summarizes by default; wire questionIndex + totalQuestions for controlled navigation.',
      },
      {
        type: 'example',
        title: 'Single choice',
        previewId: 'QuestionTool/single',
        code: `<QuestionTool
  part={questionSinglePart}
/>`,
      },
      {
        type: 'example',
        title: 'Multiple choice',
        previewId: 'QuestionTool/multi',
        code: `<QuestionTool
  part={questionMultiPart}
/>`,
      },
      {
        type: 'example',
        title: 'Text answer',
        previewId: 'QuestionTool/text',
        code: `<QuestionTool
  part={questionTextPart}
/>`,
      },
    ],
  },
  {
    name: 'ElicitationForm',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { ElicitationForm } from "@sinups/ai-kit";

export function Example() {
  return (
    <ElicitationForm
      serverName="deploy-server"
      message="Choose where to deploy the new build."
      requestedSchema={{
        type: "object",
        properties: {
          environment: {
            type: "string",
            title: "Environment",
            oneOf: [
              { const: "staging", title: "Staging" },
              { const: "production", title: "Production" },
            ],
          },
          replicas: { type: "integer", title: "Replicas", minimum: 1, maximum: 10, default: 2 },
          notify: { type: "string", title: "Notify email", format: "email" },
          dryRun: { type: "boolean", title: "Dry run", default: true },
        },
        required: ["environment"],
      }}
      onAccept={(content) => respond({ action: "accept", content })}
      onDecline={() => respond({ action: "decline" })}
      onCancel={() => respond({ action: "cancel" })}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Answer MCP elicitation requests. Pass the server\'s requestedSchema and the form builds Mantine fields for strings (email, uri, date, date-time), numbers, booleans, single and multi-select enums, validates required fields and bounds, and calls onAccept with only the filled values. Use mode="url" when the server asks the user to open a link. Short fields go into two columns once the form itself is wider than 520px, so the same component fits a narrow widget and a full-page chat.',
      },
      {
        type: 'example',
        title: 'Form request',
        previewId: 'ElicitationForm/form',
        code: `<ElicitationForm
  serverName="deploy-server"
  message="Choose where to deploy the new build."
  requestedSchema={deploySchema}
  onAccept={(content) => respond({ action: "accept", content })}
  onDecline={() => respond({ action: "decline" })}
  onCancel={() => respond({ action: "cancel" })}
/>`,
      },
      {
        type: 'example',
        title: 'URL request',
        previewId: 'ElicitationForm/url',
        code: `<ElicitationForm
  mode="url"
  serverName="git"
  message="Authorize access to your repositories to continue."
  url="https://git.example.com/login/oauth/authorize"
  onAccept={() => respond({ action: "accept" })}
  onDecline={() => respond({ action: "decline" })}
/>`,
      },
      {
        type: 'example',
        title: 'Disabled',
        previewId: 'ElicitationForm/disabled',
        code: `<ElicitationForm
  disabled
  message="Waiting for the previous request."
  requestedSchema={deploySchema}
/>`,
      },
    ],
  },
  {
    name: 'ToolApprovalFooter',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { ToolApprovalFooter } from "@sinups/ai-kit";

export function Example() {
  return (
    <ToolApprovalFooter
      labels={{ approve: "Allow", reject: "Deny" }}
      reason="Runs a shell command"
      approveOptions={[
        { value: "once", label: "Allow once" },
        { value: "session", label: "Allow for this session" },
        { value: "always", label: "Always allow", description: "Saved to project settings" },
      ]}
      onApprove={(scope) => approve(scope)}
      onReject={() => reject()}
      onRejectWithFeedback={(feedback) => reject(feedback)}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Ask the user to confirm a tool call. approveOptions adds a menu next to the approve button so the user can pick a scope (once, session, always) that arrives in onApprove(scope); the main button still calls onApprove() without a scope. reason explains why confirmation is needed, and onRejectWithFeedback lets the user reject with instructions for the agent. BashTool and EditTool accept the same fields through their approval prop.',
      },
      {
        type: 'example',
        title: 'Approval scopes and feedback',
        previewId: 'ToolApprovalFooter/scopes',
        code: `<ToolApprovalFooter
  labels={{ approve: "Allow", reject: "Deny" }}
  reason="Runs a shell command"
  approveOptions={[
    { value: "once", label: "Allow once" },
    { value: "session", label: "Allow for this session" },
    { value: "always", label: "Always allow", description: "Saved to project settings" },
  ]}
  onApprove={(scope) => approve(scope)}
  onRejectWithFeedback={(feedback) => reject(feedback)}
/>`,
      },
      {
        type: 'example',
        title: 'Basic and pending',
        previewId: 'ToolApprovalFooter/basic',
        code: `<>
  <ToolApprovalFooter labels={{ approve: "Run", reject: "Skip" }} onApprove={approve} />
  <ToolApprovalFooter isPending labels={{ approve: "Run", reject: "Cancel" }} />
</>`,
      },
    ],
  },
  {
    name: 'ErrorMessage',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { ErrorMessage } from "@sinups/ai-kit";

export function Example() {
  return (
    <ErrorMessage
      title="API overloaded"
      message="The provider is temporarily overloaded."
      retry={{ attempt: 2, maxAttempts: 10, retryAt: nextRetryAt }}
      onRetry={retryNow}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Render a failed assistant turn. retry shows a live countdown to the next automatic attempt, onRetry adds a button to retry right away, and variant="warning" with resetsAt fits usage limits that lift at a known time.',
      },
      {
        type: 'example',
        title: 'Basic',
        previewId: 'ErrorMessage/basic',
        code: `<ErrorMessage
  title="Request failed"
  message="Network error: failed to fetch (status 502 Bad Gateway)"
/>`,
      },
      {
        type: 'example',
        title: 'Retry countdown',
        previewId: 'ErrorMessage/retry',
        code: `<ErrorMessage
  title="API overloaded"
  message="The provider is temporarily overloaded."
  retry={{ attempt: 2, maxAttempts: 10, retryAt: Date.now() + 8000 }}
  onRetry={retryNow}
/>`,
      },
      {
        type: 'example',
        title: 'Usage limit',
        previewId: 'ErrorMessage/limit',
        code: `<ErrorMessage
  variant="warning"
  title="Usage limit reached"
  message="You have used all requests available on your plan."
  resetsAt={Date.now() + 45 * 60 * 1000}
/>`,
      },
    ],
  },
  {
    name: 'AgentStatus',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { AgentStatus } from "@sinups/ai-kit";

export function Example() {
  return (
    <AgentStatus
      startedAt={turnStartedAt}
      tokens={receivedTokens}
      lastActivityAt={lastChunkAt}
      labels={{ stalled: "Waiting for response" }}
      onStop={stop}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Show that the agent is working: a shimmering label, live elapsed time and received tokens. Update lastActivityAt on every streamed chunk; when nothing arrives for stallAfterMs (3 seconds by default) the line fades to the error color so the user knows the response is stuck. Set paused while tools run, since silence is expected then.',
      },
      {
        type: 'example',
        title: 'Live and stalled',
        previewId: 'AgentStatus/live',
        code: `<AgentStatus
  startedAt={startedAt}
  tokens={tokens}
  lastActivityAt={lastActivityAt}
  labels={{ stalled: "Waiting for response" }}
  onStop={stop}
/>`,
      },
      {
        type: 'example',
        title: 'Paused while tools run',
        previewId: 'AgentStatus/paused',
        code: `<AgentStatus label="Running tools" startedAt={startedAt} paused />`,
      },
    ],
  },
  {
    name: 'ContextUsage',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { ContextUsage, InputBar } from "@sinups/ai-kit";

export function Example() {
  return (
    <InputBar
      status="ready"
      onSend={send}
      onStop={stop}
      rightActions={
        <ContextUsage
          used={168_000}
          total={200_000}
          segments={[
            { label: "System prompt", value: 4200 },
            { label: "Tools", value: 18_600 },
            { label: "Messages", value: 145_200 },
          ]}
          onCompact={compact}
        />
      }
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Show how full the context window is. The ring is split by segments below warnAt (80%), turns yellow at warnAt and red at dangerAt (95%). Hover or click opens the breakdown; with onCompact the details offer to compact the conversation once usage is high. Sized to sit in InputBar rightActions.',
      },
      {
        type: 'example',
        title: 'Usage levels',
        previewId: 'ContextUsage/levels',
        code: `<>
  <ContextUsage used={45_200} total={200_000} segments={segments} withLabel />
  <ContextUsage used={168_000} total={200_000} withLabel onCompact={compact} />
  <ContextUsage used={194_000} total={200_000} withLabel onCompact={compact} />
</>`,
      },
      {
        type: 'example',
        title: 'Inside InputBar',
        previewId: 'ContextUsage/in-input-bar',
        code: `<InputBar
  status="ready"
  onSend={handleSend}
  onStop={handleStop}
  contentWidth="100%"
  rightActions={
    <ContextUsage used={used} total={200_000} segments={segments} onCompact={compact} />
  }
/>`,
      },
    ],
  },
  {
    name: 'CompactBoundary',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { CompactBoundary } from "@sinups/ai-kit";

export function Example() {
  return (
    <CompactBoundary
      tokensBefore={182_400}
      tokensAfter={12_300}
      summary={"- Migrated the upload client\\n- Tests for backoff are green"}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Mark the place where earlier history was replaced by a summary. MessageList renders it automatically for a { type: "compaction", summary, tokensBefore, tokensAfter } part, including inside a system message; the summary opens on click.',
      },
      {
        type: 'example',
        title: 'With summary',
        previewId: 'CompactBoundary/summary',
        code: `<CompactBoundary tokensBefore={182_400} tokensAfter={12_300} summary={summary} />`,
      },
      {
        type: 'example',
        title: 'Without summary',
        previewId: 'CompactBoundary/plain',
        code: `<>
  <CompactBoundary tokensAfter={9_800} />
  <CompactBoundary label="History trimmed" />
</>`,
      },
    ],
  },
  ...PRIMITIVE_COMPONENT_DOCS,
  ...MCP_COMPONENT_DOCS,
  ...PERMISSIONS_COMPONENT_DOCS,
  ...HOOKS_COMPONENT_DOCS,
  ...CHAT_ACTIONS_COMPONENT_DOCS,
  ...AGENTS_COMPONENT_DOCS,
  ...SKILLS_COMPONENT_DOCS,
  ...SESSIONS_COMPONENT_DOCS,
  ...TASKS_COMPONENT_DOCS,
  ...DIFF_COMPONENT_DOCS,
  ...SETTINGS_COMPONENT_DOCS,
  ...HELP_COMPONENT_DOCS,
  ...CHAT_EXTRA_COMPONENT_DOCS,
  ...CONFIG_EXTRA_COMPONENT_DOCS,
  ...COMPOSER_COMPONENT_DOCS,
];
