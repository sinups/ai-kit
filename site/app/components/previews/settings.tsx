"use client";

import React, { useState } from "react";
import { Group, Text } from "@mantine/core";
import { IconLogout, IconStethoscope } from "@tabler/icons-react";
import {
  EffortSelector,
  ModelSettingsPanel,
  OutputStylePicker,
  StatusPanel,
  UsagePanel,
  type DailyUsage,
  type EffortLevelValue,
  type ModelOption,
  type ModelUsage,
  type OutputStyle,
  type StatusMcpServer,
  type UsageLimit,
  type UsagePeriod,
} from "@sinups/ai-kit";
import { NarrowFrame, WideFrame, wait } from "./frames";

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000);

const MODELS: ModelOption[] = [
  { id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder", version: "32B" },
  { id: "llama-3.3-70b", name: "Llama 3.3", version: "70B" },
  { id: "mistral-small-24b", name: "Mistral Small", version: "24B" },
];

const OUTPUT_STYLES: OutputStyle[] = [
  {
    id: "default",
    name: "Default",
    description: "Concise answers focused on getting the task done",
    example: "Fixed the retry in client.ts.",
  },
  {
    id: "explanatory",
    name: "Explanatory",
    description: "Explains the choices and trade-offs behind each change",
    example: "I added the retry in the client because the session store is shared…",
  },
  {
    id: "learning",
    name: "Learning",
    description: "Leaves small parts for you to implement, with hints",
    example: "TODO(you): handle the 401 case — hint: it should not retry.",
  },
];

export function createLimits(): UsageLimit[] {
  return [
    { id: "session", label: "5-hour limit", used: 184, limit: 200, unit: "requests", resetsAt: hoursFromNow(1.4) },
    { id: "weekly", label: "Weekly limit", used: 6_200_000, limit: 10_000_000, resetsAt: hoursFromNow(80) },
    { id: "spend", label: "Extra usage", used: 12.4, limit: 50, unit: "cost", resetsAt: hoursFromNow(300) },
  ];
}

export const MODEL_USAGE: ModelUsage[] = [
  { model: "Qwen 2.5 Coder 32B", tokens: 4_120_000, cost: 61.8 },
  { model: "Llama 3.3 70B", tokens: 1_830_000, cost: 5.49 },
  { model: "Mistral Small 24B", tokens: 250_000, cost: 0.25 },
];

export function createDailyUsage(): DailyUsage[] {
  const tokens = [420_000, 910_000, 180_000, 1_320_000, 760_000, 1_540_000, 1_070_000];
  return tokens.map((value, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return { date, tokens: value, cost: value / 100_000 };
  });
}

const MCP_SERVERS: StatusMcpServer[] = [
  { name: "git", status: "success" },
  { name: "issues", status: "success" },
  { name: "figma", status: "needs-auth" },
  { name: "errors", status: "error" },
  { name: "postgres", status: "disabled" },
];

const STATUS_PROPS = {
  version: "2.1.4",
  model: "Qwen 2.5 Coder 32B",
  account: { email: "dev@example.com", plan: "Max" },
  organization: "Acme",
  cwd: "/Users/dev/projects/acme-web/packages/auth",
  mcpServers: MCP_SERVERS,
  memoryFiles: [
    { path: "~/.agent/AGENTS.md", tokens: 820 },
    { path: "AGENTS.md", tokens: 2_400 },
  ],
  context: {
    used: 142_000,
    total: 200_000,
    segments: [
      { label: "System", value: 18_000 },
      { label: "Tools", value: 24_000 },
      { label: "Messages", value: 100_000 },
    ],
  },
};

function ModelSettingsPanelPreview({ narrow = false }: { narrow?: boolean }) {
  const [model, setModel] = useState("qwen-2.5-coder-32b");
  const [effort, setEffort] = useState<EffortLevelValue>("high");
  const [thinking, setThinking] = useState(true);
  const [style, setStyle] = useState("default");
  const [period, setPeriod] = useState<UsagePeriod>("week");
  const [limits] = useState(createLimits);
  const [daily] = useState(createDailyUsage);

  const panel = (
    <ModelSettingsPanel
      models={MODELS}
      model={model}
      onModelChange={setModel}
      effort={{ value: effort, onChange: setEffort, thinking, onThinkingChange: setThinking }}
      outputStyle={{ styles: OUTPUT_STYLES, value: style, onChange: setStyle }}
      usage={{
        period,
        onPeriodChange: setPeriod,
        withoutTitle: true,
        summary: { tokens: 6_200_000, cost: 67.54, requests: 1_284 },
        limits,
        models: MODEL_USAGE,
        daily,
      }}
      status={{ ...STATUS_PROPS, withoutTitle: true }}
    />
  );
  return narrow ? <NarrowFrame height={600}>{panel}</NarrowFrame> : <WideFrame height={600}>{panel}</WideFrame>;
}

function EffortSelectorPreview({ inline = false }: { inline?: boolean }) {
  const [effort, setEffort] = useState<EffortLevelValue>("high");
  const [thinking, setThinking] = useState(true);
  if (inline) {
    return (
      <WideFrame className="p-3">
        <Group justify="space-between" wrap="nowrap">
          <Text size="xs" c="dimmed">
            Composer toolbar
          </Text>
          <EffortSelector
            variant="inline"
            value={effort}
            onChange={setEffort}
            thinking={thinking}
            onThinkingChange={setThinking}
          />
        </Group>
      </WideFrame>
    );
  }
  return (
    <div className="flex w-full flex-col gap-6">
      <WideFrame className="p-4">
        <EffortSelector value={effort} onChange={setEffort} thinking={thinking} onThinkingChange={setThinking} />
      </WideFrame>
      <NarrowFrame className="p-4">
        <EffortSelector value={effort} onChange={setEffort} breakpoint={400} />
      </NarrowFrame>
    </div>
  );
}

function OutputStylePickerPreview({ narrow = false }: { narrow?: boolean }) {
  const [style, setStyle] = useState<string | null>("default");
  const picker = (
    <div className="p-4">
      <OutputStylePicker
        styles={OUTPUT_STYLES}
        value={style}
        onChange={setStyle}
        label="Output style"
        description="How the agent writes its answers"
        withoutExamples={narrow}
      />
    </div>
  );
  return narrow ? <NarrowFrame>{picker}</NarrowFrame> : <WideFrame>{picker}</WideFrame>;
}

function UsagePanelPreview({ narrow = false }: { narrow?: boolean }) {
  const [period, setPeriod] = useState<UsagePeriod>("week");
  const [limits] = useState(createLimits);
  const [daily] = useState(createDailyUsage);
  const panel = (
    <div className="p-4">
      <UsagePanel
        period={period}
        onPeriodChange={setPeriod}
        summary={{ tokens: 6_200_000, cost: 67.54, requests: 1_284 }}
        limits={limits}
        models={MODEL_USAGE}
        daily={daily}
      />
    </div>
  );
  return narrow ? <NarrowFrame>{panel}</NarrowFrame> : <WideFrame>{panel}</WideFrame>;
}

function UsagePanelStatesPreview() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-border p-4">
        <UsagePanel period="week" loading />
      </div>
      <div className="rounded-lg border border-border p-4">
        <UsagePanel period="week" error="Could not load usage for this period" onRetry={() => {}} />
      </div>
    </div>
  );
}

