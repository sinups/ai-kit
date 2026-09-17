"use client";

import React, { useState } from "react";
import {
  SkillCatalog,
  SkillDetail,
  SkillEditor,
  SkillPicker,
  SkillsSettingsPanel,
  type Skill,
  type SkillDraft,
} from "@sinups/ai-kit";
import { NarrowFrame, ResultBlock, WideFrame, noop, wait } from "./frames";

const TOOLS = ["Read", "Write", "Edit", "Grep", "Glob", "Bash", "WebFetch", "WebSearch"];

const SKILLS: Skill[] = [
  {
    id: "pdf",
    name: "pdf",
    description: "Extract text and tables from PDF files, fill PDF forms and merge documents. Use when the user works with PDF files.",
    source: "builtin",
    enabled: true,
    version: "1.4.0",
    author: "Agent Kit",
    tags: ["documents", "forms"],
    path: "~/.agent/skills/pdf/SKILL.md",
    allowedTools: ["Read", "Bash"],
    updatedAt: "2026-08-30T10:00:00Z",
    usageCount: 128,
    content:
      "# PDF processing\n\nUse `pdftotext` for plain extraction and `pdfplumber` for tables.\n\n## Filling forms\n\n1. Inspect the fields with `scripts/list_fields.py`.\n2. Write the values to a JSON file.\n3. Run `scripts/fill_form.py input.pdf values.json`.",
  },
  {
    id: "code-review",
    name: "code-review",
    description: "Review a diff for correctness, security and style issues before a pull request is opened.",
    source: "project",
    enabled: true,
    version: "0.3.1",
    tags: ["git", "quality"],
    path: ".agent/skills/code-review/SKILL.md",
    allowedTools: ["Read", "Grep", "Glob"],
    updatedAt: "2026-09-12T08:30:00Z",
    usageCount: 42,
    content: "# Code review\n\nRead the diff first, then open each touched file around the change.",
  },
  {
    id: "release-notes",
    name: "release-notes",
    description: "Draft release notes from merged pull requests grouped by area.",
    source: "user",
    enabled: false,
    author: "sam",
    tags: ["git", "writing"],
    allowedTools: ["Bash"],
    updatedAt: "2026-07-02T15:00:00Z",
    usageCount: 5,
    content: "# Release notes\n\nUse `gh pr list --state merged` and group by label.",
  },
  {
    id: "figma-tokens",
    name: "figma-tokens",
    description: "Sync design tokens from a Figma library into CSS variables.",
    source: "plugin",
    enabled: true,
    version: "2.0.0",
    author: "Design Tools",
    tags: ["design"],
    allowedTools: ["WebFetch", "Write"],
    usageCount: 17,
  },
  {
    id: "incident-runbook",
    name: "incident-runbook",
    description: "Follow the on-call runbook: gather logs, open an incident channel and post status updates.",
    source: "remote",
    enabled: false,
    version: "5",
    tags: ["ops"],
    allowedTools: ["WebFetch", "WebSearch"],
    usageCount: 0,
  },
];

function toSkill(draft: SkillDraft, previous?: Skill): Skill {
  return {
    ...previous,
    ...draft,
    id: previous?.id ?? `${draft.name}-${Date.now()}`,
    source: previous?.source ?? "user",
    enabled: previous?.enabled ?? true,
    updatedAt: new Date().toISOString(),
  };
}

function useSkills() {
  const [skills, setSkills] = useState(SKILLS);
  const toggle = async (skill: Skill, enabled: boolean) => {
    await wait(400);
    setSkills((prev) => prev.map((item) => (item.id === skill.id ? { ...item, enabled } : item)));
  };
  return { skills, setSkills, toggle };
}

