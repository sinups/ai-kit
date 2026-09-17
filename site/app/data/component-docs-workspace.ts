import type { ComponentDoc } from "@/app/data/component-docs";

export const SETTINGS_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "ModelSettingsPanel",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { ModelSettingsPanel, type EffortLevelValue, type UsagePeriod } from "@sinups/ai-kit";

export function ModelSettings() {
  const [model, setModel] = useState("qwen-2.5-coder-32b");
  const [effort, setEffort] = useState<EffortLevelValue>("high");
  const [style, setStyle] = useState("default");
  const [period, setPeriod] = useState<UsagePeriod>("week");

  return (
    <div style={{ height: 600 }}>
      <ModelSettingsPanel
        models={[{ id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder", version: "32B" }, { id: "llama-3.3-70b", name: "Llama 3.3", version: "70B" }]}
        model={model}
        onModelChange={setModel}
        effort={{ value: effort, onChange: setEffort }}
        outputStyle={{ styles: outputStyles, value: style, onChange: setStyle }}
        usage={{ period, onPeriodChange: setPeriod, withoutTitle: true, summary, limits }}
        status={{ withoutTitle: true, version: "2.1.4", model: "Qwen 2.5 Coder 32B", mcpServers }}
      />
    </div>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Assemble a model settings screen in `SettingsLayout`: Model (model select and `EffortSelector`), Output style (`OutputStylePicker`), Usage (`UsagePanel`) and Status (`StatusPanel`). A section appears only when its prop is passed, so the same panel works for a model picker alone or a full settings page. The active section can be controlled with `activeSection` and `onActiveSectionChange`. Navigation sits beside the content when wide and turns into a section picker in a narrow widget.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "ModelSettingsPanel/wide",
        code: `<ModelSettingsPanel
  models={models}
  model={model}
  onModelChange={setModel}
  effort={{ value: effort, onChange: setEffort, thinking, onThinkingChange: setThinking }}
  outputStyle={{ styles: outputStyles, value: style, onChange: setStyle }}
  usage={{ period, onPeriodChange: setPeriod, withoutTitle: true, summary, limits, models: modelUsage, daily }}
  status={{ withoutTitle: true, version: "2.1.4", model: "Qwen 2.5 Coder 32B", mcpServers, context }}
/>`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "ModelSettingsPanel/narrow",
        code: `<div style={{ width: 360, height: 600 }}>
  <ModelSettingsPanel models={models} model={model} onModelChange={setModel} effort={effortProps} usage={usageProps} />
</div>`,
      },
    ],
  },
  {
    name: "EffortSelector",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { EffortSelector, type EffortLevelValue } from "@sinups/ai-kit";

export function Example() {
  const [effort, setEffort] = useState<EffortLevelValue>("high");
  const [thinking, setThinking] = useState(true);
  return (
    <EffortSelector value={effort} onChange={setEffort} thinking={thinking} onThinkingChange={setThinking} />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Pick the reasoning effort: Low, Medium, High or Max by default, or your own `levels`. The selected level's description is shown under the control. It is a segmented control from `breakpoint` (380px of its own width) and a select when narrower; `variant=\"inline\"` renders a compact menu button for a composer toolbar. Pass `thinking` together with `onThinkingChange` to add an extended thinking switch.",
      },
      {
        type: "example",
        title: "Wide and narrow",
        previewId: "EffortSelector/default",
        code: `<EffortSelector value={effort} onChange={setEffort} thinking={thinking} onThinkingChange={setThinking} />`,
      },
      {
        type: "example",
        title: "Inline in a toolbar",
        previewId: "EffortSelector/inline",
        code: `<EffortSelector variant="inline" value={effort} onChange={setEffort} thinking={thinking} onThinkingChange={setThinking} />`,
      },
    ],
  },
  {
    name: "OutputStylePicker",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { OutputStylePicker, type OutputStyle } from "@sinups/ai-kit";

const styles: OutputStyle[] = [
  { id: "default", name: "Default", description: "Concise answers focused on the task", example: "Fixed the retry in client.ts." },
  { id: "explanatory", name: "Explanatory", description: "Explains the trade-offs behind each change" },
];

export function Example() {
  const [style, setStyle] = useState<string | null>("default");
  return <OutputStylePicker styles={styles} value={style} onChange={setStyle} label="Output style" />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Choose how the agent writes its answers. Each style is a radio card with its name, description and an optional sample answer; cards form one to three columns depending on the component width. `withoutExamples` keeps the cards short.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "OutputStylePicker/wide",
        code: `<OutputStylePicker styles={outputStyles} value={style} onChange={setStyle} label="Output style" description="How the agent writes its answers" />`,
      },
      {
        type: "example",
        title: "Narrow without examples",
        previewId: "OutputStylePicker/narrow",
        code: `<OutputStylePicker styles={outputStyles} value={style} onChange={setStyle} withoutExamples />`,
      },
    ],
  },
  {
    name: "UsagePanel",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { UsagePanel, type UsagePeriod } from "@sinups/ai-kit";

export function Example() {
  const [period, setPeriod] = useState<UsagePeriod>("week");
  return (
    <UsagePanel
      period={period}
      onPeriodChange={setPeriod}
      summary={{ tokens: 6_200_000, cost: 67.54, requests: 1_284 }}
      limits={[{ id: "weekly", label: "Weekly limit", used: 6_200_000, limit: 10_000_000, resetsAt: nextReset }]}
      models={[{ model: "Qwen 2.5 Coder 32B", tokens: 4_120_000, cost: 61.8 }]}
      daily={dailyUsage}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show token and cost usage for a day, week or month: period totals, plan limits with progress bars and reset countdowns, usage split by model and usage per day. Limit bars turn yellow at `warnAt` (75%) and red at `dangerAt` (90%). The period switch appears only with `onPeriodChange`. Handles `loading` with skeletons and `error` with an optional retry.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "UsagePanel/wide",
        code: `<UsagePanel period={period} onPeriodChange={setPeriod} summary={summary} limits={limits} models={modelUsage} daily={daily} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "UsagePanel/narrow",
        code: `<div style={{ width: 360 }}>
  <UsagePanel period={period} onPeriodChange={setPeriod} summary={summary} limits={limits} models={modelUsage} daily={daily} />
</div>`,
      },
      {
        type: "example",
        title: "Loading and error",
        previewId: "UsagePanel/states",
        code: `<>
  <UsagePanel period="week" loading />
  <UsagePanel period="week" error="Could not load usage for this period" onRetry={reload} />
</>`,
      },
    ],
  },
  {
    name: "StatusPanel",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { StatusPanel } from "@sinups/ai-kit";

export function Example() {
  return (
    <StatusPanel
      version="2.1.4"
      model="Qwen 2.5 Coder 32B"
      account={{ email: "dev@example.com", plan: "Max" }}
      cwd="/Users/dev/projects/acme-web"
      mcpServers={[{ name: "git", status: "success" }, { name: "errors", status: "error" }]}
      memoryFiles={[{ path: "AGENTS.md", tokens: 2_400 }]}
      context={{ used: 142_000, total: 200_000 }}
      actions={[{ label: "Run doctor", onClick: runDoctor }]}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Summarize the agent environment, like a `/status` command: version, model, account and organization, working directory, MCP servers counted by status, loaded memory files and context window usage with `ContextUsage`. Add rows with `items` and buttons with `actions`; an action that returns a promise shows a loader until it settles.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "StatusPanel/wide",
        code: `<StatusPanel version="2.1.4" model="Qwen 2.5 Coder 32B" account={account} organization="Acme" cwd={cwd} mcpServers={mcpServers} memoryFiles={memoryFiles} context={context} actions={actions} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "StatusPanel/narrow",
        code: `<div style={{ width: 360 }}>
  <StatusPanel version="2.1.4" model="Qwen 2.5 Coder 32B" cwd={cwd} mcpServers={mcpServers} context={context} />
</div>`,
      },
    ],
  },
];

