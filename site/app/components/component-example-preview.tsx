"use client";

import React, { useEffect, useState } from "react";
import {
  InputBar,
  Suggestions,
  UserMessage,
  Markdown,
  FileAttachment,
  SendButton,
  AttachmentButton,
  TextShimmer,
  BashTool,
  EditTool,
  SearchTool,
  TodoTool,
  AgentChat,
  PlanTool,
  QuestionTool,
  ToolGroup,
  SubagentTool,
  McpTool,
  ThinkingTool,
  GenericTool,
  SpiralLoader,
  ModelPicker,
  ModelBadge,
  ModeSelector,
  AgentModeIcon,
  PlanModeIcon,
  type ModeOption,
} from "@sinups/ai-kit";
import {
  IconCalendar,
  IconCode,
  IconPencil,
  IconSearch,
} from "@tabler/icons-react";
import { parseMcpToolType } from "@sinups/ai-kit";
import type { ChatMessage } from "@sinups/ai-kit";
import { CLAUDE_MODELS, DEFAULT_MODEL_ID } from "@/app/data/models";
import { COMPONENT_SHOWCASES } from "@/app/data/component-showcase";
import { componentIdFromName } from "@/app/data/component-docs";
import { MessageList } from "@sinups/ai-kit";

const noop = () => {};
const sampleImage =
  "https://images.unsplash.com/photo-1609884906362-e6686001dee9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
const toolbarModes: ModeOption[] = [
  { id: "agent", label: "Agent", icon: AgentModeIcon },
  {
    id: "plan",
    label: "Plan",
    icon: PlanModeIcon,
    description: "Think before acting",
  },
];

