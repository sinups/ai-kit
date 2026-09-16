export type ComponentBlockType = "code" | "usage" | "example";

export type ComponentTextBlock = {
  type: "code" | "usage";
  title: string;
  content: string;
};

export type ComponentExampleBlock = {
  type: "example";
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
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();

/**
 * Import path for each component. Everything ships from the package root.
 */
export const COMPONENT_IMPORT_PATH: Record<string, string> = {
  AgentChat: "@sinups/ai-kit",
  MessageList: "@sinups/ai-kit",
  InputBar: "@sinups/ai-kit",
  Suggestions: "@sinups/ai-kit",
  ModelPicker: "@sinups/ai-kit",
  ModelBadge: "@sinups/ai-kit",
  ModeSelector: "@sinups/ai-kit",
  UserMessage: "@sinups/ai-kit",
  ErrorMessage: "@sinups/ai-kit",
  Markdown: "@sinups/ai-kit",
  SendButton: "@sinups/ai-kit",
  AttachmentButton:
    "@sinups/ai-kit",
  FileAttachment:
    "@sinups/ai-kit",
  TextShimmer: "@sinups/ai-kit",
  SpiralLoader: "@sinups/ai-kit",
  BashTool: "@sinups/ai-kit",
  EditTool: "@sinups/ai-kit",
  SearchTool: "@sinups/ai-kit",
  TodoTool: "@sinups/ai-kit",
  PlanTool: "@sinups/ai-kit",
  ToolGroup: "@sinups/ai-kit",
  SubagentTool: "@sinups/ai-kit",
  McpTool: "@sinups/ai-kit",
  ThinkingTool: "@sinups/ai-kit",
  GenericTool: "@sinups/ai-kit",
  QuestionTool:
    "@sinups/ai-kit",
};

const defaultCodeSnippet = (name: string) => {
  const path = COMPONENT_IMPORT_PATH[name] ?? `@/components/agent-elements/${componentIdFromName(name)}`;
  return `import { ${name} } from "${path}";\n\nexport function Example() {\n  return (\n    <${name} />\n  );\n}`;
};

const defaultUsageText = () =>
  "Use this building block to extend your chat UI.";

export const buildComponentBlocks = (name: string): ComponentBlock[] => [
  {
    type: "code",
    title: "Code",
    content: defaultCodeSnippet(name),
  },
  {
    type: "usage",
    title: "Usage",
    content: defaultUsageText(),
  },
  {
    type: "example",
    title: "Example",
    previewId: name,
    code: `export function Example() {\n  return (\n    <${name} />\n  );\n}`,
  },
];

export const COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "AgentChat",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { AgentChat } from "@sinups/ai-kit";

const messages = [
  {
    id: "msg-1",
    role: "assistant",
    parts: [{ type: "text", text: "Welcome to AI UI Kit." }],
  },
];

const promptSuggestions = [
  { id: "write", label: "Write", value: "Write release notes for this change." },
  { id: "plan", label: "Plan", value: "Create a rollout plan in 5 steps." },
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
        emptyStatePosition="center"
        emptySuggestionsPlacement="empty"
        emptySuggestionsPosition="bottom"
        suggestions={{ items: promptSuggestions }}
      />
    </div>
  );
}`,
      },
      {
        type: "code",
        title: "API Reference",
        content: `type AgentChatProps = {
  messages: ChatMessage[];
  onSend: (message: { role: "user"; content: string }) => void;
  status: ChatStatus;
  onStop: () => void;
  error?: Error;

  classNames?: Partial<{
    root: string;
    inputBar: string;
    userMessage: string;
  }>;
  slots?: Partial<{
    InputBar: React.ComponentType<any>;
    UserMessage: React.ComponentType<any>;
    ToolRenderer: React.ComponentType<any>;
  }>;
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
  showCopyToolbar?: boolean;

  attachments?: {
    onAttach?: () => void;
    images?: { id: string; filename: string; url: string; size?: number }[];
    files?: { id: string; filename: string; size?: number }[];
    onRemoveImage?: (id: string) => void;
    onRemoveFile?: (id: string) => void;
    onPaste?: (e: React.ClipboardEvent) => void;
    isDragOver?: boolean;
  };

  suggestions?:
    | SuggestionItem[]
    | { items: SuggestionItem[]; className?: string; itemClassName?: string };

  emptyStatePosition?: "default" | "center";
  emptySuggestionsPlacement?: "input" | "empty" | "both";
  emptySuggestionsPosition?: "top" | "bottom";

  questionTool?: {
    submitLabel?: string;
    skipLabel?: string;
    allowSkip?: boolean;
    onAnswer?: (payload: {
      toolCallId?: string;
      question: QuestionConfig;
      answer: QuestionAnswer;
    }) => void;
  };

  className?: string;
  style?: React.CSSProperties;
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Create a full chat surface with messages, status, and send/stop handlers. Add `attachments` to wire file/image context, `questionTool` to handle Question tool answers, and `showCopyToolbar` for text copy actions. Use `emptyStatePosition`, `emptySuggestionsPlacement`, and `emptySuggestionsPosition` to shape empty-state behavior. Get started at [21st.dev/agents/docs/get-started](https://21st.dev/agents/docs/get-started).",
      },
      {
        type: "example",
        title: "Basic",
        previewId: "AgentChat/basic",
        code: `<AgentChat
  messages={messages}
  status="ready"
  onSend={() => {}}
  onStop={() => {}}
/>`,
      },
      {
        type: "example",
        title: "Empty centered",
        previewId: "AgentChat/empty-centered",
        code: `<AgentChat
  messages={[]}
  status="ready"
  onSend={() => {}}
  onStop={() => {}}
  emptyStatePosition="center"
/>`,
      },
      {
        type: "example",
        title: "Empty centered + suggestions",
        previewId: "AgentChat/empty-centered-suggestions",
        code: `<AgentChat
  messages={[]}
  status="ready"
  onSend={() => {}}
  onStop={() => {}}
  emptyStatePosition="center"
  emptySuggestionsPlacement="empty"
  emptySuggestionsPosition="bottom"
  suggestions={{ items: promptSuggestions }}
/>`,
      },
      {
        type: "example",
        title: "With attachments",
        previewId: "AgentChat/attachments",
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
        type: "example",
        title: "Copy toolbar",
        previewId: "AgentChat/copy-toolbar",
        code: `<AgentChat
  messages={messages}
  status="ready"
  onSend={() => {}}
  onStop={() => {}}
  showCopyToolbar
/>`,
      },
    ],
  },
  {
    name: "MessageList",
    blocks: [
      {
        type: "code",
        title: "Code",
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
        type: "code",
        title: "API Reference",
        content: `type MessageListProps = {
  messages: ChatMessage[];
  status: ChatStatus;
  className?: string;
  showCopyToolbar?: boolean;
  slots?: {
    UserMessage?: React.ComponentType<{ message: ChatMessage; className?: string }>;
    ToolRenderer?: React.ComponentType<ToolRendererProps>;
  };
  classNames?: {
    userMessage?: string;
  };
  toolRenderers?: Record<string, React.ComponentType<CustomToolRendererProps>>;
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render the full transcript from ChatMessage[]. Use showCopyToolbar for user/assistant text copy, className for container sizing, and slots/classNames/toolRenderers for custom rendering.",
      },
      {
        type: "example",
        title: "Basic transcript",
        previewId: "MessageList/basic",
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
        type: "example",
        title: "With timestamps",
        previewId: "MessageList/timestamps",
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
    ],
  },
  {
    name: "InputBar",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { InputBar } from "@sinups/ai-kit";\n\nexport function Example() {\n  return (\n    <InputBar\n      onSend={({ content }) => console.log(content)}\n      status=\"ready\"\n      onStop={() => {}}\n    />\n  );\n}`,
      },
      {
        type: "code",
        title: "API Reference",
        content: `type InputBarProps = {
  onSend: (message: { role: "user"; content: string }) => void;
  status: ChatStatus;
  onStop: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;

  value?: string;
  onChange?: (value: string) => void;

  onAttach?: () => void;
  attachedImages?: AttachedImage[];
  attachedFiles?: AttachedFile[];
  onRemoveImage?: (id: string) => void;
  onRemoveFile?: (id: string) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  isDragOver?: boolean;

  suggestions?: InputSuggestions;

  typingAnimation?: {
    text: string;
    duration: number;
    image?: string;
    isActive: boolean;
    onComplete: () => void;
  };

  infoBar?: {
    title?: string;
    description?: string;
    onClose?: () => void;
    position?: "top" | "bottom";
  };

  questionBar?: {
    id: string;
    questions: QuestionConfig[];
    questionIndex?: number;
    totalQuestions?: number;
    onPreviousQuestion?: () => void;
    onNextQuestion?: () => void;
    submitLabel?: string;
    skipLabel?: string;
    allowSkip?: boolean;
    onSubmit: (answer: QuestionAnswer) => void;
    onSkip?: () => void;
  };

  // Toolbar composition slots. Drop any ReactNode (model picker, mode selector, custom toggles, …)
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Collect prompts and attachments in the composer. Supports controlled mode (value/onChange), drag/paste handling, info bar, typing animation, multi-question navigation, and free-form toolbar slots (leftActions/rightActions) for composing model/mode pickers or any custom controls.",
      },
      {
        type: "example",
        title: "Basic input",
        previewId: "InputBar/basic",
        code: `<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n/>`,
      },
      {
        type: "example",
        title: "With attachments",
        previewId: "InputBar/attachments",
        code: `<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n  onAttach={onAttach}\n  attachedImages={images}\n  attachedFiles={files}\n  onRemoveImage={onRemoveImage}\n  onRemoveFile={onRemoveFile}\n/>`,
      },
      {
        type: "example",
        title: "Focus outline",
        previewId: "InputBar/outline",
        code: `<div style={{ "--an-input-focus-outline": "#0ea5e9" } as React.CSSProperties }>\n  <InputBar\n    onSend={handleSend}\n    status=\"ready\"\n    onStop={handleStop}\n    autoFocus\n  />\n</div>`,
      },
      {
        type: "example",
        title: "Info bar",
        previewId: "InputBar/info",
        code: `<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n  infoBar={{\n    title: \"Syncing workspace\",\n    description: \"We will keep watching for changes.\",\n    onClose: () => {},\n  }}\n/>`,
      },
      {
        type: "example",
        title: "Info bar (bottom)",
        previewId: "InputBar/info-bottom",
        code: `<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n  infoBar={{\n    title: \"Syncing workspace\",\n    description: \"We will keep watching for changes.\",\n    onClose: () => {},\n    position: \"bottom\",\n  }}\n/>`,
      },
      {
        type: "example",
        title: "Question bar",
        previewId: "InputBar/question",
        code: `const questions = [\n  {\n    kind: "single",\n    title: "Which direction should I take?",\n    options: [\n      { id: "small", label: "Small patch" },\n      { id: "full", label: "Full refactor" },\n    ],\n    allowCustom: true,\n  },\n  {\n    kind: "single",\n    title: "How cautious should the rollout be?",\n    options: [\n      { id: "safe", label: "Safe and incremental" },\n      { id: "fast", label: "Fast rollout" },\n    ],\n    allowCustom: true,\n  },\n];\n\n<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n  questionBar={{\n    id: \"question-1\",\n    questions,\n    submitLabel: \"Submit\",\n    skipLabel: \"Skip\",\n    onSubmit: (answer) => console.log(answer),\n  }}\n/>`,
      },
      {
        type: "example",
        title: "Toolbar actions (model + mode)",
        previewId: "InputBar/toolbar-actions",
        code: `import { InputBar } from "@sinups/ai-kit";\nimport { ModelPicker } from "@sinups/ai-kit";\nimport { ModeSelector } from "@sinups/ai-kit";\nimport { IconCursor, IconBulb } from "@tabler/icons-react";\n\nconst models = [\n  { id: "sonnet", name: "Sonnet", version: "4.6" },\n  { id: "opus", name: "Opus", version: "4.7" },\n];\n\nconst modes = [\n  { id: "agent", label: "Agent", icon: IconCursor },\n  { id: "plan", label: "Plan", icon: IconBulb },\n];\n\n<InputBar\n  onSend={handleSend}\n  status=\"ready\"\n  onStop={handleStop}\n  leftActions={\n    <>\n      <ModeSelector modes={modes} defaultValue=\"agent\" />\n      <ModelPicker models={models} defaultValue=\"sonnet\" />\n    </>\n  }\n/>`,
      },
    ],
  },
  {
    name: "Suggestions",
    blocks: [
      {
        type: "code",
        title: "Code",
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
        type: "code",
        title: "API Reference",
        content: `type SuggestionItem = {
  id: string;
  label: string;
  value?: string;
  icon?: ReactNode;
  className?: string;
};

type SuggestionsProps = {
  items: SuggestionItem[];
  onSelect: (item: SuggestionItem) => void;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show quick prompt chips and write the selected suggestion into InputBar for fast message drafting. Use disabled to pause interaction and item.className for per-chip styling.",
      },
      {
        type: "example",
        title: "Icons + text",
        previewId: "Suggestions/basic",
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
        type: "example",
        title: "Fill InputBar",
        previewId: "Suggestions/fill",
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
    name: "ModelPicker",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { ModelPicker } from "@sinups/ai-kit";
import { useState } from "react";

const models = [
  { id: "sonnet", name: "Sonnet", version: "4.6" },
  { id: "opus", name: "Opus", version: "4.7" },
  { id: "haiku", name: "Haiku", version: "4.5" },
];

export function Example() {
  const [model, setModel] = useState("sonnet");
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
        type: "code",
        title: "API Reference",
        content: `type ModelOption = {
  id: string;
  name: string;
  version?: string;
};

type ModelPickerProps = {
  models: ModelOption[];
  value?: string;           // controlled
  defaultValue?: string;    // uncontrolled
  onChange?: (modelId: string) => void;
  placeholder?: string;     // shown when no model matches, default "Auto"
  className?: string;
};

type ModelBadgeProps = {
  models: ModelOption[];
  value?: string;
  placeholder?: string;
  className?: string;
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Standalone model picker. Drop it into InputBar via leftActions/rightActions, a header, a settings sheet, or anywhere else. It does not depend on InputBar. Supports controlled and uncontrolled modes. Use ModelBadge for a read-only variant.",
      },
      {
        type: "example",
        title: "Uncontrolled",
        previewId: "ModelPicker/basic",
        code: `<ModelPicker models={models} defaultValue="sonnet" />`,
      },
      {
        type: "example",
        title: "Inside InputBar",
        previewId: "ModelPicker/in-input-bar",
        code: `<InputBar
  onSend={handleSend}
  status="ready"
  onStop={handleStop}
  leftActions={
    <ModelPicker models={models} defaultValue="sonnet" />
  }
/>`,
      },
      {
        type: "example",
        title: "Read-only badge",
        previewId: "ModelPicker/badge",
        code: `<ModelBadge models={models} value="opus" />`,
      },
    ],
  },
  {
    name: "ModeSelector",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { ModeSelector, type ModeOption } from "@sinups/ai-kit";
import { IconCursor, IconBulb } from "@tabler/icons-react";
import { useState } from "react";

const modes: ModeOption[] = [
  { id: "agent", label: "Agent", icon: IconCursor },
  { id: "plan", label: "Plan", icon: IconBulb, description: "Think before acting" },
];

export function Example() {
  const [mode, setMode] = useState("agent");
  return <ModeSelector modes={modes} value={mode} onChange={setMode} />;
}`,
      },
      {
        type: "code",
        title: "API Reference",
        content: `type ModeOption = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
};

type ModeSelectorProps = {
  modes: ModeOption[];
  value?: string;           // controlled
  defaultValue?: string;    // uncontrolled
  onChange?: (modeId: string) => void;
  className?: string;
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Standalone mode selector: agent mode, plan mode, or any custom set. Bring your own icons or omit them. With a single mode the selector renders a non-interactive label.",
      },
      {
        type: "example",
        title: "Uncontrolled",
        previewId: "ModeSelector/basic",
        code: `<ModeSelector modes={modes} defaultValue=\"agent\" />`,
      },
      {
        type: "example",
        title: "Inside InputBar",
        previewId: "ModeSelector/in-input-bar",
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
    name: "UserMessage",
    blocks: [
      {
        type: "code",
        title: "Code",
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
        type: "usage",
        title: "Usage",
        content:
          "Render a single user bubble. Supports text, image parts (image/data-image/image file), and file attachments.",
      },
      {
        type: "example",
        title: "Text only",
        previewId: "UserMessage/basic",
        code: `const message: ChatMessage = {
  id: "user-1",
  role: "user",
  parts: [{ type: "text", text: "Share the latest status." }],
};

<UserMessage message={message} />`,
      },
      {
        type: "example",
        title: "With image",
        previewId: "UserMessage/images",
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
    name: "Markdown",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { Markdown } from "@sinups/ai-kit";\n\n' +
          "const content = [\n" +
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
          '].join(\\"\\n\\");\n\n' +
          "export function Example() {\n" +
          "  return <Markdown content={content} />;\n" +
          "}",
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render streaming markdown with headings, lists, tables, blockquotes, and code fences. External links get safe target/rel handling.",
      },
      {
        type: "example",
        title: "Release note snippet",
        previewId: "Markdown/release",
        code:
          "const content = [\n" +
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
          '].join(\\"\\n\\");\n\n' +
          "<Markdown content={content} />",
      },
      {
        type: "example",
        title: "Tables + links",
        previewId: "Markdown/table",
        code:
          "const content = [\n" +
          '  "| Tool | Status |",\n' +
          '  "| --- | --- |",\n' +
          '  "| Search | Ready |",\n' +
          '  "| Bash | Ready |",\n' +
          '  "",\n' +
          '  "Visit [docs](https://example.com) for details.",\n' +
          '].join(\\"\\n\\");\n\n' +
          "<Markdown content={content} />",
      },
      {
        type: "example",
        title: "Streaming update",
        previewId: "Markdown/streaming",
        code:
          'import { useEffect, useState } from "react";\n' +
          "\n" +
          "const fullContent = [\n" +
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
          '].join(\\"\\n\\");\n' +
          "\n" +
          "export function Example() {\n" +
          '  const [content, setContent] = useState(\\"\\");\n' +
          "  const [isStreaming, setIsStreaming] = useState(false);\n" +
          "\n" +
          "  const runStream = () => {\n" +
          '    setContent(\\"\\");\n' +
          "    setIsStreaming(true);\n" +
          "    let i = 0;\n" +
          "    const tick = () => {\n" +
          "      i += 1;\n" +
          "      setContent(fullContent.slice(0, i));\n" +
          "      if (i >= fullContent.length) {\n" +
          "        setIsStreaming(false);\n" +
          "        return;\n" +
          "      }\n" +
          "      setTimeout(tick, 18);\n" +
          "    };\n" +
          "    setTimeout(tick, 120);\n" +
          "  };\n" +
          "\n" +
          "  useEffect(() => {\n" +
          "    runStream();\n" +
          "  }, []);\n" +
          "\n" +
          "  return (\n" +
          '    <div className=\\"space-y-2\\">\n' +
          '      <div className=\\"flex items-center justify-between\\">\n' +
          '        <div className=\\"text-xs text-muted-foreground\\">\n' +
          '          {isStreaming ? \\"Streaming...\\" : \\"Idle\\"}\n' +
          "        </div>\n" +
          "        <button\n" +
          '          type=\\"button\\"\n' +
          "          onClick={runStream}\n" +
          '          className=\\"text-xs px-2 py-1 rounded-md border border-border bg-background hover:bg-muted transition-colors\\"\n' +
          "        >\n" +
          "          Replay\n" +
          "        </button>\n" +
          "      </div>\n" +
          "      <Markdown content={content} />\n" +
          "    </div>\n" +
          "  );\n" +
          "}",
      },
    ],
  },
  {
    name: "AttachmentButton",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { AttachmentButton } from "@sinups/ai-kit";

export function Example() {
  return <AttachmentButton onClick={() => {}} />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render the round plus attachment trigger used by InputBar. Use onClick to open your picker action.",
      },
      {
        type: "example",
        title: "Default",
        previewId: "AttachmentButton/basic",
        code: `<AttachmentButton onClick={() => {}} />`,
      },
      {
        type: "example",
        title: "Paperclip icon",
        previewId: "AttachmentButton/paperclip",
        code: `<AttachmentButton onClick={() => {}} icon="paperclip" />`,
      },
      {
        type: "example",
        title: "Without handler",
        previewId: "AttachmentButton/passive",
        code: `<AttachmentButton />`,
      },
    ],
  },
  {
    name: "SendButton",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { SendButton } from "@sinups/ai-kit";

export function Example() {
  return (
    <SendButton state="idle" />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render the send/stop control. Use state=idle | typing | streaming.",
      },
      {
        type: "example",
        title: "Idle",
        previewId: "SendButton/idle",
        code: `<SendButton state="idle" />`,
      },
      {
        type: "example",
        title: "Typing",
        previewId: "SendButton/typing",
        code: `<SendButton state="typing" />`,
      },
      {
        type: "example",
        title: "Streaming",
        previewId: "SendButton/streaming",
        code: `<SendButton state="streaming" />`,
      },
    ],
  },
  {
    name: "FileAttachment",
    blocks: [
      {
        type: "code",
        title: "Code",
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
        type: "usage",
        title: "Usage",
        content:
          'Render a file/image chip. Use isImage + url for thumbnails, display="image-only" for previews, and onRemove to show the close control.',
      },
      {
        type: "example",
        title: "File + image",
        previewId: "FileAttachment/basic",
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
        type: "example",
        title: "Image only",
        previewId: "FileAttachment/image",
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
        type: "example",
        title: "Removable file",
        previewId: "FileAttachment/removable",
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
    name: "TextShimmer",
    blocks: [
      {
        type: "code",
        title: "Code",
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
        type: "usage",
        title: "Usage",
        content:
          "Render shimmering status text. Tune duration, spread, and delay.",
      },
      {
        type: "example",
        title: "Inline status",
        previewId: "TextShimmer/inline",
        code: `<TextShimmer as="span" duration={1.4} spread={80}>
  Syncing metadata
</TextShimmer>`,
      },
      {
        type: "example",
        title: "Delayed shimmer",
        previewId: "TextShimmer/delayed",
        code: `<TextShimmer as="span" duration={2.2} spread={140} delay={0.6}>
  Calculating risk score
</TextShimmer>`,
      },
      {
        type: "example",
        title: "Fast shimmer",
        previewId: "TextShimmer/fast",
        code: `<TextShimmer as="span" duration={0.9} spread={60}>
  Rapid sync
</TextShimmer>`,
      },
    ],
  },
  {
    name: "SpiralLoader",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { SpiralLoader } from "@sinups/ai-kit";

export function Example() {
  return <SpiralLoader size={24} />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render the spiral loader. Use size to control the square canvas and className for layout styling.",
      },
      {
        type: "example",
        title: "Sizes",
        previewId: "SpiralLoader/sizes",
        code: `<div className="flex items-center gap-4">
  <SpiralLoader size={16} />
  <SpiralLoader size={24} />
  <SpiralLoader size={32} />
</div>`,
      },
    ],
  },
  {
    name: "BashTool",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { BashTool } from "@sinups/ai-kit";\n\n' +
          "const part = {\n" +
          '  type: "tool-Bash",\n' +
          '  toolCallId: "bash-1",\n' +
          '  state: "output-available",\n' +
          '  input: { command: "ls -la" },\n' +
          '  output: { stdout: "app\\nlib\\nREADME.md" },\n' +
          "};\n\n" +
          "export function Example() {\n" +
          "  return <BashTool part={part} />;\n" +
          "}",
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render a command tool card. Provide input.command and optional output.stdout; use input.approval for the footer.",
      },
      {
        type: "example",
        title: "Terminal card",
        previewId: "BashTool/terminal",
        code: `<BashTool
  part={part}
/>`,
      },
      {
        type: "example",
        title: "Running state",
        previewId: "BashTool/pending",
        code:
          "const pendingPart = {\n" +
          '  type: "tool-Bash",\n' +
          '  toolCallId: "bash-2",\n' +
          '  state: "input-streaming",\n' +
          '  input: { command: "git status" },\n' +
          "};\n\n" +
          "<BashTool part={pendingPart} />",
      },
      {
        type: "example",
        title: "Approval footer",
        previewId: "BashTool/approval",
        code:
          "const approvalPart = {\n" +
          '  type: "tool-Bash",\n' +
          '  toolCallId: "bash-3",\n' +
          '  state: "input-available",\n' +
          "  input: {\n" +
          '    command: "pnpm test --filter ./apps/web -- --runInBand",\n' +
          '    approval: { approveLabel: "Run", rejectLabel: "Skip" },\n' +
          "  },\n" +
          "};\n\n" +
          "<BashTool part={approvalPart} />",
      },
    ],
  },
  {
    name: "EditTool",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { EditTool } from "@sinups/ai-kit";\n\n' +
          "const part = {\n" +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-1",\n' +
          '  state: "output-available",\n' +
          '  input: { file_path: "/app/page.tsx" },\n' +
          "  output: {\n" +
          "    old_content: \"export const metadata = { title: 'Old' };\\n\\nexport default function Page() {\\n  return <div>Old content</div>;\\n}\\n\",\n" +
          "    content: \"export const metadata = { title: 'Updated' };\\n\\nexport default function Page() {\\n  return (\\n    <div>\\n      <h1>Release notes</h1>\\n      <p>New layout applied.</p>\\n    </div>\\n  );\\n}\\n\",\n" +
          "  },\n" +
          "};\n\n" +
          "export function Example() {\n" +
          "  return <EditTool part={part} />;\n" +
          "}",
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render a diff card for file edits. Supply input.file_path plus diff content (old/new or structuredPatch); use input.approval for the footer.",
      },
      {
        type: "example",
        title: "Diff card",
        previewId: "EditTool/diff",
        code: `<EditTool
  part={part}
/>`,
      },
      {
        type: "example",
        title: "Approval footer",
        previewId: "EditTool/approval",
        code:
          "const approvalPart = {\n" +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-7",\n' +
          '  state: "output-available",\n' +
          "  input: {\n" +
          '    file_path: "/app/page.tsx",\n' +
          '    approval: { approveLabel: "Apply", rejectLabel: "Skip" },\n' +
          "  },\n" +
          "  output: {\n" +
          "    old_content: \"export const metadata = { title: 'Old' };\\n\\nexport default function Page() {\\n  return <div>Old content</div>;\\n}\\n\",\n" +
          "    content: \"export const metadata = { title: 'Updated' };\\n\\nexport default function Page() {\\n  return <div>New content</div>;\\n}\\n\",\n" +
          "  },\n" +
          "};\n\n" +
          "<EditTool part={approvalPart} />",
      },
      {
        type: "example",
        title: "Collapsible diff",
        previewId: "EditTool/collapsible",
        code:
          "const longPart = {\n" +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-1b",\n' +
          '  state: "output-available",\n' +
          '  input: { file_path: "/app/page.tsx" },\n' +
          "  output: {\n" +
          "    old_content: \"export const metadata = { title: 'Old' };\\n\\nexport default function Page() {\\n  return (\\n    <div>\\n      <h1>Dashboard</h1>\\n      <p>Old copy here.</p>\\n      <section>\\n        <h2>Highlights</h2>\\n        <ul>\\n          <li>Shipping ETA</li>\\n          <li>Billing status</li>\\n          <li>Support inbox</li>\\n        </ul>\\n      </section>\\n      <section>\\n        <h2>Activity</h2>\\n        <p>Recent items...</p>\\n      </section>\\n    </div>\\n  );\\n}\\n\",\n" +
          "    content: \"export const metadata = { title: 'Updated' };\\n\\nexport default function Page() {\\n  return (\\n    <div>\\n      <header>\\n        <h1>Release notes</h1>\\n        <p>New layout applied.</p>\\n      </header>\\n      <section>\\n        <h2>Highlights</h2>\\n        <ul>\\n          <li>Sync latency improvements</li>\\n          <li>Workspace search redesign</li>\\n          <li>Billing transparency</li>\\n        </ul>\\n      </section>\\n      <section>\\n        <h2>Activity</h2>\\n        <p>Recent items with timestamps...</p>\\n      </section>\\n      <section>\\n        <h2>More</h2>\\n        <p>Additional details and links.</p>\\n      </section>\\n    </div>\\n  );\\n}\\n\",\n" +
          "  },\n" +
          "};\n\n" +
          "<EditTool part={longPart} isCollapsible />",
      },
      {
        type: "example",
        title: "Pending edit",
        previewId: "EditTool/pending",
        code:
          "const pendingPart = {\n" +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-2",\n' +
          '  state: "input-streaming",\n' +
          "  input: {\n" +
          '    file_path: "/app/page.tsx",\n' +
          "    old_string: \"const title = 'Old';\\n\",\n" +
          "    new_string: \"const title = 'Updated';\\n\",\n" +
          "  },\n" +
          "};\n\n" +
          "<EditTool part={pendingPart} />",
      },
      {
        type: "example",
        title: "Waiting for diff",
        previewId: "EditTool/placeholder",
        code:
          "const placeholderPart = {\n" +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-2b",\n' +
          '  state: "input-streaming",\n' +
          "  input: {},\n" +
          "};\n\n" +
          "<EditTool part={placeholderPart} />",
      },
      {
        type: "example",
        title: "Structured patch",
        previewId: "EditTool/patch",
        code:
          "const patchPart = {\n" +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-3",\n' +
          '  state: "output-available",\n' +
          '  input: { file_path: "/app/page.tsx" },\n' +
          "  output: {\n" +
          "    structuredPatch: [\n" +
          "      {\n" +
          "        lines: [\n" +
          "          \"-const title = 'Old';\",\n" +
          "          \"+const title = 'Updated';\",\n" +
          "        ],\n" +
          "      },\n" +
          "    ],\n" +
          "  },\n" +
          "};\n\n" +
          "<EditTool part={patchPart} />",
      },
      {
        type: "example",
        title: "Write tool",
        previewId: "EditTool/write",
        code:
          "const writePart = {\n" +
          '  type: "tool-Write",\n' +
          '  toolCallId: "write-1",\n' +
          '  state: "output-available",\n' +
          '  input: { file_path: "/app/new.tsx" },\n' +
          '  output: { content: "export const Demo = () => null\\n" },\n' +
          "};\n\n" +
          "<EditTool part={writePart} />",
      },
      {
        type: "example",
        title: "Missing file path",
        previewId: "EditTool/missing-path",
        code:
          "const noPathPart = {\n" +
          '  type: "tool-Edit",\n' +
          '  toolCallId: "edit-4",\n' +
          '  state: "output-available",\n' +
          '  input: { old_string: "foo", new_string: "bar" },\n' +
          "};\n\n" +
          "<EditTool part={noPathPart} />",
      },
    ],
  },
  {
    name: "SearchTool",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { SearchTool } from "@sinups/ai-kit";\n\n' +
          "const mockResults = {\n" +
          "  results: [\n" +
          '    { source: "google", title: "United UA837 SFO→NRT · $1,105 economy", date: "google.com/flights" },\n' +
          '    { source: "expedia", title: "SFO–Tokyo · 14 results from $1,089", date: "expedia.com" },\n' +
          "  ],\n" +
          "};\n\n" +
          "const part = {\n" +
          '  type: "tool-WebSearch",\n' +
          '  toolCallId: "search-1",\n' +
          '  state: "output-available",\n' +
          '  input: { query: "best flights to Tokyo" },\n' +
          "  output: mockResults,\n" +
          "};\n\n" +
          "export function Example() {\n" +
          "  return <SearchTool part={part} />;\n" +
          "}",
      },
      {
        type: "code",
        title: "API Reference",
        content: `type SearchToolProps = {
  part: any;
  results?: SearchResult[];
  defaultOpen?: boolean;
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render grouped search results. Provide input.query/pattern and output.results (or pass results directly with the results prop). Use defaultOpen to keep it expanded.",
      },
      {
        type: "example",
        title: "Rich results",
        previewId: "SearchTool/rich",
        code: `<SearchTool
  part={part}
/>`,
      },
      {
        type: "example",
        title: "Pending search",
        previewId: "SearchTool/pending",
        code:
          "const pendingPart = {\n" +
          '  type: "tool-WebSearch",\n' +
          '  toolCallId: "search-2",\n' +
          '  state: "input-streaming",\n' +
          '  input: { query: "redis sliding window rate limiting" },\n' +
          "};\n\n" +
          "<SearchTool part={pendingPart} />",
      },
      {
        type: "example",
        title: "Alt source set",
        previewId: "SearchTool/alt",
        code:
          "const altResults = {\n" +
          "  results: [\n" +
          '    { source: "arxiv", title: "Quantum error correction below threshold · Acharya 2024", date: "arxiv.org" },\n' +
          '    { source: "scholar", title: "Utility of quantum computing · Kim et al · 567 cites", date: "scholar.google.com" },\n' +
          "  ],\n" +
          "};\n\n" +
          "const altPart = {\n" +
          '  type: "tool-WebSearch",\n' +
          '  toolCallId: "search-3",\n' +
          '  state: "output-available",\n' +
          '  input: { query: "quantum error correction" },\n' +
          "  output: altResults,\n" +
          "};\n\n" +
          "<SearchTool part={altPart} />",
      },
    ],
  },
  {
    name: "TodoTool",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { TodoTool } from "@sinups/ai-kit";\n\n' +
          "const part = {\n" +
          '  type: "tool-TodoWrite",\n' +
          '  toolCallId: "todo-1",\n' +
          '  state: "output-available",\n' +
          "  input: {\n" +
          "    todos: [\n" +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "in_progress", activeForm: "Tightening spacing" },\n' +
          '      { content: "Ship updates", status: "pending" },\n' +
          "    ],\n" +
          "  },\n" +
          "  output: { oldTodos: [] },\n" +
          "};\n\n" +
          "export function Example() {\n" +
          "  return <TodoTool part={part} />;\n" +
          "}",
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render task list changes from input.todos, optionally diffed against output.oldTodos.",
      },
      {
        type: "example",
        title: "New list",
        previewId: "TodoTool/new",
        code:
          "const newListPart = {\n" +
          '  type: "tool-TodoWrite",\n' +
          '  toolCallId: "todo-1",\n' +
          '  state: "output-available",\n' +
          "  input: {\n" +
          "    todos: [\n" +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "in_progress", activeForm: "Tightening spacing" },\n' +
          '      { content: "Ship updates", status: "pending" },\n' +
          "    ],\n" +
          "  },\n" +
          "  output: { oldTodos: [] },\n" +
          "};\n\n" +
          "<TodoTool part={newListPart} />",
      },
      {
        type: "example",
        title: "Single update",
        previewId: "TodoTool/single",
        code:
          "const singleUpdatePart = {\n" +
          '  type: "tool-TodoWrite",\n' +
          '  toolCallId: "todo-2",\n' +
          '  state: "output-available",\n' +
          "  input: {\n" +
          "    todos: [\n" +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "completed" },\n' +
          '      { content: "Ship updates", status: "pending" },\n' +
          "    ],\n" +
          "  },\n" +
          "  output: {\n" +
          "    oldTodos: [\n" +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "in_progress" },\n' +
          '      { content: "Ship updates", status: "pending" },\n' +
          "    ],\n" +
          "  },\n" +
          "};\n\n" +
          "<TodoTool part={singleUpdatePart} />",
      },
      {
        type: "example",
        title: "Multiple updates",
        previewId: "TodoTool/multiple",
        code:
          "const multipleUpdatePart = {\n" +
          '  type: "tool-TodoWrite",\n' +
          '  toolCallId: "todo-3",\n' +
          '  state: "output-available",\n' +
          "  input: {\n" +
          "    todos: [\n" +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "completed" },\n' +
          '      { content: "Ship updates", status: "in_progress" },\n' +
          "    ],\n" +
          "  },\n" +
          "  output: {\n" +
          "    oldTodos: [\n" +
          '      { content: "Audit components", status: "completed" },\n' +
          '      { content: "Tighten spacing", status: "pending" },\n' +
          '      { content: "Ship updates", status: "pending" },\n' +
          "    ],\n" +
          "  },\n" +
          "};\n\n" +
          "<TodoTool part={multipleUpdatePart} />",
      },
      {
        type: "example",
        title: "Pending update",
        previewId: "TodoTool/pending",
        code:
          "const pendingPart = {\n" +
          '  type: "tool-TodoWrite",\n' +
          '  toolCallId: "todo-4",\n' +
          '  state: "input-streaming",\n' +
          '  input: { todos: [{ content: "Ship updates", status: "in_progress" }] },\n' +
          '  output: { oldTodos: [{ content: "Ship updates", status: "pending" }] },\n' +
          "};\n\n" +
          "<TodoTool part={pendingPart} />",
      },
    ],
  },
  {
    name: "PlanTool",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { PlanTool } from "@sinups/ai-kit";\n\n' +
          "const part = {\n" +
          '  type: "tool-PlanWrite",\n' +
          '  toolCallId: "plan-1",\n' +
          '  state: "output-available",\n' +
          "  input: {\n" +
          "    plan: {\n" +
          '      id: "plan-1",\n' +
          '      title: "Refresh UI previews",\n' +
          '      summary: "Unify tool card spacing and interaction patterns so docs previews feel cohesive across all tool components.\\n\\n1. Standardize card chrome (header height, borders, radius, and muted labels) for Plan, Approval, Edit, Search, and Todo previews.\\n2. Align content density and typography so title, metadata, and body text read consistently at a glance.\\n3. Normalize interaction states: loading shimmer, pending indicators, hover affordances, and disabled action buttons.\\n4. Validate responsive behavior on narrow widths, including truncation rules and action-row wrapping.\\n5. Run a visual QA pass in both light and dark themes and tighten spacing where cards feel too loose or cramped.\\n\\nOutcome: preview gallery feels intentionally designed, easier to scan, and stable across viewport sizes.",\n' +
          "    },\n" +
          "  },\n" +
          "};\n\n" +
          "export function Example() {\n" +
          "  return <PlanTool part={part} />;\n" +
          "}",
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Display a plan title and summary with expand/collapse. Set input.approved to hide approval controls.",
      },
      {
        type: "example",
        title: "In progress",
        previewId: "PlanTool/in-progress",
        code: `<PlanTool
  part={planInProgressPart}
/>`,
      },
      {
        type: "example",
        title: "Approved",
        previewId: "PlanTool/approved",
        code:
          "const approvedPart = {\n" +
          '  type: "tool-PlanWrite",\n' +
          '  toolCallId: "plan-2",\n' +
          '  state: "output-available",\n' +
          "  input: {\n" +
          "    approved: true,\n" +
          '    plan: { id: "plan-2", title: "Gateway rollout", summary: "Plan approved and ready to execute." },\n' +
          "  },\n" +
          "};\n\n" +
          "<PlanTool part={approvedPart} />",
      },
      {
        type: "example",
        title: "Pending update",
        previewId: "PlanTool/pending",
        code:
          "const pendingPart = {\n" +
          '  type: "tool-PlanWrite",\n' +
          '  toolCallId: "plan-4",\n' +
          '  state: "input-streaming",\n' +
          '  input: { plan: { id: "plan-4", title: "Expand tool docs", summary: "Drafting an updated plan..." } },\n' +
          "};\n\n" +
          '<PlanTool part={pendingPart} chatStatus="streaming" />',
      },
    ],
  },
  {
    name: "ToolGroup",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { ToolGroup } from "@sinups/ai-kit";\n\n' +
          "const part = {\n" +
          '  type: "tool-Task",\n' +
          '  toolCallId: "task-1",\n' +
          '  state: "output-available",\n' +
          '  input: { description: "Collect previews", subagent_type: "explore" },\n' +
          "  output: { totalDurationMs: 6200 },\n" +
          "};\n\n" +
          "const nestedTools = [\n" +
          '  { type: "tool-Bash", state: "output-available", input: { command: "pnpm lint" } },\n' +
          '  { type: "tool-Grep", state: "output-available", input: { pattern: "InputBar" } },\n' +
          '  { type: "tool-Read", state: "output-available", input: { file_path: "/package/src/input/InputBar.tsx" } },\n' +
          "];\n\n" +
          "export function Example() {\n" +
          "  return (\n" +
          "    <ToolGroup\n" +
          "      part={part}\n" +
          "      nestedTools={nestedTools}\n" +
          '      completeLabel="Task completed"\n' +
          '      shimmerLabel="Running task"\n' +
          '      interruptedLabel="Task interrupted"\n' +
          "    />\n" +
          "  );\n" +
          "}",
      },
      {
        type: "code",
        title: "API Reference",
        content: `type ToolGroupProps = {
  part: any;
  nestedTools?: any[];
  chatStatus?: string;
  completeLabel: string;
  shimmerLabel?: string;
  interruptedLabel: string;
  maxVisibleTools?: number;
  defaultOpen?: boolean;
  showElapsed?: boolean;
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Summarize task runs with optional nested tools. Use defaultOpen for initial expand state, maxVisibleTools for streaming height, and showElapsed to hide/show elapsed time.",
      },
      {
        type: "example",
        title: "Completed with tools",
        previewId: "ToolGroup/completed",
        code: `<ToolGroup
  part={taskCompletedPart}
  nestedTools={nestedToolGroupTools}
  completeLabel="Task completed"
  shimmerLabel="Running task"
  interruptedLabel="Task interrupted"
/>`,
      },
      {
        type: "example",
        title: "Streaming demo",
        previewId: "ToolGroup/streaming",
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
        type: "example",
        title: "Interrupted",
        previewId: "ToolGroup/interrupted",
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
    name: "SubagentTool",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { SubagentTool } from "@sinups/ai-kit";\n\n' +
          "const part = {\n" +
          '  type: "tool-Task",\n' +
          '  toolCallId: "task-1",\n' +
          '  state: "output-available",\n' +
          '  input: { description: "Collect previews", subagent_type: "explore" },\n' +
          "  output: { totalDurationMs: 6200 },\n" +
          "};\n\n" +
          "const nestedTools = [\n" +
          '  { type: "tool-Bash", state: "output-available", input: { command: "pnpm lint" } },\n' +
          '  { type: "tool-Grep", state: "output-available", input: { pattern: "InputBar" } },\n' +
          '  { type: "tool-Read", state: "output-available", input: { file_path: "/package/src/input/InputBar.tsx" } },\n' +
          "];\n\n" +
          "export function Example() {\n" +
          "  return <SubagentTool part={part} nestedTools={nestedTools} />;\n" +
          "}",
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render a task with nested tool calls. Shows elapsed time and the last nested tool while running.",
      },
      {
        type: "example",
        title: "Completed",
        previewId: "SubagentTool/completed",
        code: `<SubagentTool
  part={taskCompletedPart}
  nestedTools={nestedToolGroupTools}
/>`,
      },
      {
        type: "example",
        title: "Pending",
        previewId: "SubagentTool/pending",
        code: `<SubagentTool
  part={taskPendingPart}
  nestedTools={nestedToolGroupTools}
  chatStatus="streaming"
/>`,
      },
      {
        type: "example",
        title: "Interrupted",
        previewId: "SubagentTool/interrupted",
        code: `<SubagentTool
  part={taskInterruptedPart}
  chatStatus="ready"
/>`,
      },
    ],
  },
  {
    name: "McpTool",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { McpTool } from "@sinups/ai-kit";\n' +
          'import { parseMcpToolType } from "@sinups/ai-kit";\n\n' +
          'const mcpInfo = parseMcpToolType("tool-ListMcpResources");\n' +
          "const part = {\n" +
          '  type: "tool-ListMcpResources",\n' +
          '  toolCallId: "mcp-1",\n' +
          '  state: "output-available",\n' +
          '  input: { query: "resources" },\n' +
          "  output: [\n" +
          '    { type: "text", text: "[{\\"id\\":\\"res_1\\",\\"name\\":\\"Billing\\"},{\\"id\\":\\"res_2\\",\\"name\\":\\"Support\\"}]" },\n' +
          "  ],\n" +
          "};\n\n" +
          "export function Example() {\n" +
          "  return <McpTool part={part} mcpInfo={mcpInfo} />;\n" +
          "}",
      },
      {
        type: "code",
        title: "API Reference",
        content: `type McpToolProps = {
  part: any;
  mcpInfo: McpToolInfo;
  chatStatus?: string;
  defaultOpen?: boolean;
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render MCP tool calls with expandable output. Provide part + mcpInfo from parseMcpToolType, use chatStatus to reflect streaming/interrupted state, and defaultOpen to keep output expanded.",
      },
      {
        type: "example",
        title: "Completed output",
        previewId: "McpTool/complete",
        code: `<McpTool
  part={part}
  mcpInfo={mcpInfo}
/>`,
      },
      {
        type: "example",
        title: "Pending",
        previewId: "McpTool/pending",
        code:
          "const pendingPart = {\n" +
          '  type: "tool-ListMcpResources",\n' +
          '  toolCallId: "mcp-2",\n' +
          '  state: "input-streaming",\n' +
          '  input: { query: "resources" },\n' +
          "};\n\n" +
          '<McpTool part={pendingPart} mcpInfo={mcpInfo} chatStatus="streaming" />',
      },
      {
        type: "example",
        title: "Interrupted",
        previewId: "McpTool/interrupted",
        code:
          "const interruptedPart = {\n" +
          '  type: "tool-ListMcpResources",\n' +
          '  toolCallId: "mcp-3",\n' +
          '  state: "input-streaming",\n' +
          '  input: { query: "resources" },\n' +
          "};\n\n" +
          '<McpTool part={interruptedPart} mcpInfo={mcpInfo} chatStatus="ready" />',
      },
    ],
  },
  {
    name: "ThinkingTool",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { ThinkingTool } from "@sinups/ai-kit";\n\n' +
          "const part = {\n" +
          '  type: "tool-Thinking",\n' +
          '  toolCallId: "think-1",\n' +
          '  state: "output-available",\n' +
          '  input: { thought: "Reviewing component coverage and preview density." },\n' +
          "};\n\n" +
          "export function Example() {\n" +
          "  return <ThinkingTool part={part} />;\n" +
          "}",
      },
      {
        type: "code",
        title: "API Reference",
        content: `type ThinkingToolProps = {
  part?: any;
  step?: Extract<TimelineStep, { type: "tool-call" }>;
  state?: StepState;
  onComplete?: () => void;
  defaultOpen?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render assistant reasoning in a collapsible row. Use defaultOpen for uncontrolled expand, or expanded + onToggleExpand for controlled state. You can also render from mapped step/state/onComplete instead of part.",
      },
      {
        type: "example",
        title: "Streaming text",
        previewId: "ThinkingTool/streaming",
        code:
          "const streamingPart = {\n" +
          '  type: "tool-Thinking",\n' +
          '  toolCallId: "think-2",\n' +
          '  state: "input-streaming",\n' +
          "  input: {\n" +
          '    thought: "Drafting a response with tool coverage and previews.\\n" +\n' +
          '      "First outline the sections, then refine the examples and polish copy.\\n" +\n' +
          '      "Keep the final response concise and actionable.",\n' +
          "  },\n" +
          "};\n\n" +
          "<ThinkingTool part={streamingPart} defaultOpen />",
      },
      {
        type: "example",
        title: "Collapsed",
        previewId: "ThinkingTool/collapsed",
        code: `<ThinkingTool
  part={part}
/>`,
      },
    ],
  },
  {
    name: "GenericTool",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { GenericTool } from "@sinups/ai-kit";\n\n' +
          "export function Example() {\n" +
          "  return (\n" +
          "    <GenericTool\n" +
          '      title="Custom tool"\n' +
          '      subtitle="Preview"\n' +
          "      isPending={false}\n" +
          "    />\n" +
          "  );\n" +
          "}",
      },
      {
        type: "code",
        title: "API Reference",
        content: `type GenericToolProps = {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  isPending: boolean;
  isError?: boolean; // reserved for compatibility
};`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render a simple tool row for custom tools. Provide title/subtitle and control loading with isPending. icon lets you pass a custom icon component.",
      },
      {
        type: "example",
        title: "Completed",
        previewId: "GenericTool/completed",
        code: `<GenericTool
  title="Custom tool"
  subtitle="Preview"
  isPending={false}
/>`,
      },
      {
        type: "example",
        title: "Pending",
        previewId: "GenericTool/pending",
        code: `<GenericTool
  title="Fetching records"
  subtitle="db.orders"
  isPending={true}
/>`,
      },
      {
        type: "example",
        title: "Compatibility flag",
        previewId: "GenericTool/error",
        code: `<GenericTool
  title="Webhook dispatch"
  subtitle="events/github"
  isPending={false}
  isError={true}
/>`,
      },
    ],
  },
  {
    name: "QuestionTool",
    blocks: [
      {
        type: "code",
        title: "Code",
        content:
          'import { useState } from "react";\n' +
          'import { QuestionTool } from "@sinups/ai-kit";\n\n' +
          "const questions = [\n" +
          "  {\n" +
          '    kind: "single",\n' +
          '    title: "Which direction should I take?",\n' +
          "    options: [\n" +
          '      { id: "small", label: "Small patch" },\n' +
          '      { id: "full", label: "Full refactor" },\n' +
          "    ],\n" +
          "    allowCustom: true,\n" +
          "  },\n" +
          "  {\n" +
          '    kind: "single",\n' +
          '    title: "How cautious should the rollout be?",\n' +
          "    options: [\n" +
          '      { id: "safe", label: "Safe and incremental" },\n' +
          '      { id: "fast", label: "Fast rollout" },\n' +
          "    ],\n" +
          "    allowCustom: true,\n" +
          "  },\n" +
          "];\n\n" +
          "export function Example() {\n" +
          "  const [questionIndex, setQuestionIndex] = useState(1);\n" +
          "  const totalQuestions = questions.length;\n\n" +
          "  const part = {\n" +
          '    type: "tool-Question",\n' +
          '    toolCallId: "question-1",\n' +
          '    state: "input-available",\n' +
          "    input: {\n" +
          "      questions,\n" +
          "      questionIndex,\n" +
          "      totalQuestions,\n" +
          "      onPreviousQuestion: () =>\n" +
          "        setQuestionIndex((prev) => Math.max(1, prev - 1)),\n" +
          "      onNextQuestion: () =>\n" +
          "        setQuestionIndex((prev) => Math.min(totalQuestions, prev + 1)),\n" +
          '      submitLabel: "Submit",\n' +
          '      skipLabel: "Skip",\n' +
          "      onSubmitAnswer: (answer) => console.log(answer),\n" +
          "    },\n" +
          "  };\n\n" +
          "  return <QuestionTool part={part} />;\n" +
          "}",
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Support single, multi, and free-text questions. It auto-advances and summarizes by default; wire questionIndex + totalQuestions for controlled navigation.",
      },
      {
        type: "example",
        title: "Single choice",
        previewId: "QuestionTool/single",
        code: `<QuestionTool
  part={questionSinglePart}
/>`,
      },
      {
        type: "example",
        title: "Multiple choice",
        previewId: "QuestionTool/multi",
        code: `<QuestionTool
  part={questionMultiPart}
/>`,
      },
      {
        type: "example",
        title: "Text answer",
        previewId: "QuestionTool/text",
        code: `<QuestionTool
  part={questionTextPart}
/>`,
      },
    ],
  },
];
