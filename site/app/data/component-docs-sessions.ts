import type { ComponentDoc } from "@/app/data/component-docs";

export const SESSIONS_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "SessionList",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { SessionList } from "@sinups/ai-kit";

export function Example() {
  return (
    <SessionList
      sessions={sessions}
      selectedId={selectedId}
      onSelect={(session) => setSelectedId(session.id)}
      onRename={(session, title) => api.renameSession(session.id, title)}
      onPin={(session, pinned) => api.updateSession(session.id, { pinned })}
      onArchive={(session, archived) => api.updateSession(session.id, { archived })}
      onDelete={(session) => api.deleteSession(session.id)}
      onExport={(session) => setExporting(session)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "List past conversations for a history sidebar or page. Sessions are grouped by date (Pinned, Today, Yesterday, Previous 7 days, Previous 30 days, then by month), searched with fuzzy matching, and filtered into all, pinned or archived from a compact menu button in the header that shows the count. Rename, Pin, Archive, Delete (with confirmation) and Export actions appear only when their callbacks are set. Handles loading, error and empty states. Combine it with `SessionPreview` and `ExportDialog` inside `MasterDetail` for a full history page.",
      },
      {
        type: "example",
        title: "Sidebar",
        previewId: "SessionList/basic",
        code: `<SessionList sessions={sessions} selectedId={selectedId} onSelect={select} onRename={rename} onPin={pin} onArchive={archive} onDelete={remove} />`,
      },
      {
        type: "example",
        title: "Loading, error and empty",
        previewId: "SessionList/states",
        code: `<>
  <SessionList sessions={[]} loading />
  <SessionList sessions={[]} error="Could not load the history" onRetry={reload} />
  <SessionList sessions={[]} />
</>`,
      },
      {
        type: "example",
        title: "History page",
        previewId: "SessionList/history",
        code: `<>
  <MasterDetail
    list={<SessionList sessions={sessions} selectedId={selectedId} onSelect={select} onExport={setExporting} />}
    detail={selected ? <SessionPreview session={selected} messages={messages} onResume={resume} onExport={setExporting} /> : null}
    onBack={clearSelection}
  />
  <ExportDialog opened={exporting !== null} onClose={closeExport} title={exporting?.title} messages={messages} />
</>`,
      },
      {
        type: "example",
        title: "History in a narrow widget",
        previewId: "SessionList/history-narrow",
        code: `<div style={{ width: 360, height: 600 }}>
  <MasterDetail list={sessionList} detail={sessionPreview} onBack={clearSelection} />
</div>`,
      },
    ],
  },
  {
    name: "SessionPreview",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { SessionPreview } from "@sinups/ai-kit";

export function Example() {
  return (
    <SessionPreview
      session={session}
      messages={messages}
      loading={isLoading}
      onResume={(session) => openChat(session.id)}
      onExport={(session) => setExporting(session)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Preview a past conversation before resuming it: the header shows the title, relative time, model, branch, token count and cost when present, followed by the first `maxMessages` messages (6 by default). Resume and Export buttons render only when their callbacks are set; `loading` and `error` replace the messages.",
      },
      {
        type: "example",
        title: "Conversation",
        previewId: "SessionPreview/basic",
        code: `<SessionPreview session={session} messages={messages} onResume={resume} onExport={exportSession} />`,
      },
      {
        type: "example",
        title: "Loading",
        previewId: "SessionPreview/loading",
        code: `<SessionPreview session={session} loading onResume={resume} />`,
      },
    ],
  },
  {
    name: "ExportDialog",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { ExportDialog } from "@sinups/ai-kit";

export function Example() {
  return (
    <ExportDialog
      opened={opened}
      onClose={close}
      title="Add retry to token refresh"
      messages={messages}
      defaultFormat="markdown"
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Export a conversation as Markdown, JSON or plain text. The user chooses the format and whether to include tool calls, thinking and timestamps, sees a live preview, and can copy or download the result. By default the file downloads through a temporary link; pass `onDownload` to save it yourself. The pure `exportConversation` helper is exported for server-side exports.",
      },
      {
        type: "example",
        title: "Export dialog",
        previewId: "ExportDialog/basic",
        code: `<ExportDialog
  opened={opened}
  onClose={close}
  messages={messages}
  title="Add retry to token refresh"
  onDownload={(filename, content, mimeType) => saveFile(filename, content, mimeType)}
/>`,
      },
    ],
  },
];

export const CHAT_ACTIONS_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "MessageActions",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { MessageList } from "@sinups/ai-kit";

