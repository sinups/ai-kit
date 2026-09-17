import type { ChatMessage, ChatStatus } from "@sinups/ai-kit";
import React, { CSSProperties, useState } from "react";
import {
  AgentChat,
  MessageList,
  InputBar,
  UserMessage,
  Markdown,
  AttachmentButton,
  SendButton,
  FileAttachment,
  BashTool,
  EditTool,
  SearchTool,
  TodoTool,
  PlanTool,
  QuestionTool,
  ToolGroup,
  SubagentTool,
  McpTool,
  ThinkingTool,
  GenericTool,
  SpiralLoader,
} from "@sinups/ai-kit";
import { TextShimmer } from "@sinups/ai-kit";
import { parseMcpToolType } from "@sinups/ai-kit";
import {
  ModelPicker,
  ModeSelector,
  AgentModeIcon,
  PlanModeIcon,
} from "@sinups/ai-kit";
import type { ModeOption } from "@sinups/ai-kit";
import {
  DEMO_MODELS,
  DEFAULT_MODEL_ID,
} from "@/app/data/models";
import {
  IconCalendar,
  IconCode,
  IconPencil,
  IconSearch,
} from "@tabler/icons-react";

export type CardAlign = "center" | "stretch" | "bottom";

export type ComponentShowcase = {
  name: string;
  node: React.ReactNode;
  align?: CardAlign;
  pad?: string;
  contentClassName?: string;
};

const noop = () => {};
const sampleImage =
  "https://images.unsplash.com/photo-1773829629580-5ec8cb1f814a?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const textPart = (text: string): ChatMessage["parts"][number] => ({
  type: "text",
  text,
});

const sampleMessages: ChatMessage[] = [
  {
    id: "msg-user",
    role: "user",
    parts: [textPart("Hello there")],
  },
  {
    id: "msg-assistant",
    role: "assistant",
    parts: [textPart("AI UI Kit preview")],
  },
  {
    id: "msg-user-2",
    role: "user",
    parts: [textPart("Show me the latest changes.")],
  },
  {
    id: "msg-assistant-2",
    role: "assistant",
    parts: [textPart("Added tool cards and layout tweaks.")],
  },
  {
    id: "msg-user-3",
    role: "user",
    parts: [textPart("Can you also include a mobile preview?")],
  },
  {
    id: "msg-assistant-3",
    role: "assistant",
    parts: [textPart("Yes, the components are fully responsive!")],
  },
  {
    id: "msg-user-4",
    role: "user",
    parts: [textPart("Show me the error handling states too.")],
  },
  {
    id: "msg-assistant-4",
    role: "assistant",
    parts: [textPart("Included error cards and retry affordances.")],
  },
  {
    id: "msg-user-5",
    role: "user",
    parts: [textPart("Any accessibility updates in this pass?")],
  },
  {
    id: "msg-assistant-5",
    role: "assistant",
    parts: [
      textPart(
        "Improved focus states, increased contrast, and added clearer labels.",
      ),
    ],
  },
];

const demoModes: ModeOption[] = [
  { id: "agent", label: "Agent", icon: AgentModeIcon },
  { id: "plan", label: "Plan", icon: PlanModeIcon },
];

const inputSuggestions = [
  {
    id: "s1",
    label: "Write",
    value: "Write a concise project update with key milestones.",
    icon: <IconPencil className="h-3.5 w-3.5" aria-hidden />,
  },
  {
    id: "s2",
    label: "Learn",
    value: "Explain this codebase architecture in plain language.",
    icon: <IconSearch className="h-3.5 w-3.5" aria-hidden />,
  },
  {
    id: "s3",
    label: "Code",
    value: "Generate a clean starter implementation for this feature.",
    icon: <IconCode className="h-3.5 w-3.5" aria-hidden />,
  },
  {
    id: "s4",
    label: "From Calendar",
    value: "Draft my agenda from tomorrow's calendar events.",
    icon: <IconCalendar className="h-3.5 w-3.5" aria-hidden />,
  },
];

function SuggestionsInputPreview() {
  const [value, setValue] = useState("");

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <InputBar
        onSend={noop}
        status={readyStatus}
        onStop={noop}
        value={value}
        onChange={setValue}
        suggestions={{
          items: inputSuggestions,
          className: "w-full justify-center",
          itemClassName: "h-7 rounded-[6px] px-2 text-sm",
        }}
      />
    </div>
  );
}