export const TASKS_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "BackgroundTasksPanel",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { BackgroundTasksPanel, type BackgroundTask } from "@sinups/ai-kit";

export function Tasks({ tasks }: { tasks: BackgroundTask[] }) {
  return (
    <div style={{ height: 600 }}>
      <BackgroundTasksPanel
        tasks={tasks}
        onStop={(task) => runner.stop(task.id)}
        onRetry={(task) => runner.retry(task.id)}
        onRemove={(task) => runner.remove(task.id)}
      />
    </div>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Monitor background work of an agent session: shell commands, subagents, remote jobs and workflows. `TaskList` and `TaskDetail` sit side by side in `MasterDetail` from 720px of width; narrower, the detail replaces the list with a back action. The selected task can be a subtask, controlled with `selectedId` or uncontrolled with `defaultSelectedId`. `BackgroundTasksDrawer` opens the same panel in a drawer that slides from the bottom on small screens, usually from a `TaskStatusPill`.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "BackgroundTasksPanel/wide",
        code: `<BackgroundTasksPanel tasks={tasks} onStop={stop} onRetry={retry} onRemove={remove} defaultSelectedId="review-agent" />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "BackgroundTasksPanel/narrow",
        code: `<div style={{ width: 360, height: 600 }}>
  <BackgroundTasksPanel tasks={tasks} onStop={stop} onRetry={retry} onRemove={remove} />
</div>`,
      },
      {
        type: "example",
        title: "Drawer from a status pill",
        previewId: "BackgroundTasksPanel/drawer",
        code: `<>
  <TaskStatusPill tasks={flattenTaskTree(tasks)} onOpen={open} />
  <BackgroundTasksDrawer opened={opened} onClose={close} tasks={tasks} onStop={stop} onRetry={retry} onRemove={remove} />
</>`,
      },
    ],
  },
  {
    name: "TaskList",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { TaskList } from "@sinups/ai-kit";

export function Example() {
  return (
    <TaskList
      tasks={tasks}
      selectedId={selectedId}
      onSelect={(task) => setSelectedId(task.id)}
      onStop={stop}
      onRetry={retry}
      onRemove={remove}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "List background tasks grouped into Running, Queued and Finished, with kind icon, status, live elapsed time, last activity, progress and subtask count. Search and a kind filter (shown when tasks have more than one kind) narrow the list. Stop, Retry and Remove appear only when their callbacks are set and the task status allows them. Handles loading, error and empty states.",
      },
      {
        type: "example",
        title: "Tasks",
        previewId: "TaskList/basic",
        code: `<TaskList tasks={tasks} selectedId={selectedId} onSelect={select} onStop={stop} onRetry={retry} onRemove={remove} />`,
      },
      {
        type: "example",
        title: "Loading, error and empty",
        previewId: "TaskList/states",
        code: `<>
  <TaskList tasks={[]} loading />
  <TaskList tasks={[]} error="Could not reach the task runner" onRetryLoad={reload} />
  <TaskList tasks={[]} />
</>`,
      },
    ],
  },
  {
    name: "TaskDetail",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { TaskDetail } from "@sinups/ai-kit";

export function Example() {
  return (
    <TaskDetail
      task={task}
      onStop={stop}
      onRetry={retry}
      onSelectSubtask={(subtask) => setSelectedId(subtask.id)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show one background task: header with kind, status, elapsed time, tokens and tool uses, progress, the failure message, and tabs for the output log and subtasks. The log follows new output while scrolled to the bottom, offers a jump to the latest line otherwise, and can be copied. Stop is shown for queued and running tasks, Retry for failed and cancelled ones.",
      },
      {
        type: "example",
        title: "Running agent",
        previewId: "TaskDetail/running",
        code: `<TaskDetail task={reviewAgent} onStop={stop} onSelectSubtask={select} outputHeight={220} />`,
      },
      {
        type: "example",
        title: "Failed task",
        previewId: "TaskDetail/failed",
        code: `<TaskDetail task={migration} onRetry={retry} outputHeight={220} />`,
      },
    ],
  },
  {
    name: "AgentTree",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { AgentTree } from "@sinups/ai-kit";

export function Example() {
  return <AgentTree tasks={[reviewAgent]} selectedId={selectedId} onSelect={(task) => setSelectedId(task.id)} />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show an agent and the subagents and commands it started as a tree, with status, last activity and live elapsed time on every node. Nodes with children can be collapsed; all are expanded by default unless listed in `defaultCollapsedIds`. Build the nested structure from a flat list with `buildTaskTree`.",
      },
      {
        type: "example",
        title: "Agent with subagents",
        previewId: "AgentTree/basic",
        code: `<AgentTree tasks={[reviewAgent]} selectedId={selectedId} onSelect={select} />`,
      },
    ],
  },
  {
    name: "TaskStatusPill",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { TaskStatusPill, flattenTaskTree } from "@sinups/ai-kit";

export function Example() {
  return <TaskStatusPill tasks={flattenTaskTree(tasks)} onOpen={openTasks} />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Summarize background tasks in a status bar or header, for example `2 running · 1 failed`. Pass `flattenTaskTree(tasks)` to count subtasks too, or a precomputed `summary`. The pill is blue while tasks run or wait and neutral otherwise; only the failed count is colored as an error. With `onOpen` the pill is a button, typically opening `BackgroundTasksDrawer`. It renders nothing without tasks unless `showWhenEmpty` is set.",
      },
      {
        type: "example",
        title: "States",
        previewId: "TaskStatusPill/basic",
        code: `<>
  <TaskStatusPill tasks={flattenTaskTree(tasks)} onOpen={openTasks} />
  <TaskStatusPill summary={{ total: 3, queued: 0, running: 0, completed: 3, failed: 0, cancelled: 0 }} />
  <TaskStatusPill tasks={[]} showWhenEmpty />
</>`,
      },
    ],
  },
];

export const DIFF_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "DiffReview",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { DiffReview, type FileChange, type FileDecision } from "@sinups/ai-kit";

export function Review({ changes }: { changes: FileChange[] }) {
  const [decisions, setDecisions] = useState<Record<string, FileDecision>>({});
  return (
    <div style={{ height: 640 }}>
      <DiffReview
        changes={changes}
        decisions={decisions}
        onAccept={async (change) => {
          await agent.applyFile(change.path);
          setDecisions((current) => ({ ...current, [change.path]: "accepted" }));
        }}
        onReject={async (change) => {
          await agent.revertFile(change.path);
          setDecisions((current) => ({ ...current, [change.path]: "rejected" }));
        }}
        onAcceptAll={() => agent.applyAll()}
      />
    </div>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Review the files an agent changed before applying them. `DiffFileList` and `DiffFileView` sit side by side in `MasterDetail` from 900px of width; narrower, the diff replaces the list. Move between files with Previous/Next or `j`/`k` while focus is inside the review, mark files as viewed with a progress count, and accept or reject each file or all of them; the buttons appear only for the callbacks you pass and show pending state. `DiffReviewModal` shows the same review in a modal that fills small screens.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "DiffReview/wide",
        code: `<DiffReview
  breakpoint={720}
  changes={changes} decisions={decisions} onAccept={accept} onReject={reject} onAcceptAll={acceptAll} onRejectAll={rejectAll} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "DiffReview/narrow",
        code: `<div style={{ width: 360, height: 640 }}>
  <DiffReview changes={changes} decisions={decisions} onAccept={accept} onReject={reject} />
</div>`,
      },
      {
        type: "example",
        title: "Read-only, split view",
        previewId: "DiffReview/read-only",
        code: `<DiffReview changes={changes} defaultViewedPaths={[changes[0].path]} defaultMode="split" breakpoint={720} />`,
      },
      {
        type: "example",
        title: "Modal",
        previewId: "DiffReview/modal",
        code: `<DiffReviewModal opened={opened} onClose={close} changes={changes} decisions={decisions} onAccept={accept} onReject={reject} />`,
      },
    ],
  },
  {
    name: "DiffFileList",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { DiffFileList } from "@sinups/ai-kit";

export function Example() {
  return (
    <DiffFileList
      changes={changes}
      selectedPath={selectedPath}
      onSelect={(change) => setSelectedPath(change.path)}
      viewedPaths={viewedPaths}
      decisions={decisions}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "List changed files with their status (added, modified, deleted, renamed), added and removed line counts, a viewed check and the accept or reject decision. Switch between a flat list and a folder tree, search by path and filter by status. Handles loading and error states.",
      },
      {
        type: "example",
        title: "List",
        previewId: "DiffFileList/list",
        code: `<DiffFileList changes={changes} selectedPath={selectedPath} onSelect={select} viewedPaths={viewedPaths} decisions={decisions} />`,
      },
      {
        type: "example",
        title: "Folder tree",
        previewId: "DiffFileList/tree",
        code: `<DiffFileList changes={changes} view={view} onViewChange={setView} selectedPath={selectedPath} onSelect={select} />`,
      },
    ],
  },
  {
    name: "DiffFileView",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { DiffFileView } from "@sinups/ai-kit";

export function Example() {
  return (
    <DiffFileView
      change={{
        path: "src/invoice.ts",
        status: "modified",
        oldContent: previousSource,
        newContent: nextSource,
      }}
      defaultMode="unified"
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show the diff of one file as unified or split rows with word-level highlights of what changed inside a line. Unchanged runs longer than `contextLines` collapse and expand on click. The split layout is available from `splitMinWidth` (720px of width). Binary, deleted, empty and renamed-without-changes files get dedicated states. `headerActions` adds controls to the header, for example a Viewed checkbox.",
      },
      {
        type: "example",
        title: "Unified and split",
        previewId: "DiffFileView/wide",
        code: `<DiffFileView change={invoiceChange} headerActions={viewedCheckbox} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "DiffFileView/narrow",
        code: `<div style={{ width: 360 }}>
  <DiffFileView change={typesChange} />
</div>`,
      },
      {
        type: "example",
        title: "Deleted, renamed and binary files",
        previewId: "DiffFileView/stubs",
        code: `<>
  <DiffFileView change={deletedChange} />
  <DiffFileView change={renamedChange} />
  <DiffFileView change={binaryChange} />
</>`,
      },
    ],
  },
];