export function Example() {
  return (
    <MessageList
      messages={messages}
      status={status}
      commands={[{ name: "review", description: "Review changes in a path" }]}
      messageActions={{
        onEdit: (messageId, text) => resendEdited(messageId, text),
        onRetry: (messageId) => regenerate(messageId),
        onRewind: (messageId) => setRewindTarget(messageId),
        onBranch: (messageId) => branchFrom(messageId),
        onFeedback: (messageId, value, details) => api.sendFeedback(messageId, value, details),
        feedback,
      }}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Add a toolbar under chat messages: copy for every message, edit and rewind for user messages, retry, branch and thumbs up or down for assistant messages. Pass `messageActions` to `MessageList` to get it on every message: edit swaps the message for `EditMessageComposer`, a thumbs down opens `FeedbackForm`, and actions are hidden while the turn is streaming. Async actions show a loader. With `visibility=\"hover\"` (default) the toolbar appears on hover and focus; touch devices always see it. Use `MessageActions` directly in a custom message renderer.",
      },
      {
        type: "example",
        title: "Toolbar",
        previewId: "MessageActions/toolbar",
        code: `<>
  <MessageActions messageRole="user" align="end" text={text} timestamp="10:42 AM" onEdit={edit} onRewind={rewind} />
  <MessageActions messageRole="assistant" text={answer} onRetry={retry} onBranch={branch} onFeedback={sendFeedback} />
</>`,
      },
      {
        type: "example",
        title: "In MessageList",
        previewId: "MessageActions/message-list",
        code: `<>
  <MessageList messages={messages} status="ready" messageActions={actions} commands={commands} />
  <RewindDialog opened={rewindTarget !== null} onClose={closeRewind} messages={messages} defaultMessageId={rewindTarget} onRewind={rewind} />
</>`,
      },
      {
        type: "example",
        title: "Narrow widget",
        previewId: "MessageActions/message-list-narrow",
        code: `<div style={{ width: 360, height: 520 }}>
  <MessageList messages={messages} status="ready" messageActions={actions} commands={commands} />
</div>`,
      },
    ],
  },
  {
    name: "EditMessageComposer",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { EditMessageComposer } from "@sinups/ai-kit";

export function Example() {
  return (
    <EditMessageComposer
      defaultValue={message.text}
      onSubmit={(text) => resendEdited(message.id, text)}
      onCancel={stopEditing}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Edit a sent user message in place. Enter resends the trimmed text, Shift+Enter adds a line and Escape cancels; the composer stays open with a loader until `onSubmit` settles. `MessageList` renders it automatically when `messageActions.onEdit` is set.",
      },
      {
        type: "example",
        title: "Inline edit",
        previewId: "EditMessageComposer/basic",
        code: `<EditMessageComposer defaultValue={text} onSubmit={resend} onCancel={cancel} />`,
      },
    ],
  },
  {
    name: "FeedbackForm",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { FeedbackForm } from "@sinups/ai-kit";

export function Example() {
  return (
    <FeedbackForm
      value="down"
      onSubmit={({ reasons, comment }) => api.sendFeedback(messageId, "down", { reasons, comment })}
      onSkip={() => api.sendFeedback(messageId, "down")}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Collect details for a rating. For `down` the form offers reason chips (Inaccurate, Not helpful, Too slow, Unsafe, Other by default) and a comment, and shows a thank-you note once `onSubmit` resolves; `up` renders only the note. `MessageActions` opens it after a thumbs down.",
      },
      {
        type: "example",
        title: "Thumbs down and up",
        previewId: "FeedbackForm/basic",
        code: `<>
  <FeedbackForm value="down" onSubmit={sendDetails} onSkip={skip} />
  <FeedbackForm value="up" />
</>`,
      },
    ],
  },
  {
    name: "PlanApproval",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { PlanApproval } from "@sinups/ai-kit";

export function Example() {
  return (
    <PlanApproval
      plan={plan}
      decision={decision}
      onApprove={() => agent.approvePlan()}
      onApproveWithEdits={(edits) => agent.approvePlan({ edits })}
      onReject={(feedback) => agent.rejectPlan(feedback)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Review a plan before the agent starts working, for example after plan mode. The Markdown plan is collapsed to `collapsedLines` (8 by default) and expands on demand. Approve, Approve with edits and Reject with feedback show a loader while their promise runs and an error when it rejects; pass `decision` to render the final state instead of the buttons. The plan uses the same shape as `PlanTool`.",
      },
      {
        type: "example",
        title: "Review a plan",
        previewId: "PlanApproval/basic",
        code: `<PlanApproval plan={plan} decision={decision} onApprove={approve} onApproveWithEdits={approveWithEdits} onReject={reject} />`,
      },
      {
        type: "example",
        title: "Failed action",
        previewId: "PlanApproval/rejected",
        code: `<PlanApproval
  plan={plan}
  onApprove={async () => {
    throw new Error("The session has ended, start a new one to continue");
  }}
/>`,
      },
    ],
  },
  {
    name: "RewindDialog",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { RewindDialog } from "@sinups/ai-kit";

export function Example() {
  return (
    <RewindDialog
      opened={opened}
      onClose={close}
      messages={messages}
      defaultMessageId={rewindTarget}
      onRewind={({ messageId, mode }) => agent.rewind(messageId, { restoreCode: mode === "conversation-and-code" })}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Return the conversation to an earlier user message. User messages become rewind points with their time and the number of messages that will be removed; the user chooses whether to restore only the conversation or the conversation and code (`modes`). The dialog closes when `onRewind` resolves and shows the error when it rejects.",
      },
      {
        type: "example",
        title: "Rewind",
        previewId: "RewindDialog/basic",
        code: `<RewindDialog opened={opened} onClose={close} messages={messages} onRewind={rewind} />`,
      },
    ],
  },
  {
    name: "ToolResultNotice",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { ToolResultNotice } from "@sinups/ai-kit";

export function Example() {
  return (
    <ToolResultNotice
      variant="rejected"
      toolName="Edit"
      detail="src/auth/session.ts"
      feedback="Add the retry in the client instead."
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Leave a compact trace of a tool call that did not complete: rejected by the user, cancelled, failed or interrupted. The row names the tool and its subject and expands to the user's feedback, the error output or an explanation.",
      },
      {
        type: "example",
        title: "Variants",
        previewId: "ToolResultNotice/variants",
        code: `<>
  <ToolResultNotice variant="rejected" toolName="Edit" detail="src/auth/session.ts" feedback={feedback} />
  <ToolResultNotice variant="cancelled" toolName="Bash" detail="yarn test --watch" />
  <ToolResultNotice variant="error" toolName="Bash" detail="yarn build" errorText={stderr} />
  <ToolResultNotice variant="interrupted" toolName="git_search" reason="The conversation was stopped." />
</>`,
      },
    ],
  },
  {
    name: "MemoryNotice",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { MemoryNotice } from "@sinups/ai-kit";

export function Example() {
  return (
    <MemoryNotice
      content="Use **yarn**, not npm, in this repository."
      target="AGENTS.md"
      onOpen={() => openFile("AGENTS.md")}
      onUndo={() => api.removeMemory(memoryId)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Tell the user that the agent saved something to memory. The collapsed row previews the first line as plain text, without Markdown markers, and expands to the saved text rendered as Markdown and names where it was saved; Open and Undo buttons appear when their callbacks are set, and the notice switches to the removed state once `onUndo` resolves.",
      },
      {
        type: "example",
        title: "Saved memories",
        previewId: "MemoryNotice/basic",
        code: `<>
  <MemoryNotice content={memory} target="AGENTS.md" onOpen={open} onUndo={undo} />
  <MemoryNotice content="Prefers answers in Russian" />
</>`,
      },
    ],
  },
  {
    name: "CommandChip",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { CommandChip } from "@sinups/ai-kit";

export function Example() {
  return <CommandChip name="review" args="src/auth --staged" description="Review changes in a path" />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show a slash command invocation as a badge followed by its arguments, with the description in a tooltip. Pass `commands` to `MessageList` or `UserMessage` and user messages that start with a known command render this chip automatically.",
      },
      {
        type: "example",
        title: "Sizes",
        previewId: "CommandChip/basic",
        code: `<>
  <CommandChip name="review" args="src/auth --staged" description="Review changes in a path" />
  <CommandChip name="compact" size="xs" />
  <CommandChip name="/model" args="qwen-2.5-coder-32b" size="md" />
</>`,
      },
    ],
  },
];