function AttachmentButtonPreview() {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  return (
    <>
      <AttachmentButton onClick={() => inputRef.current?.click()} />
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={() => {
          /* demo only — showcase picker opens, selected file is discarded */
        }}
      />
    </>
  );
}

const readyStatus: ChatStatus = "ready";

const streamingMarkdownContent = [
  "# Release Notes",
  "",
  "Welcome to the **AI UI Kit** showcase! Here's a breakdown of the latest features and improvements designed to enhance your development workflow.",
  "",
  "## ✨ Key Highlights",
  "",
  "- **Streaming Markdown**: Real-time rendering of assistant responses.",
  "- **Interactive Tool Cards**: Native UI for Bash, Search, and planning tools.",
  "- **Responsive Layouts**: Optimized for both side-by-side and mobile views.",
  "",
  "## 📊 Component Status",
  "",
  "| Component | Status | Priority |",
  "| :--- | :--- | :--- |",
  "| MessageList | ✅ Ready | High |",
  "| InputBar | 🧪 Beta | Medium |",
  "| Markdown | ✅ Ready | High |",
  "",
  "## 🛠️ Implementation Example",
  "",
  "Integrating the `Markdown` component is straightforward:",
  "",
  "```tsx",
  "import { Markdown } from '@sinups/ai-kit';",
  "",
  "export function ChatMessage({ content }) {",
  "  return <Markdown content={content} />;",
  "}",
  "```",
  "",
  "> [!TIP]",
  "> Use the `className` prop to customize the typography and spacing of the rendered markdown.",
  "",
  "---",
  "_Last updated: March 2026_",
].join("\n");

const bashPart = {
  type: "tool-Bash",
  toolCallId: "bash-1",
  state: "output-available",
  input: { command: "ls -la" },
  output: { stdout: "app\nlib\nREADME.md" },
};

const editPart = {
  type: "tool-Edit",
  toolCallId: "edit-1",
  state: "output-available",
  input: { file_path: "/app/page.tsx" },
  output: {
    old_content:
      "export const metadata = { title: 'Old' };\n\nexport default function Page() {\n  return <div>Old content</div>;\n}\n",
    content:
      "export const metadata = { title: 'Updated' };\n\nexport default function Page() {\n  return (\n    <div>\n      <h1>Release notes</h1>\n      <p>New layout applied.</p>\n    </div>\n  );\n}\n",
    structuredPatch: [
      {
        lines: [
          "-export const metadata = { title: 'Old' };",
          "+export const metadata = { title: 'Updated' };",
        ],
      },
      {
        lines: [
          "-export default function Page() {",
          "-  return <div>Old content</div>;",
          "-}",
          "+export default function Page() {",
          "+  return (",
          "+    <div>",
          "+      <h1>Release notes</h1>",
          "+      <p>New layout applied.</p>",
          "+    </div>",
          "+  );",
          "+}",
        ],
      },
    ],
  },
};

const searchResultsDefault = {
  results: [
    {
      source: "google",
      title: "United UA837 SFO→NRT · $1,105 economy",
      date: "google.com/flights",
    },
    {
      source: "expedia",
      title: "SFO–Tokyo · 14 results from $1,089",
      date: "expedia.com",
    },
    {
      source: "google",
      title: "ANA NH7 Direct SFO→NRT · $1,240 rt",
      date: "google.com/flights",
    },
  ],
  tabs: [
    { source: "google", label: "Google", count: 5 },
    { source: "expedia", label: "Expedia", count: 4 },
  ],
};

const searchPart = {
  type: "tool-WebSearch",
  toolCallId: "search-1",
  state: "output-available",
  input: { query: "best flights to Tokyo" },
  output: searchResultsDefault,
};

const todoPart = {
  type: "tool-TodoWrite",
  toolCallId: "todo-1",
  state: "output-available",
  input: {
    todos: [
      { content: "Audit components", status: "completed" },
      {
        content: "Tighten spacing",
        status: "in_progress",
        activeForm: "Tightening spacing",
      },
      { content: "Ship updates", status: "pending" },
    ],
  },
  output: { oldTodos: [] },
};

