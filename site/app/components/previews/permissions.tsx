"use client";

import React, { useState } from "react";
import { Button, Stack } from "@mantine/core";
import {
  AddPermissionRuleWizard,
  PermissionModeSelector,
  PermissionRuleInput,
  PermissionRulesPanel,
  type PermissionDenial,
  type PermissionMode,
  type PermissionRule,
  type WorkspaceDirectory,
} from "@sinups/ai-kit";
import { NarrowFrame, ResultBlock, WideFrame, wait } from "./frames";

const TOOLS = ["Bash", "Read", "Edit", "Write", "Glob", "Grep", "WebFetch", "mcp__git__create_issue"];

const RULES: PermissionRule[] = [
  { id: "allow-test", behavior: "allow", toolName: "Bash", specifier: "npm run test:*", scope: "project", source: ".agent/settings.json" },
  { id: "allow-read-src", behavior: "allow", toolName: "Read", specifier: "src/**", scope: "local", source: ".agent/settings.local.json" },
  { id: "allow-git", behavior: "allow", toolName: "mcp__git", scope: "user", source: "~/.agent/settings.json" },
  { id: "ask-push", behavior: "ask", toolName: "Bash", specifier: "git push:*", scope: "project", source: ".agent/settings.json" },
  { id: "deny-env", behavior: "deny", toolName: "Read", specifier: ".env*", scope: "policy", source: "managed-settings.json" },
  { id: "deny-rm", behavior: "deny", toolName: "Bash", specifier: "rm -rf *", scope: "user", source: "~/.agent/settings.json" },
];

const DENIALS: PermissionDenial[] = [
  { id: "denial-build", toolName: "Bash", input: "npm run build -- --mode production", reason: "No rule allows this command", at: "2026-09-17T09:42:00Z" },
  { id: "denial-fetch", toolName: "WebFetch", input: "https://registry.npmjs.org/@mantine/core", reason: "Rejected by the user", at: "2026-09-17T09:31:00Z" },
];

const DIRECTORIES: WorkspaceDirectory[] = [
  { path: "/Users/me/projects/api", scope: "project" },
  { path: "/opt/company/templates", scope: "policy" },
];

function RulesPanelPreview({ narrow = false }: { narrow?: boolean }) {
  const [rules, setRules] = useState(RULES);
  const [directories, setDirectories] = useState(DIRECTORIES);
  const panel = (
    <div className="p-3">
      <PermissionRulesPanel
        rules={rules}
        denials={DENIALS}
        directories={directories}
        knownTools={TOOLS}
        onSaveRule={async (rule, mode) => {
          await wait(400);
          setRules((prev) => (mode === "edit" ? prev.map((item) => (item.id === rule.id ? rule : item)) : [...prev, rule]));
        }}
        onDeleteRule={(rule) => setRules((prev) => prev.filter((item) => item.id !== rule.id))}
        onMoveRule={(rule, scope) =>
          setRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, scope } : item)))
        }
        onAddDirectory={async (directory) => {
          await wait(300);
          setDirectories((prev) => [...prev, directory]);
        }}
        onRemoveDirectory={(directory) => setDirectories((prev) => prev.filter((item) => item.path !== directory.path))}
      />
    </div>
  );
  return narrow ? <NarrowFrame>{panel}</NarrowFrame> : <WideFrame>{panel}</WideFrame>;
}

function RuleWizardPreview({ initialRule }: { initialRule?: Partial<PermissionRule> }) {
  const [opened, setOpened] = useState(false);
  const [rule, setRule] = useState<PermissionRule | null>(null);
  return (
    <div className="flex w-full flex-col items-center">
      <Button onClick={() => setOpened(true)}>{initialRule ? "Allow this command" : "Add rule"}</Button>
      <ResultBlock value={rule} />
      <AddPermissionRuleWizard
        opened={opened}
        onClose={() => setOpened(false)}
        initialRule={initialRule}
        knownTools={TOOLS}
        onSubmit={async (next) => {
          await wait(400);
          setRule(next);
        }}
      />
    </div>
  );
}

function RuleInputPreview() {
  const [valid, setValid] = useState("Bash(npm run test:*)");
  const [deny, setDeny] = useState("Read(.env*)");
  const [unknown, setUnknown] = useState("Bsh(ls)");
  const [invalid, setInvalid] = useState("Bash(npm run");
  return (
    <NarrowFrame className="p-4">
      <Stack gap="lg">
        <PermissionRuleInput label="Allow rule" value={valid} onChange={setValid} knownTools={TOOLS} />
        <PermissionRuleInput label="Deny rule" behavior="deny" value={deny} onChange={setDeny} knownTools={TOOLS} />
        <PermissionRuleInput label="Unknown tool" value={unknown} onChange={setUnknown} knownTools={TOOLS} />
        <PermissionRuleInput label="Invalid" value={invalid} onChange={setInvalid} knownTools={TOOLS} forceValidation />
      </Stack>
    </NarrowFrame>
  );
}

function ModeSelectorPreview({ variant }: { variant: "segmented" | "select" }) {
  const [mode, setMode] = useState<PermissionMode>("default");
  const selector = (
    <div className="p-4">
      <PermissionModeSelector value={mode} onChange={setMode} variant={variant} />
    </div>
  );
  return variant === "select" ? <NarrowFrame>{selector}</NarrowFrame> : <WideFrame>{selector}</WideFrame>;
}

export function renderPermissionsPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "PermissionRulesPanel":
    case "PermissionRulesPanel/wide":
      return <RulesPanelPreview />;
    case "PermissionRulesPanel/narrow":
      return <RulesPanelPreview narrow />;
    case "AddPermissionRuleWizard":
    case "AddPermissionRuleWizard/add":
      return <RuleWizardPreview />;
    case "AddPermissionRuleWizard/from-denial":
      return <RuleWizardPreview initialRule={{ behavior: "allow", toolName: "Bash", specifier: "npm run build:*" }} />;
    case "PermissionRuleInput":
    case "PermissionRuleInput/states":
      return <RuleInputPreview />;
    case "PermissionModeSelector":
    case "PermissionModeSelector/segmented":
      return <ModeSelectorPreview variant="segmented" />;
    case "PermissionModeSelector/select":
      return <ModeSelectorPreview variant="select" />;
    default:
      return undefined;
  }
}