export const HELP_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "CommandsHelp",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { CommandsHelp } from "@sinups/ai-kit";

export function Example() {
  return (
    <CommandsHelp
      commands={[
        { name: "review", args: "<path>", description: "Review changes in a path", group: "Code" },
        { name: "compact", description: "Summarize the conversation", group: "Session" },
      ]}
      shortcuts={[{ keys: "mod+K", description: "Open the command palette", group: "General" }]}
      onCommandSelect={(command) => insertIntoComposer(\`/\${command.name} \`)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show a reference of slash commands and keyboard shortcuts with fuzzy search and groups. Commands show their arguments and shortcut; with `onCommandSelect` they become clickable, for example to insert the command into the composer. Tabs between commands and shortcuts appear only when `shortcuts` are given. `toPaletteCommands` turns the same commands into `CommandPalette` entries.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "CommandsHelp/wide",
        code: `<CommandsHelp commands={commands} shortcuts={shortcuts} onCommandSelect={insertCommand} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "CommandsHelp/narrow",
        code: `<div style={{ width: 360 }}>
  <CommandsHelp commands={commands} shortcuts={shortcuts} />
</div>`,
      },
      {
        type: "example",
        title: "In the command palette",
        previewId: "CommandsHelp/palette",
        code: `import { useMemo, useState } from "react";
import { CommandPalette, toPaletteCommands } from "@sinups/ai-kit";

export function Example() {
  const [opened, setOpened] = useState(false);
  const paletteCommands = useMemo(() => toPaletteCommands(commands, (command) => runCommand(command)), []);
  return <CommandPalette opened={opened} onClose={() => setOpened(false)} commands={paletteCommands} />;
}`,
      },
    ],
  },
];