const suggestionItems = [
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

export function ComponentExamplePreview({ previewId }: { previewId: string }) {
  if (previewId === "InputBar/outline") {
    return <InputBarFocusPreview />;
  }
  if (previewId === "InputBar/basic") {
    return <InputBar onSend={noop} status="ready" onStop={noop} />;
  }
  if (previewId === "InputBar/attachments") {
    return (
      <InputBar
        onSend={noop}
        status="ready"
        onStop={noop}
        onAttach={noop}
        attachedImages={[
          { id: "img-3", filename: "input.png", url: sampleImage },
        ]}
        attachedFiles={[{ id: "file-3", filename: "spec.md", size: 3200 }]}
        onRemoveImage={noop}
        onRemoveFile={noop}
      />
    );
  }
  if (previewId === "InputBar/info") {
    return (
      <InputBar
        onSend={noop}
        status="ready"
        onStop={noop}
        infoBar={{
          title: "Low credits",
          description: "Your monthly balance is running out.",
          action: { label: "Upgrade", onClick: noop },
        }}
      />
    );
  }
  if (previewId === "InputBar/info-bottom") {
    return (
      <InputBar
        onSend={noop}
        status="ready"
        onStop={noop}
        infoBar={{
          title: "Syncing workspace",
          description: "We will keep watching for changes.",
          onClose: noop,
          position: "bottom",
        }}
      />
    );
  }
  if (previewId === "InputBar/question") {
    return <InputBarQuestionPreview />;
  }
  if (previewId === "InputBar/toolbar-actions") {
    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[520px]">
          <InputBar
            onSend={noop}
            status="ready"
            onStop={noop}
            leftActions={
              <>
                <ModeSelector modes={toolbarModes} defaultValue="agent" />
                <ModelPicker
                  models={CLAUDE_MODELS}
                  defaultValue={DEFAULT_MODEL_ID}
                />
              </>
            }
          />
        </div>
      </div>
    );
  }
  if (previewId === "ModelPicker/basic") {
    return (
      <ModelPicker models={CLAUDE_MODELS} defaultValue={DEFAULT_MODEL_ID} />
    );
  }
  if (previewId === "ModelPicker/in-input-bar") {
    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[520px]">
          <InputBar
            onSend={noop}
            status="ready"
            onStop={noop}
            leftActions={
              <ModelPicker
                models={CLAUDE_MODELS}
                defaultValue={DEFAULT_MODEL_ID}
              />
            }
          />
        </div>
      </div>
    );
  }
  if (previewId === "ModelPicker/badge") {
    return <ModelBadge models={CLAUDE_MODELS} value="opus" />;
  }
  if (previewId === "ModeSelector/basic") {
    return <ModeSelector modes={toolbarModes} defaultValue="agent" />;
  }
  if (previewId === "ModeSelector/in-input-bar") {
    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-[520px]">
          <InputBar
            onSend={noop}
            status="ready"
            onStop={noop}
            leftActions={
              <ModeSelector modes={toolbarModes} defaultValue="agent" />
            }
          />
        </div>
      </div>
    );
  }
  if (previewId === "Suggestions/basic") {
    return (
      <div className="flex w-full justify-center">
        <Suggestions
          items={suggestionItems}
          onSelect={(item) => console.log(item.label)}
          className="w-fit justify-center"
          itemClassName="h-7 rounded-[6px] px-2 text-sm"
        />
      </div>
    );
  }
  if (previewId === "Suggestions/fill") {
    return <SuggestionsFillPreview />;
  }
  if (previewId === "MessageList/basic") {
    return (
      <MessageList
        messages={basicMessages}
        status="ready"
        className="h-full"
      />
    );
  }
  if (previewId === "MessageList/timestamps") {
    return (
      <MessageList
        messages={timestampMessages as ChatMessage[]}
        status="ready"
        className="h-full"
      />
    );
  }
  if (previewId === "Markdown/release") {
    return <Markdown content={streamingReleaseContent} />;
  }
  if (previewId === "Markdown/table") {
    return <Markdown content={streamingTableContent} />;
  }
  if (previewId === "Markdown/streaming") {
    return <MarkdownStreamingPreview />;
  }
  if (previewId === "SendButton/idle") {
    return <SendButton state="idle" />;
  }
  if (previewId === "SendButton/typing") {
    return <SendButton state="typing" />;
  }
  if (previewId === "SendButton/streaming") {
    return <SendButton state="streaming" />;
  }
  if (previewId === "AttachmentButton/basic") {
    return <AttachmentButtonPreview />;
  }
  if (previewId === "AttachmentButton/paperclip") {
    return <AttachmentButtonPreview icon="paperclip" />;
  }
  if (previewId === "AttachmentButton/passive") {
    return <AttachmentButton />;
  }
  if (previewId === "FileAttachment/basic") {
    return (
      <div className="flex flex-col gap-2">
        <FileAttachment id="file-1" filename="report.pdf" size={23000} />
        <FileAttachment
          id="file-2"
          filename="design.png"
          size={120000}
          isImage
          url={sampleImage}
        />
      </div>
    );
  }
  if (previewId === "FileAttachment/image") {
    return (
      <FileAttachment
        id="img-1"
        filename="hero.png"
        isImage
        url={sampleImage}
        display="image-only"
        onRemove={noop}
      />
    );
  }
  if (previewId === "FileAttachment/removable") {
    return (
      <FileAttachment
        id="file-3"
        filename="notes.md"
        size={4200}
        onRemove={noop}
      />
    );
  }
  if (previewId === "TextShimmer/inline") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-foreground/70">Status</span>
        <TextShimmer as="span" duration={1.4} spread={80}>
          Syncing metadata
        </TextShimmer>
      </div>
    );
  }
  if (previewId === "TextShimmer/delayed") {
    return (
      <div className="text-sm">
        <TextShimmer as="span" duration={2.2} spread={140} delay={0.6}>
          Calculating risk score
        </TextShimmer>
      </div>
    );
  }
  if (previewId === "TextShimmer/fast") {
    return (
      <div className="text-sm">
        <TextShimmer as="span" duration={0.9} spread={60}>
          Rapid sync
        </TextShimmer>
      </div>
    );
  }
  if (previewId === "SpiralLoader/sizes") {
    return (
      <div className="flex items-center gap-4">
        <SpiralLoader size={16} />
        <SpiralLoader size={24} />
        <SpiralLoader size={32} />
      </div>
    );
  }
  if (previewId === "BashTool/terminal") {
    return <BashTool part={bashToolPart} />;
  }
  if (previewId === "BashTool/pending") {
    return <BashTool part={bashToolPendingPart} />;
  }
  if (previewId === "BashTool/approval") {
    return <BashTool part={bashToolApprovalPart} />;
  }
  if (previewId === "EditTool/diff") {
    return <EditTool part={editToolPart} />;
  }
  if (previewId === "EditTool/collapsible") {
    return <EditTool part={editToolLargePart} isCollapsible />;
  }
  if (previewId === "EditTool/pending") {
    return <EditTool part={editToolPendingPart} />;
  }
  if (previewId === "EditTool/approval") {
    return <EditTool part={editToolApprovalPart} />;
  }
  if (previewId === "EditTool/placeholder") {
    return <EditTool part={editToolPlaceholderPart} />;
  }
  if (previewId === "EditTool/patch") {
    return <EditTool part={editToolPatchPart} />;
  }
  if (previewId === "EditTool/write") {
    return <EditTool part={editToolWritePart} />;
  }
  if (previewId === "EditTool/missing-path") {
    return <EditTool part={editToolMissingPathPart} />;
  }
  if (previewId === "SearchTool/rich") {
    return <SearchTool part={searchToolPart} />;
  }
  if (previewId === "SearchTool/pending") {
    return <SearchTool part={searchToolPendingPart} />;
  }
  if (previewId === "SearchTool/alt") {
    return <SearchTool part={searchToolAltPart} />;
  }
  if (previewId === "TodoTool/new") {
    return <TodoTool part={todoNewPart} />;
  }
  if (previewId === "TodoTool/single") {
    return <TodoTool part={todoSinglePart} />;
  }
  if (previewId === "TodoTool/multiple") {
    return <TodoTool part={todoMultiplePart} />;
  }
  if (previewId === "TodoTool/pending") {
    return <TodoTool part={todoPendingPart} />;
  }
  if (previewId === "AgentChat/basic") {
    return (
      <div className="h-full bg-background">
        <AgentChat
          messages={agentChatMessages}
          status="ready"
          onSend={() => {}}
          onStop={() => {}}
          initialScrollBehavior="top"
        />
      </div>
    );
  }
  if (previewId === "AgentChat/empty-centered") {
    return (
      <div className="h-full bg-background">
        <AgentChat
          messages={[]}
          status="ready"
          onSend={noop}
          onStop={noop}
          emptyStatePosition="center"
        />
      </div>
    );
  }
  if (previewId === "AgentChat/empty-centered-suggestions") {
    return (
      <div className="h-full bg-background">
        <AgentChat
          messages={[]}
          status="ready"
          onSend={noop}
          onStop={noop}
          emptyStatePosition="center"
          emptySuggestionsPlacement="empty"
          emptySuggestionsPosition="bottom"
          suggestions={{
            items: suggestionItems,
            className: "justify-center",
            itemClassName: "h-7 rounded-[6px] px-2 text-sm",
          }}
        />
      </div>
    );
  }
  if (previewId === "AgentChat/attachments") {
    return (
      <div className="h-full bg-background">
        <AgentChat
          messages={agentChatMessages}
          status="ready"
          onSend={noop}
          onStop={noop}
          initialScrollBehavior="top"
          attachments={{
            onAttach: noop,
            images: [
              { id: "img-chat-1", filename: "preview.png", url: sampleImage },
            ],
            files: [{ id: "file-chat-1", filename: "spec.md", size: 3200 }],
            onRemoveImage: noop,
            onRemoveFile: noop,
          }}
        />
      </div>
    );
  }
  if (previewId === "AgentChat/copy-toolbar") {
    return (
      <div className="h-full bg-background">
        <AgentChat
          messages={agentChatMessages}
          status="ready"
          onSend={noop}
          onStop={noop}
          showCopyToolbar
          initialScrollBehavior="top"
        />
      </div>
    );
  }
  if (previewId === "PlanTool/in-progress") {
    return <PlanTool part={planInProgressPart} />;
  }
  if (previewId === "PlanTool/approved") {
    return <PlanTool part={planApprovedPart} />;
  }
  if (previewId === "PlanTool/pending") {
    return <PlanTool part={planPendingPart} chatStatus="streaming" />;
  }
  if (previewId === "QuestionTool/single") {
    return <QuestionTool part={questionSinglePart} />;
  }
  if (previewId === "QuestionTool/multi") {
    return <QuestionTool part={questionMultiPart} />;
  }
  if (previewId === "QuestionTool/text") {
    return <QuestionTool part={questionTextPart} />;
  }
  if (previewId === "ToolGroup/completed") {
    return (
      <ToolGroup
        part={taskCompletedPart}
        nestedTools={toolGroupNestedTools}
        completeLabel="Task completed"
        shimmerLabel="Running task"
        interruptedLabel="Task interrupted"
      />
    );
  }
  if (previewId === "ToolGroup/streaming") {
    return <ToolGroupStreamingPreview />;
  }
  if (previewId === "ToolGroup/interrupted") {
    return (
      <ToolGroup
        part={taskInterruptedPart}
        chatStatus="ready"
        completeLabel="Task completed"
        shimmerLabel="Running task"
        interruptedLabel="Task interrupted"
      />
    );
  }
  if (previewId === "SubagentTool/completed") {
    return (
      <SubagentTool
        part={taskCompletedPart}
        nestedTools={toolGroupNestedTools}
      />
    );
  }
  if (previewId === "SubagentTool/pending") {
    return (
      <SubagentTool
        part={taskPendingPart}
        nestedTools={toolGroupNestedTools}
        chatStatus="streaming"
      />
    );
  }
  if (previewId === "SubagentTool/interrupted") {
    return <SubagentTool part={taskInterruptedPart} chatStatus="ready" />;
  }
  if (previewId === "McpTool/complete") {
    return <McpTool part={mcpCompletePart} mcpInfo={mcpInfo} />;
  }
  if (previewId === "McpTool/pending") {
    return (
      <McpTool part={mcpPendingPart} mcpInfo={mcpInfo} chatStatus="streaming" />
    );
  }
  if (previewId === "McpTool/interrupted") {
    return (
      <McpTool part={mcpInterruptedPart} mcpInfo={mcpInfo} chatStatus="ready" />
    );
  }
  if (previewId === "ThinkingTool/collapsed") {
    return <ThinkingTool part={thinkingCollapsedPart} />;
  }
  if (previewId === "ThinkingTool/streaming") {
    return <ThinkingStreamingPreview />;
  }
  if (previewId === "GenericTool/completed") {
    return (
      <GenericTool
        title="Custom tool"
        subtitle="Preview"
        isPending={false}
        isError={false}
      />
    );
  }
  if (previewId === "GenericTool/pending") {
    return (
      <GenericTool
        title="Fetching records"
        subtitle="db.orders"
        isPending={true}
        isError={false}
      />
    );
  }
  if (previewId === "GenericTool/error") {
    return (
      <GenericTool
        title="Write failed"
        subtitle="permissions"
        isPending={false}
        isError={true}
      />
    );
  }
  if (previewId === "UserMessage/basic") {
    return <UserMessage message={userTextMessage} />;
  }
  if (previewId === "UserMessage/images") {
    return <UserMessage message={userImageMessage} />;
  }

  const component = COMPONENT_SHOWCASES.find(
    (item) => componentIdFromName(item.name) === componentIdFromName(previewId),
  );
  if (!component) return null;
  return <>{component.node}</>;
}

