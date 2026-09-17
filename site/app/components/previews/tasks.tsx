"use client";

import React, { useEffect, useState } from "react";
import { Group, Text } from "@mantine/core";
import {
  AgentTree,
  BackgroundTasksDrawer,
  BackgroundTasksPanel,
  TaskDetail,
  TaskList,
  TaskStatusPill,
  flattenTaskTree,
  type BackgroundTask,
} from "@sinups/ai-kit";
import { NarrowFrame, WideFrame, wait } from "./frames";

const MINUTE = 60_000;

export function createTasks(now = Date.now()): BackgroundTask[] {
  return [
    {
      id: "review-agent",
      kind: "agent",
      title: "Review pull request #482",
      description: "Reads the diff, runs the test suite and drafts review comments.",
      status: "running",
      startedAt: now - 4 * MINUTE - 12_000,
      tokens: 48_230,
      toolUses: 37,
      lastActivity: "Reading src/billing/invoice.ts",
      progress: { value: 5, max: 8, label: "5 of 8 files" },
      output: [
        "▶ Fetching pull request #482",
        "  12 files changed, +340 −128",
        "▶ Spawning subagents: tests, security",
        "▶ Reading src/billing/invoice.ts",
        "  Found 3 functions without tests",
      ].join("\n"),
      children: [
        {
          id: "tests-agent",
          kind: "agent",
          title: "Run affected tests",
          status: "running",
          startedAt: now - 3 * MINUTE,
          tokens: 9_120,
          toolUses: 11,
          lastActivity: "yarn jest src/billing --coverage",
          output: "PASS src/billing/tax.test.ts\nRUNS src/billing/invoice.test.ts",
          children: [
            {
              id: "tests-shell",
              kind: "shell",
              title: "yarn jest src/billing",
              status: "running",
              startedAt: now - 2 * MINUTE - 5_000,
              lastActivity: "RUNS src/billing/invoice.test.ts",
              output: "PASS src/billing/tax.test.ts (2.1 s)\nRUNS src/billing/invoice.test.ts",
            },
          ],
        },
        {
          id: "security-agent",
          kind: "agent",
          title: "Security scan",
          status: "completed",
          startedAt: now - 3 * MINUTE,
          endedAt: now - MINUTE - 20_000,
          tokens: 12_400,
          toolUses: 8,
          lastActivity: "No secrets or injection risks found",
          output: "Checked 12 files\nNo findings",
        },
      ],
    },
    {
      id: "dev-server",
      kind: "shell",
      title: "yarn dev",
      description: "Local development server on port 3000",
      status: "running",
      startedAt: now - 42 * MINUTE,
      lastActivity: "GET /api/invoices 200 in 38ms",
      output: Array.from(
        { length: 40 },
        (_, index) => `[${String(index).padStart(2, "0")}] GET /api/invoices 200 in ${30 + (index % 17)}ms`,
      ).join("\n"),
    },
    {
      id: "deploy",
      kind: "workflow",
      title: "Deploy preview",
      status: "queued",
      lastActivity: "Waiting for the review to finish",
    },
    {
      id: "migration",
      kind: "remote",
      title: "Backfill invoice totals",
      description: "Runs on the staging worker pool",
      status: "failed",
      startedAt: now - 18 * MINUTE,
      endedAt: now - 15 * MINUTE,
      lastActivity: "Batch 14 of 40 failed",
      progress: { value: 14, max: 40, label: "14 of 40 batches" },
      error: "Connection to the staging database was reset after 3 attempts",
      output: "Batch 12 ok\nBatch 13 ok\nBatch 14: ECONNRESET\nRetrying (1/3)\nRetrying (2/3)\nRetrying (3/3)",
    },
    {
      id: "lint",
      kind: "shell",
      title: "yarn lint --fix",
      status: "completed",
      startedAt: now - 25 * MINUTE,
      endedAt: now - 24 * MINUTE - 38_000,
      lastActivity: "Fixed 4 problems in 3 files",
      output: "src/app.tsx\n  4:10  fixed  no-unused-vars\nDone in 22.4s",
    },
  ];
}

const LOG_LINES = [
  "GET /api/invoices 200 in 41ms",
  "POST /api/invoices/draft 201 in 88ms",
  "compiled client and server successfully in 1.2s",
];

function mapTask(
  tasks: BackgroundTask[],
  id: string,
  update: (task: BackgroundTask) => BackgroundTask,
): BackgroundTask[] {
  return tasks.map((task) => {
    if (task.id === id) return update(task);
    return task.children ? { ...task, children: mapTask(task.children, id, update) } : task;
  });
}