function SettingsPanelPreview({ narrow = false, grid = false }: { narrow?: boolean; grid?: boolean }) {
  const { skills, setSkills, toggle } = useSkills();
  const [selectedId, setSelectedId] = useState<string | null>(narrow ? null : (skills[0]?.id ?? null));
  const panel = (
    <SkillsSettingsPanel
      skills={skills}
      selectedId={selectedId}
      onSelectedIdChange={setSelectedId}
      availableTools={TOOLS}
      catalogVariant={grid ? "grid" : "list"}
      onToggle={toggle}
      onCreate={async (draft) => {
        await wait(400);
        const skill = toSkill(draft);
        setSkills((prev) => [...prev, skill]);
        return skill;
      }}
      onUpdate={async (skill, draft) => {
        await wait(400);
        setSkills((prev) => prev.map((item) => (item.id === skill.id ? toSkill(draft, item) : item)));
      }}
      onRemove={(skill) => setSkills((prev) => prev.filter((item) => item.id !== skill.id))}
      style={{ height: "100%" }}
    />
  );
  return narrow ? <NarrowFrame height={620}>{panel}</NarrowFrame> : <WideFrame height={620}>{panel}</WideFrame>;
}

function CatalogPreview({ grid = false }: { grid?: boolean }) {
  const { skills, toggle } = useSkills();
  const [selectedId, setSelectedId] = useState<string | null>("code-review");
  const catalog = (
    <div className="p-3">
      <SkillCatalog
        skills={skills}
        variant={grid ? "grid" : "list"}
        selectedId={selectedId}
        onSelect={(skill) => setSelectedId(skill.id)}
        onToggle={toggle}
        onEdit={noop}
        onDuplicate={noop}
        onRemove={noop}
        onCreate={noop}
        isEditable={(skill) => skill.source === "user" || skill.source === "project"}
      />
    </div>
  );
  return grid ? <WideFrame>{catalog}</WideFrame> : <NarrowFrame>{catalog}</NarrowFrame>;
}

function CatalogStatesPreview() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-border p-3">
        <SkillCatalog skills={[]} loading />
      </div>
      <div className="rounded-lg border border-border p-3">
        <SkillCatalog skills={[]} error="Could not load skills" onRetry={noop} />
      </div>
      <div className="rounded-lg border border-border p-3">
        <SkillCatalog skills={[]} onCreate={noop} />
      </div>
    </div>
  );
}

function DetailPreview({ skill }: { skill: Skill }) {
  const { skills, toggle } = useSkills();
  const current = skills.find((item) => item.id === skill.id) ?? skill;
  return (
    <WideFrame className="p-4">
      <SkillDetail skill={current} onEdit={noop} onToggle={toggle} />
    </WideFrame>
  );
}

function EditorPreview({ create = false }: { create?: boolean }) {
  const [saved, setSaved] = useState<SkillDraft | null>(null);
  return (
    <WideFrame className="p-4">
      <SkillEditor
        skill={create ? null : SKILLS[1]}
        availableTools={TOOLS}
        takenNames={SKILLS.map((skill) => skill.name)}
        onSave={async (draft) => {
          await wait(500);
          setSaved(draft);
        }}
        onCancel={() => setSaved(null)}
      />
      <ResultBlock value={saved} />
    </WideFrame>
  );
}

function PickerPreview() {
  const [value, setValue] = useState<string[]>(["code-review"]);
  return (
    <NarrowFrame className="p-4">
      <SkillPicker
        skills={SKILLS}
        value={value}
        onChange={setValue}
        label="Skills"
        description="Loaded for this agent"
      />
      <ResultBlock value={value} />
    </NarrowFrame>
  );
}

export function renderSkillsPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "SkillsSettingsPanel":
    case "SkillsSettingsPanel/wide":
      return <SettingsPanelPreview />;
    case "SkillsSettingsPanel/narrow":
      return <SettingsPanelPreview narrow />;
    case "SkillCatalog":
    case "SkillCatalog/list":
      return <CatalogPreview />;
    case "SkillCatalog/grid":
      return <CatalogPreview grid />;
    case "SkillCatalog/states":
      return <CatalogStatesPreview />;
    case "SkillDetail":
    case "SkillDetail/basic":
      return <DetailPreview skill={SKILLS[0]} />;
    case "SkillDetail/disabled":
      return <DetailPreview skill={SKILLS[4]} />;
    case "SkillEditor":
    case "SkillEditor/edit":
      return <EditorPreview />;
    case "SkillEditor/create":
      return <EditorPreview create />;
    case "SkillPicker":
    case "SkillPicker/basic":
      return <PickerPreview />;
    default:
      return undefined;
  }
}