function StatusPanelPreview({ narrow = false }: { narrow?: boolean }) {
  const panel = (
    <div className="p-4">
      <StatusPanel
        {...STATUS_PROPS}
        actions={[
          { label: "Run doctor", icon: <IconStethoscope size={14} />, onClick: () => wait(1200) },
          { label: "Log out", icon: <IconLogout size={14} />, onClick: () => wait(600) },
        ]}
      />
    </div>
  );
  return narrow ? <NarrowFrame>{panel}</NarrowFrame> : <WideFrame>{panel}</WideFrame>;
}

export function renderSettingsPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "ModelSettingsPanel":
    case "ModelSettingsPanel/wide":
      return <ModelSettingsPanelPreview />;
    case "ModelSettingsPanel/narrow":
      return <ModelSettingsPanelPreview narrow />;
    case "EffortSelector":
    case "EffortSelector/default":
      return <EffortSelectorPreview />;
    case "EffortSelector/inline":
      return <EffortSelectorPreview inline />;
    case "OutputStylePicker":
    case "OutputStylePicker/wide":
      return <OutputStylePickerPreview />;
    case "OutputStylePicker/narrow":
      return <OutputStylePickerPreview narrow />;
    case "UsagePanel":
    case "UsagePanel/wide":
      return <UsagePanelPreview />;
    case "UsagePanel/narrow":
      return <UsagePanelPreview narrow />;
    case "UsagePanel/states":
      return <UsagePanelStatesPreview />;
    case "StatusPanel":
    case "StatusPanel/wide":
      return <StatusPanelPreview />;
    case "StatusPanel/narrow":
      return <StatusPanelPreview narrow />;
    default:
      return undefined;
  }
}