const planPart = {
  type: "tool-PlanWrite",
  toolCallId: "plan-1",
  state: "output-available",
  input: {
    plan: {
      id: "plan-1",
      title: "Refresh UI previews",
      summary:
        "Unify tool card spacing and interaction patterns so docs previews feel cohesive across all tool components. Also update the plan tool to support inline editing of the plan title and summary. Also update the plan tool to support inline editing of the plan title and summary. Also update the plan tool to support inline editing of the plan title and summary.\n\n1. Standardize card chrome (header height, borders, radius, and muted labels) for Plan, Approval, Edit, Search, and Todo previews.\n2. Align content density and typography so title, metadata, and body text read consistently at a glance.\n3. Normalize interaction states: loading shimmer, pending indicators, hover affordances, and disabled action buttons.\n4. Validate responsive behavior on narrow widths, including truncation rules and action-row wrapping.\n5. Run a visual QA pass in both light and dark themes and tighten spacing where cards feel too loose or cramped.\n\nOutcome: preview gallery feels intentionally designed, easier to scan, and stable across viewport sizes.",
    },
  },
};

const questionPart = {
  type: "tool-Question",
  toolCallId: "question-1",
  state: "input-available",
  input: {
    questions: [
      {
        kind: "single" as const,
        title: "How should we apply this change?",
        options: [
          { id: "small", label: "Small scoped patch" },
          { id: "full", label: "Full refactor" },
        ],
        allowCustom: true,
        customLabel: "Type your own answer",
      },
      {
        kind: "single" as const,
        title: "How much QA should we run?",
        options: [
          { id: "fast", label: "Smoke tests only" },
          { id: "full", label: "Full test suite" },
        ],
        allowCustom: true,
        customLabel: "Type your own answer",
      },
    ],
    submitLabel: "Submit",
    skipLabel: "Skip",
  },
};

const taskPart = {
  type: "tool-Task",
  toolCallId: "task-1",
  state: "output-available",
  input: { description: "Collect previews", subagent_type: "explore" },
  output: { totalDurationMs: 6200 },
};

const nestedToolGroupTools = [
  {
    type: "tool-Bash",
    state: "output-available",
    input: { command: "pnpm lint" },
  },
  {
    type: "tool-Grep",
    state: "output-available",
    input: { pattern: "InputBar" },
  },
  {
    type: "tool-Read",
    state: "output-available",
    input: { file_path: "/package/src/input/InputBar.tsx" },
  },
];

const mcpInfo =
  parseMcpToolType("tool-ListMcpResources") ??
  ({
    serverName: "mcp",
    toolName: "list_resources",
    displayName: "List Resources",
    category: "list",
  } as const);

const mcpPart = {
  type: "tool-ListMcpResources",
  toolCallId: "mcp-1",
  state: "output-available",
  input: { query: "resources" },
  output: [
    {
      type: "text",
      text: '[{"id":"res_1","name":"Billing"},{"id":"res_2","name":"Support"}]',
    },
  ],
};

const thinkingPart = {
  type: "tool-Thinking",
  toolCallId: "think-1",
  state: "output-available",
  input: { thought: "Reviewing component coverage and preview density." },
};