function useSimulatedTasks() {
  const [tasks, setTasks] = useState(() => createTasks());

  useEffect(() => {
    let tick = 0;
    const id = window.setInterval(() => {
      tick += 1;
      const line = LOG_LINES[tick % LOG_LINES.length];
      setTasks((current) =>
        mapTask(
          mapTask(current, "dev-server", (task) => ({
            ...task,
            lastActivity: line,
            output: `${task.output ?? ""}\n${line}`,
          })),
          "review-agent",
          (task) => ({ ...task, tokens: (task.tokens ?? 0) + 420 }),
        ),
      );
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  const stop = async (target: BackgroundTask) => {
    await wait(600);
    setTasks((current) =>
      mapTask(current, target.id, (task) => ({
        ...task,
        status: "cancelled",
        endedAt: Date.now(),
        lastActivity: "Stopped by the user",
      })),
    );
  };

  const retry = async (target: BackgroundTask) => {
    await wait(600);
    setTasks((current) =>
      mapTask(current, target.id, (task) => ({
        ...task,
        status: "running",
        startedAt: Date.now(),
        endedAt: undefined,
        error: undefined,
        lastActivity: "Restarted",
      })),
    );
  };

  const remove = (target: BackgroundTask) => {
    setTasks((current) => current.filter((task) => task.id !== target.id));
  };

  return { tasks, stop, retry, remove };
}

function BackgroundTasksPanelPreview({ narrow = false }: { narrow?: boolean }) {
  const { tasks, stop, retry, remove } = useSimulatedTasks();
  const panel = (
    <BackgroundTasksPanel
      tasks={tasks}
      onStop={stop}
      onRetryTask={retry}
      onRemove={remove}
      defaultSelectedId={narrow ? null : "review-agent"}
    />
  );
  return narrow ? <NarrowFrame height={600}>{panel}</NarrowFrame> : <WideFrame height={600}>{panel}</WideFrame>;
}

function BackgroundTasksDrawerPreview() {
  const { tasks, stop, retry, remove } = useSimulatedTasks();
  const [opened, setOpened] = useState(false);
  return (
    <WideFrame className="px-3 py-2">
      <Group justify="space-between" wrap="nowrap">
        <Text size="xs" c="dimmed">
          llama-3.3-70b · feat/invoices
        </Text>
        <TaskStatusPill tasks={flattenTaskTree(tasks)} onOpen={() => setOpened(true)} />
      </Group>
      <BackgroundTasksDrawer
        opened={opened}
        onClose={() => setOpened(false)}
        tasks={tasks}
        onStop={stop}
        onRetryTask={retry}
        onRemove={remove}
      />
    </WideFrame>
  );
}

function TaskListPreview() {
  const { tasks, stop, retry, remove } = useSimulatedTasks();
  const [selectedId, setSelectedId] = useState<string | null>("review-agent");
  return (
    <NarrowFrame className="p-3">
      <TaskList
        tasks={tasks}
        selectedId={selectedId}
        onSelect={(task) => setSelectedId(task.id)}
        onStop={stop}
        onRetryTask={retry}
        onRemove={remove}
      />
    </NarrowFrame>
  );
}

function TaskListStatesPreview() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-border p-3">
        <TaskList tasks={[]} loading />
      </div>
      <div className="rounded-lg border border-border p-3">
        <TaskList tasks={[]} error="Could not reach the task runner" onRetry={() => {}} />
      </div>
      <div className="rounded-lg border border-border p-3">
        <TaskList tasks={[]} />
      </div>
    </div>
  );
}

function TaskDetailPreview({ failed = false }: { failed?: boolean }) {
  const { tasks, stop, retry } = useSimulatedTasks();
  const [taskId, setTaskId] = useState(failed ? "migration" : "review-agent");
  const task = flattenTaskTree(tasks).find((item) => item.id === taskId) ?? tasks[0];
  return (
    <WideFrame className="p-4">
      <TaskDetail
        task={task}
        onStop={stop}
        onRetryTask={retry}
        onSelectSubtask={(subtask) => setTaskId(subtask.id)}
        outputHeight={220}
      />
    </WideFrame>
  );
}

function AgentTreePreview() {
  const { tasks } = useSimulatedTasks();
  const [selectedId, setSelectedId] = useState<string | null>("tests-agent");
  return (
    <NarrowFrame className="p-3">
      <AgentTree tasks={tasks.slice(0, 1)} selectedId={selectedId} onSelect={(task) => setSelectedId(task.id)} />
    </NarrowFrame>
  );
}

function TaskStatusPillPreview() {
  const { tasks } = useSimulatedTasks();
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <TaskStatusPill tasks={flattenTaskTree(tasks)} onOpen={() => {}} />
      <TaskStatusPill summary={{ total: 3, queued: 0, running: 0, completed: 3, failed: 0, cancelled: 0 }} />
      <TaskStatusPill tasks={[]} showWhenEmpty />
    </div>
  );
}

export function renderTasksPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "BackgroundTasksPanel":
    case "BackgroundTasksPanel/wide":
      return <BackgroundTasksPanelPreview />;
    case "BackgroundTasksPanel/narrow":
      return <BackgroundTasksPanelPreview narrow />;
    case "BackgroundTasksPanel/drawer":
      return <BackgroundTasksDrawerPreview />;
    case "TaskList":
    case "TaskList/basic":
      return <TaskListPreview />;
    case "TaskList/states":
      return <TaskListStatesPreview />;
    case "TaskDetail":
    case "TaskDetail/running":
      return <TaskDetailPreview />;
    case "TaskDetail/failed":
      return <TaskDetailPreview failed />;
    case "AgentTree":
    case "AgentTree/basic":
      return <AgentTreePreview />;
    case "TaskStatusPill":
    case "TaskStatusPill/basic":
      return <TaskStatusPillPreview />;
    default:
      return undefined;
  }
}
