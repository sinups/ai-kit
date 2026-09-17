"use client";

import React, { useState } from "react";
import { Button } from "@mantine/core";
import { HookWizard, HooksPanel, type HookConfig } from "@sinups/ai-kit";
import { NarrowFrame, ResultBlock, WideFrame, wait } from "./frames";

const TOOLS = ["Bash", "Read", "Write", "Edit", "MultiEdit", "Glob", "Grep", "WebFetch", "Task"];

const HOOKS: HookConfig[] = [
  {
    id: "format-on-write",
    event: "PostToolUse",
    matcher: "Edit|Write|MultiEdit",
    type: "command",
    command: 'npx prettier --write "$AGENT_FILE_PATHS"',
    timeout: 30,
    scope: "project",
  },
  {
    id: "block-rm",
    event: "PreToolUse",
    matcher: "Bash",
    type: "command",
    command: "node .agent/hooks/block-dangerous-commands.mjs",
    scope: "project",
  },
  {
    id: "review-web",
    event: "PreToolUse",
    matcher: "WebFetch",
    type: "prompt",
    prompt: "Allow the fetch only when the domain is on the company allowlist.",
    scope: "user",
    enabled: false,
  },
  {
    id: "git-context",
    event: "SessionStart",
    type: "command",
    command: "git status --short && git log --oneline -5",
    timeout: 10,
    scope: "local",
  },
];

function HooksPanelPreview({ narrow = false }: { narrow?: boolean }) {
  const [hooks, setHooks] = useState(HOOKS);
  const panel = (
    <div className="p-3">
      <HooksPanel
        hooks={hooks}
        knownTools={TOOLS}
        onSave={async (hook, mode) => {
          await wait(400);
          setHooks((prev) => (mode === "edit" ? prev.map((item) => (item.id === hook.id ? hook : item)) : [...prev, hook]));
        }}
        onDelete={(hook) => setHooks((prev) => prev.filter((item) => item.id !== hook.id))}
        onToggle={(hook, enabled) =>
          setHooks((prev) => prev.map((item) => (item.id === hook.id ? { ...item, enabled } : item)))
        }
      />
    </div>
  );
  return narrow ? <NarrowFrame>{panel}</NarrowFrame> : <WideFrame>{panel}</WideFrame>;
}

function HookWizardPreview({ initialHook }: { initialHook?: HookConfig }) {
  const [opened, setOpened] = useState(false);
  const [result, setResult] = useState<HookConfig | null>(null);
  return (
    <div className="flex w-full flex-col items-center">
      <Button onClick={() => setOpened(true)}>{initialHook ? "Edit hook" : "Add hook"}</Button>
      <ResultBlock value={result} />
      <HookWizard
        opened={opened}
        onClose={() => setOpened(false)}
        initialHook={initialHook}
        knownTools={TOOLS}
        onSubmit={async (hook) => {
          await wait(400);
          setResult(hook);
        }}
      />
    </div>
  );
}

export function renderHooksPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "HooksPanel":
    case "HooksPanel/wide":
      return <HooksPanelPreview />;
    case "HooksPanel/narrow":
      return <HooksPanelPreview narrow />;
    case "HookWizard":
    case "HookWizard/add":
      return <HookWizardPreview />;
    case "HookWizard/edit":
      return <HookWizardPreview initialHook={HOOKS[0]} />;
    default:
      return undefined;
  }
}