export const COMPONENT_SHOWCASES: ComponentShowcase[] = [
  {
    name: "AgentChat",
    align: "stretch" as const,
    pad: "p-0",
    contentClassName: "h-full",
    node: (
      <div className="h-full w-full">
        <AgentChat
          messages={sampleMessages}
          status={readyStatus}
          onSend={noop}
          onStop={noop}
          className="h-full"
        />
      </div>
    ),
  },
  {
    name: "MessageList",
    align: "stretch" as const,
    pad: "p-0",
    contentClassName: "h-full",
    node: (
      <div className="h-full w-full">
        <MessageList
          messages={sampleMessages}
          status={readyStatus}
          className="h-full"
        />
      </div>
    ),
  },
  {
    name: "InputBar",
    align: "bottom",
    pad: "py-4 px-1",
    contentClassName: "h-full",
    node: (
      <div
        className="w-full"
        style={{ "--ae-input-focus-outline": "var(--mantine-color-cyan-5)" } as CSSProperties}
      >
        <InputBar
          onSend={noop}
          status={readyStatus}
          onStop={noop}
          onAttach={noop}
          leftActions={
            <>
              <ModeSelector modes={demoModes} defaultValue="agent" />
              <ModelPicker
                models={DEMO_MODELS}
                defaultValue={DEFAULT_MODEL_ID}
              />
            </>
          }
          className="pb-0 sm:pb-3"
        />
      </div>
    ),
  },
  {
    name: "Suggestions",
    align: "bottom",
    pad: "py-4 px-1",
    contentClassName: "h-full",
    node: <SuggestionsInputPreview />,
  },
  {
    name: "ModelPicker",
    node: (
      <ModelPicker models={DEMO_MODELS} defaultValue={DEFAULT_MODEL_ID} />
    ),
  },
  {
    name: "ModeSelector",
    node: <ModeSelector modes={demoModes} defaultValue="agent" />,
  },
  { name: "UserMessage", node: <UserMessage message={sampleMessages[0]!} /> },
  {
    name: "Markdown",
    align: "stretch",
    pad: "p-0",
    contentClassName: "h-full",
    node: (
      <div className="h-full w-full overflow-y-auto px-4 py-4">
        <Markdown content={streamingMarkdownContent} />
      </div>
    ),
  },
  {
    name: "AttachmentButton",
    node: <AttachmentButtonPreview />,
  },
  { name: "SendButton", node: <SendButton state="typing" /> },
  {
    name: "FileAttachment",
    align: "stretch",
    contentClassName: "w-full",
    node: (
      <div className="flex flex-row gap-2">
        <FileAttachment id="file-2" filename="report.pdf" size={23000} />
        <FileAttachment
          id="file-3"
          filename="preview.png"
          size={120000}
          isImage
          url={sampleImage}
        />
        <FileAttachment
          id="file-3"
          filename="preview.png"
          display="image-only"
          isImage
          url="https://images.unsplash.com/photo-1760605168719-2e13f24a0f68?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        />
      </div>
    ),
  },
  {
    name: "TextShimmer",
    align: "stretch",
    contentClassName: "items-start",
    node: (
      <TextShimmer as="span" duration={1.2} className="text-sm">
        Shimmering status
      </TextShimmer>
    ),
  },
  {
    name: "SpiralLoader",
    node: (
      <div className="flex items-center gap-2">
        <SpiralLoader size={16} />
        <TextShimmer as="span" duration={1.2} className="text-sm">
          Thinking
        </TextShimmer>
      </div>
    ),
  },
  {
    name: "BashTool",
    align: "stretch",
    node: <BashTool part={bashPart} />,
    contentClassName: "[&>div]:w-full [&>div]:max-w-an [&>div]:mx-auto",
  },
  {
    name: "EditTool",
    align: "stretch",
    node: <EditTool part={editPart} />,
    contentClassName: "[&>div]:w-full [&>div]:max-w-an [&>div]:mx-auto",
  },
  { name: "QuestionTool", node: <QuestionTool part={questionPart} /> },
  {
    name: "SearchTool",
    align: "stretch",
    node: <SearchTool part={searchPart} defaultOpen />,
  },
  {
    name: "TodoTool",
    align: "stretch",
    node: <TodoTool part={todoPart} />,
  },
  { name: "PlanTool", align: "stretch", node: <PlanTool part={planPart} /> },
  {
    name: "ToolGroup",
    align: "stretch",
    node: (
      <ToolGroup
        part={taskPart}
        nestedTools={nestedToolGroupTools}
        completeLabel="Task completed"
        shimmerLabel="Running task"
        interruptedLabel="Task interrupted"
        defaultOpen
      />
    ),
  },
  {
    name: "SubagentTool",
    align: "stretch",
    node: <SubagentTool part={taskPart} nestedTools={nestedToolGroupTools} />,
  },
  {
    name: "McpTool",
    align: "stretch",
    node: <McpTool part={mcpPart} mcpInfo={mcpInfo} defaultOpen />,
  },
  {
    name: "ThinkingTool",
    align: "stretch",
    contentClassName: "items-start",
    node: <ThinkingTool part={thinkingPart} defaultOpen />,
  },
  {
    name: "GenericTool",
    align: "stretch",
    contentClassName: "items-start",
    node: (
      <GenericTool
        title="Custom tool"
        subtitle="Preview"
        isPending={false}
        isError={false}
      />
    ),
  },
];