function AttachmentButtonPreview({
  icon,
}: {
  icon?: "plus" | "paperclip";
} = {}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  return (
    <>
      <AttachmentButton
        onClick={() => inputRef.current?.click()}
        icon={icon}
      />
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

function InputBarQuestionPreview() {
  return (
    <InputBar
      onSend={noop}
      status="ready"
      onStop={noop}
      questionBar={{
        id: "question-1",
        questions: questionSingleSet,
        submitLabel: "Submit",
        skipLabel: "Skip",
        onSubmit: noop,
      }}
    />
  );
}

function InputBarFocusPreview() {
  return (
    <div
      style={{ "--an-input-focus-outline": "#0ea5e9" } as React.CSSProperties}
    >
      <InputBar onSend={noop} status="ready" onStop={noop} />
    </div>
  );
}

function SuggestionsFillPreview() {
  const [value, setValue] = useState("");

  return (
    <div className="flex w-full justify-center">
      <div className="w-full max-w-[640px]">
        <InputBar
          value={value}
          onChange={setValue}
          onSend={noop}
          status="ready"
          onStop={noop}
          suggestions={{
            items: suggestionItems,
            className: "w-full justify-center",
            itemClassName: "h-7 rounded-[6px] px-2 text-sm",
          }}
        />
      </div>
    </div>
  );
}

function MarkdownStreamingPreview() {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const runStream = () => {
    setContent("");
    setIsStreaming(true);
    let i = 0;
    const tick = () => {
      i += 1;
      setContent(streamingFullContent.slice(0, i));
      if (i >= streamingFullContent.length) {
        setIsStreaming(false);
        return;
      }
      window.setTimeout(tick, 18);
    };
    window.setTimeout(tick, 120);
  };

  useEffect(() => {
    runStream();
  }, []);

  // Stack the full content invisibly under the streamed content so the card
  // reserves its final height up front — prevents the jarring "grow as
  // tokens arrive" reflow.
  return (
    <div className="grid">
      <div
        className="invisible [grid-area:1/1] pointer-events-none"
        aria-hidden="true"
      >
        <Markdown content={streamingFullContent} />
      </div>
      <div className="[grid-area:1/1]">
        <Markdown content={content} />
      </div>
    </div>
  );
}

function ToolGroupStreamingPreview() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [runId, setRunId] = useState(0);

  const runStream = () => {
    setRunId((prev) => prev + 1);
    setIsStreaming(true);
    window.setTimeout(
      () => {
        setIsStreaming(false);
      },
      toolGroupStreamingTools.length * 450 + 800,
    );
  };

  useEffect(() => {
    runStream();
  }, []);

  const part = isStreaming
    ? {
        ...taskPendingPart,
        toolCallId: `task-stream-${runId}`,
        state: "input-streaming",
      }
    : {
        ...taskCompletedPart,
        toolCallId: `task-stream-${runId}`,
        state: "output-available",
      };

  return (
    <ToolGroup
      part={part}
      nestedTools={toolGroupStreamingTools}
      chatStatus={isStreaming ? "streaming" : "ready"}
      completeLabel="Explored"
      shimmerLabel="Exploring"
      interruptedLabel="Exploration interrupted"
      showElapsed={false}
    />
  );
}

function ThinkingStreamingPreview() {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const fullThought =
    typeof thinkingStreamingPart.input?.thought === "string"
      ? thinkingStreamingPart.input.thought
      : "";

  const runStream = () => {
    setContent("");
    setIsStreaming(true);
    let i = 0;
    const tick = () => {
      i += 1;
      setContent(fullThought.slice(0, i));
      if (i >= fullThought.length) {
        setIsStreaming(false);
        return;
      }
      window.setTimeout(tick, 16);
    };
    window.setTimeout(tick, 120);
  };

  useEffect(() => {
    runStream();
  }, []);

  const part = isStreaming
    ? {
        ...thinkingStreamingPart,
        state: "input-streaming",
        input: { thought: content },
      }
    : {
        ...thinkingStreamingPart,
        state: "output-available",
        input: { thought: fullThought },
      };

  return (
    <ThinkingTool part={part} expanded={isStreaming} onToggleExpand={noop} />
  );
}

const basicMessages: ChatMessage[] = [
  {
    id: "msg-basic-1",
    role: "user",
    parts: [{ type: "text", text: "Share the latest status." }],
  },
  {
    id: "msg-basic-2",
    role: "assistant",
    parts: [{ type: "text", text: "All systems are green." }],
  },
  {
    id: "msg-basic-3",
    role: "user",
    parts: [{ type: "text", text: "Any regressions from last deploy?" }],
  },
  {
    id: "msg-basic-4",
    role: "assistant",
    parts: [{ type: "text", text: "No new errors in the last 24 hours." }],
  },
  {
    id: "msg-basic-5",
    role: "user",
    parts: [{ type: "text", text: "Summarize open tickets." }],
  },
  {
    id: "msg-basic-6",
    role: "assistant",
    parts: [
      {
        type: "text",
        text: "3 open: billing follow-up, onboarding issue, and API timeout investigation.",
      },
    ],
  },
];

const timestampMessages: Array<ChatMessage & { createdAt?: Date }> = [
  {
    id: "msg-time-1",
    role: "user",
    parts: [{ type: "text", text: "Can you summarize this?" }],
    createdAt: new Date(),
  },
  {
    id: "msg-time-2",
    role: "assistant",
    parts: [{ type: "text", text: "Here is the summary." }],
  },
];

const userTextMessage: ChatMessage = {
  id: "user-text-1",
  role: "user",
  parts: [{ type: "text", text: "Share the latest status." }],
};

const userImageMessage: ChatMessage = {
  id: "user-image-1",
  role: "user",
  parts: [
    { type: "text", text: "Here is the screenshot." },
    { type: "data-image", data: { url: sampleImage } },
  ],
};

const streamingReleaseContent = [
  "# Release notes",
  "",
  "- Added streaming markdown",
  "- Improved tool rendering",
  "",
  "## Example",
  "",
  'Use "Markdown" to render assistant text as it streams.',
  "",
  "```ts",
  'console.log("Hello from markdown");',
  "```",
].join("\n");

const streamingTableContent = [
  "",
  "| Tool | Status |",
  "| --- | --- |",
  "| Search | Ready |",
  "| Bash | Ready |",
  "",
  "",
  "Visit [docs](https://example.com) for details.",
].join("\n");

const bashToolPart = {
  type: "tool-Bash",
  toolCallId: "bash-1",
  state: "output-available",
  input: { command: "ls -la" },
  output: { stdout: "app\nlib\nREADME.md" },
};

const bashToolPendingPart = {
  type: "tool-Bash",
  toolCallId: "bash-2",
  state: "input-streaming",
  input: { command: "git status" },
};

const bashToolApprovalPart = {
  type: "tool-Bash",
  toolCallId: "bash-3",
  state: "input-available",
  input: {
    command: "pnpm test --filter ./apps/web -- --runInBand",
    approval: { approveLabel: "Run", rejectLabel: "Skip" },
  },
};

const editToolPart = {
  type: "tool-Edit",
  toolCallId: "edit-1",
  state: "output-available",
  input: { file_path: "/app/page.tsx" },
  output: {
    old_content:
      "export const metadata = { title: 'Old' };\n\nexport default function Page() {\n  return <div>Old content</div>;\n}\n",
    content:
      "export const metadata = { title: 'Updated' };\n\nexport default function Page() {\n  return (\n    <div>\n      <h1>Release notes</h1>\n      <p>New layout applied.</p>\n    </div>\n  );\n}\n",
  },
};

const editToolLargePart = {
  type: "tool-Edit",
  toolCallId: "edit-1b",
  state: "output-available",
  input: { file_path: "/app/page.tsx" },
  output: {
    old_content:
      "export const metadata = { title: 'Old' };\n\nexport default function Page() {\n  return (\n    <div>\n      <h1>Dashboard</h1>\n      <p>Old copy here.</p>\n      <section>\n        <h2>Highlights</h2>\n        <ul>\n          <li>Shipping ETA</li>\n          <li>Billing status</li>\n          <li>Support inbox</li>\n        </ul>\n      </section>\n      <section>\n        <h2>Activity</h2>\n        <p>Recent items...</p>\n      </section>\n    </div>\n  );\n}\n",
    content:
      "export const metadata = { title: 'Updated' };\n\nexport default function Page() {\n  return (\n    <div>\n      <header>\n        <h1>Release notes</h1>\n        <p>New layout applied.</p>\n      </header>\n      <section>\n        <h2>Highlights</h2>\n        <ul>\n          <li>Sync latency improvements</li>\n          <li>Workspace search redesign</li>\n          <li>Billing transparency</li>\n        </ul>\n      </section>\n      <section>\n        <h2>Activity</h2>\n        <p>Recent items with timestamps...</p>\n      </section>\n      <section>\n        <h2>More</h2>\n        <p>Additional details and links.</p>\n      </section>\n    </div>\n  );\n}\n",
  },
};

const editToolPendingPart = {
  type: "tool-Edit",
  toolCallId: "edit-2",
  state: "input-streaming",
  input: {
    file_path: "/app/page.tsx",
    old_string: "const title = 'Old';\n",
    new_string: "const title = 'Updated';\n",
  },
};

const editToolApprovalPart = {
  type: "tool-Edit",
  toolCallId: "edit-7",
  state: "output-available",
  input: {
    file_path: "/app/page.tsx",
    approval: { approveLabel: "Apply", rejectLabel: "Skip" },
  },
  output: {
    old_content:
      "export const metadata = { title: 'Old' };\n\nexport default function Page() {\n  return <div>Old content</div>;\n}\n",
    content:
      "export const metadata = { title: 'Updated' };\n\nexport default function Page() {\n  return <div>New content</div>;\n}\n",
  },
};

const editToolPlaceholderPart = {
  type: "tool-Edit",
  toolCallId: "edit-2b",
  state: "input-streaming",
  input: {},
};

const editToolPatchPart = {
  type: "tool-Edit",
  toolCallId: "edit-3",
  state: "output-available",
  input: { file_path: "/app/page.tsx" },
  output: {
    structuredPatch: [
      {
        lines: ["-const title = 'Old';", "+const title = 'Updated';"],
      },
    ],
  },
};

const editToolWritePart = {
  type: "tool-Write",
  toolCallId: "write-1",
  state: "output-available",
  input: { file_path: "/app/new.tsx" },
  output: { content: "export const Demo = () => null\n" },
};

const editToolMissingPathPart = {
  type: "tool-Edit",
  toolCallId: "edit-4",
  state: "output-available",
  input: { old_string: "foo", new_string: "bar" },
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

const searchResultsAlt = {
  results: [
    {
      source: "arxiv",
      title: "Quantum error correction below threshold · Acharya 2024",
      date: "arxiv.org",
    },
    {
      source: "arxiv",
      title: "Interferometric parity measurement · Aghaee 2025",
      date: "arxiv.org",
    },
    {
      source: "scholar",
      title: "Utility of quantum computing · Kim et al · 567 cites",
      date: "scholar.google.com",
    },
  ],
  tabs: [
    { source: "arxiv", label: "arXiv", count: 3 },
    { source: "scholar", label: "Scholar", count: 2 },
  ],
};

const searchToolPart = {
  type: "tool-WebSearch",
  toolCallId: "search-1",
  state: "output-available",
  input: { query: "best flights to Tokyo" },
  output: searchResultsDefault,
};

const searchToolPendingPart = {
  type: "tool-WebSearch",
  toolCallId: "search-2",
  state: "input-streaming",
  input: { query: "redis sliding window rate limiting" },
};

const searchToolAltPart = {
  type: "tool-WebSearch",
  toolCallId: "search-3",
  state: "output-available",
  input: { query: "quantum error correction" },
  output: searchResultsAlt,
};

const todoNewPart = {
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

const todoSinglePart = {
  type: "tool-TodoWrite",
  toolCallId: "todo-2",
  state: "output-available",
  input: {
    todos: [
      { content: "Audit components", status: "completed" },
      { content: "Tighten spacing", status: "completed" },
      { content: "Ship updates", status: "pending" },
    ],
  },
  output: {
    oldTodos: [
      { content: "Audit components", status: "completed" },
      { content: "Tighten spacing", status: "in_progress" },
      { content: "Ship updates", status: "pending" },
    ],
  },
};

const todoMultiplePart = {
  type: "tool-TodoWrite",
  toolCallId: "todo-3",
  state: "output-available",
  input: {
    todos: [
      { content: "Audit components", status: "completed" },
      { content: "Tighten spacing", status: "completed" },
      { content: "Ship updates", status: "in_progress" },
    ],
  },
  output: {
    oldTodos: [
      { content: "Audit components", status: "completed" },
      { content: "Tighten spacing", status: "pending" },
      { content: "Ship updates", status: "pending" },
    ],
  },
};

const todoPendingPart = {
  type: "tool-TodoWrite",
  toolCallId: "todo-4",
  state: "input-streaming",
  input: {
    todos: [{ content: "Ship updates", status: "in_progress" }],
  },
  output: {
    oldTodos: [{ content: "Ship updates", status: "pending" }],
  },
};

const planInProgressPart = {
  type: "tool-PlanWrite",
  toolCallId: "plan-1",
  state: "output-available",
  input: {
    plan: {
      id: "plan-1",
      title: "Refresh UI previews",
      summary:
        "Unify tool card spacing and interaction patterns so docs previews feel cohesive across all tool components.\n\n1. Standardize card chrome (header height, borders, radius, and muted labels) for Plan, Approval, Edit, Search, and Todo previews.\n2. Align content density and typography so title, metadata, and body text read consistently at a glance.\n3. Normalize interaction states: loading shimmer, pending indicators, hover affordances, and disabled action buttons.\n4. Validate responsive behavior on narrow widths, including truncation rules and action-row wrapping.\n5. Run a visual QA pass in both light and dark themes and tighten spacing where cards feel too loose or cramped.\n\nOutcome: preview gallery feels intentionally designed, easier to scan, and stable across viewport sizes.",
    },
  },
};

const planPendingPart = {
  type: "tool-PlanWrite",
  toolCallId: "plan-4",
  state: "input-streaming",
  input: {
    plan: {
      id: "plan-4",
      title: "Expand tool docs",
      summary:
        "Drafting a fuller documentation plan with rationale, edge cases, and expected outcomes per section.\n\nThis update extends examples with realistic payloads, richer summaries, and clearer before/after intent so readers can copy patterns directly.",
    },
  },
};

const agentChatMessages: ChatMessage[] = [
  {
    id: "agent-chat-1",
    role: "user",
    parts: [{ type: "text", text: "Show me the latest status." }],
  },
  {
    id: "agent-chat-2",
    role: "assistant",
    parts: [{ type: "text", text: "All systems are green." }],
  },
];

const planApprovedPart = {
  type: "tool-PlanWrite",
  toolCallId: "plan-2",
  state: "output-available",
  input: {
    approved: true,
    plan: {
      id: "plan-2",
      title: "Gateway rollout",
      summary:
        "Plan approved and ready to execute.\n\n1. Enable rate limiting behind the feature flag for internal traffic.\n2. Validate metrics ingestion (latency, status codes, rejects).\n3. Ramp to 10%/50%/100% with monitoring.\n4. Confirm error budget impact and update docs.",
    },
  },
};

const questionSingleSet = [
  {
    kind: "single" as const,
    title: "Which direction should I take?",
    options: [
      { id: "small", label: "Small patch" },
      { id: "full", label: "Full refactor" },
    ],
    allowCustom: true,
  },
  {
    kind: "single" as const,
    title: "How cautious should the rollout be?",
    options: [
      { id: "safe", label: "Safe and incremental" },
      { id: "fast", label: "Fast rollout" },
    ],
    allowCustom: true,
  },
];

const questionMultiSet = [
  {
    kind: "multi" as const,
    title: "What should I include?",
    options: [
      { id: "tests", label: "Tests" },
      { id: "docs", label: "Docs" },
      { id: "refactor", label: "Refactor" },
    ],
    allowCustom: true,
    minSelections: 1,
  },
  {
    kind: "multi" as const,
    title: "Which teams should review it?",
    options: [
      { id: "design", label: "Design" },
      { id: "frontend", label: "Frontend" },
      { id: "platform", label: "Platform" },
    ],
    allowCustom: true,
    minSelections: 1,
  },
];

const questionTextSet = [
  {
    kind: "text" as const,
    title: "What output format do you want?",
    placeholder: "e.g. concise bullets with file paths",
  },
  {
    kind: "text" as const,
    title: "Any constraints I should follow?",
    placeholder: "e.g. keep API stable, avoid new deps",
  },
];

const questionSinglePart = {
  type: "tool-Question",
  toolCallId: "question-1",
  state: "input-available",
  input: {
    questions: questionSingleSet,
    submitLabel: "Submit",
    skipLabel: "Skip",
  },
};

const questionMultiPart = {
  type: "tool-Question",
  toolCallId: "question-2",
  state: "input-available",
  input: {
    questions: questionMultiSet,
    submitLabel: "Submit",
    skipLabel: "Skip",
  },
};

const questionTextPart = {
  type: "tool-Question",
  toolCallId: "question-3",
  state: "input-available",
  input: {
    questions: questionTextSet,
    submitLabel: "Submit",
    skipLabel: "Skip",
  },
};

const toolGroupNestedTools = [
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

const toolGroupStreamingTools = [
  {
    type: "tool-Read",
    state: "output-available",
    input: { file_path: "/package/src/index.ts" },
  },
  {
    type: "tool-Grep",
    state: "output-available",
    input: { pattern: "ToolGroup" },
  },
  {
    type: "tool-Read",
    state: "output-available",
    input: { file_path: "/package/src/input/InputBar.tsx" },
  },
  {
    type: "tool-Grep",
    state: "output-available",
    input: { pattern: "QuestionPrompt" },
  },
  {
    type: "tool-Read",
    state: "output-available",
    input: {
      file_path: "/package/src/question/QuestionPrompt.tsx",
    },
  },
  {
    type: "tool-Read",
    state: "output-available",
    input: { file_path: "/package/src/tools/ToolGroup.tsx" },
  },
  {
    type: "tool-Read",
    state: "output-available",
    input: { file_path: "/package/src/ToolRowBase/ToolRowBase.tsx" },
  },
  {
    type: "tool-Read",
    state: "output-available",
    input: { file_path: "/site/app/data/component-docs.ts" },
  },
  {
    type: "tool-Read",
    state: "output-available",
    input: { file_path: "/package/src/tools/tool-registry.ts" },
  },
  {
    type: "tool-Glob",
    state: "output-available",
    input: { pattern: "**/*tool*.tsx" },
  },
  {
    type: "tool-Read",
    state: "output-available",
    input: { file_path: "/package/src/tools/SearchTool.tsx" },
  },
  {
    type: "tool-Grep",
    state: "output-available",
    input: { pattern: "ToolGroup/streaming" },
  },
];

const taskCompletedPart = {
  type: "tool-Task",
  toolCallId: "task-1",
  state: "output-available",
  input: { description: "Collect previews", subagent_type: "explore" },
  output: { totalDurationMs: 6200 },
};

const taskPendingPart = {
  type: "tool-Task",
  toolCallId: "task-2",
  state: "input-streaming",
  input: { description: "Audit spacing", subagent_type: "explore" },
  callProviderMetadata: { custom: { startedAt: Date.now() - 3200 } },
};

const taskInterruptedPart = {
  type: "tool-Task",
  toolCallId: "task-3",
  state: "input-streaming",
  input: { description: "Gather diffs", subagent_type: "explore" },
};

const mcpInfo =
  parseMcpToolType("tool-ListMcpResources") ??
  ({
    serverName: "mcp",
    toolName: "list_resources",
    displayName: "List Resources",
    category: "list",
  } as const);

const mcpCompletePart = {
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

const mcpPendingPart = {
  type: "tool-ListMcpResources",
  toolCallId: "mcp-2",
  state: "input-streaming",
  input: { query: "resources" },
};

const mcpInterruptedPart = {
  type: "tool-ListMcpResources",
  toolCallId: "mcp-3",
  state: "input-streaming",
  input: { query: "resources" },
};

const thinkingCollapsedPart = {
  type: "tool-Thinking",
  toolCallId: "think-1",
  state: "output-available",
  input: { thought: "Reviewing component coverage and preview density." },
};

const thinkingStreamingPart = {
  type: "tool-Thinking",
  toolCallId: "think-2",
  state: "input-streaming",
  input: {
    thought:
      "Drafting a response with tool coverage and previews.\n" +
      "First outline the sections, then refine the examples and polish copy.\n" +
      "Keep the final response concise and actionable.",
  },
};

const streamingFullContent = [
  "### Working plan",
  "",
  "- Parse input context",
  "- Extract constraints",
  "- Draft outline",
  "",
  "#### Draft",
  "We will deliver a tight summary, then provide supporting details.",
  "",
  "```ts",
  'const steps = ["parse", "outline", "draft"];',
  "```",
  "",
  "| Step | Status |",
  "| --- | --- |",
  "| Parse | Done |",
  "| Outline | Done |",
  "| Draft | Running |",
  "",
  "Final answer coming next...",
].join("\n");
