"use client";

import React, { useMemo, useState } from "react";
import { useElementSize } from "@mantine/hooks";
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Drawer,
  Group,
  ScrollArea,
  SegmentedControl,
  Select,
  Splitter,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconBook2,
  IconBug,
  IconLayoutSidebar,
  IconLayoutSidebarRight,
  IconListCheck,
  IconMessagePlus,
  IconShare2,
  IconSparkles,
} from "@tabler/icons-react";
import {
  AgentChat,
  AiKitProvider,
  BackgroundTasksPanel,
  DiffReview,
  McpSettingsPanel,
  OVERLAY_INNER_CLASS,
  SessionList,
  SettingRow,
  SettingsLayout,
  SettingsSection,
  UsagePanel,
  Wizard,
  type AgentChatEmptyState,
  type FileDecision,
  type SettingsNavItem,
  type UsagePeriod,
  type WizardStep,
} from "@sinups/ai-kit";
import { ChatLauncherPreview, useDemoChat } from "@/app/components/previews/launcher";
import { ClientOnly } from "@/app/components/previews/frames";
import { SESSION_MESSAGES, createSessions } from "@/app/components/previews/sessions";
import { DIFF_FIXTURES } from "@/app/components/previews/diff";
import { createTasks } from "@/app/components/previews/tasks";
import { MCP_SERVERS } from "@/app/components/previews/mcp";
import { MODEL_USAGE, createDailyUsage, createLimits } from "@/app/components/previews/settings";

const COLUMN = 760;

const WELCOME: AgentChatEmptyState = {
  avatar: <IconSparkles size={22} />,
  title: "How can I help you today?",
  description: "Ask about the code, fix a bug or plan a change.",
  actions: [
    { id: "explain", label: "Explain this repository", icon: <IconBook2 /> },
    { id: "tests", label: "Find flaky tests", icon: <IconBug />, badge: "New" },
    { id: "refactor", label: "Plan a refactor", icon: <IconListCheck /> },
  ],
};

type Frame = "desktop" | "mobile";

/** Page-sized frame; the transform keeps fixed overlays and drawers inside it */
function RecipeFrame({
  frame,
  height = 600,
  children,
}: {
  frame: Frame;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <Box
      className="relative mx-auto flex flex-col overflow-hidden rounded-lg border border-border"
      style={{
        width: frame === "desktop" ? "100%" : 390,
        maxWidth: "100%",
        height,
        transform: "translateZ(0)",
        background: "var(--ae-bg)",
        color: "var(--ae-fg)",
      }}
    >
      {children}
    </Box>
  );
}

function FrameSwitch({
  frame,
  onChange,
  children,
}: {
  frame: Frame;
  onChange: (frame: Frame) => void;
  children?: React.ReactNode;
}) {
  return (
    <Group justify="space-between" gap="xs" wrap="wrap">
      <SegmentedControl
        size="xs"
        value={frame}
        onChange={(value) => onChange(value as Frame)}
        data={[
          { value: "desktop", label: "Desktop" },
          { value: "mobile", label: "Mobile" },
        ]}
      />
      {children}
    </Group>
  );
}

function Header({
  title,
  leading,
  action,
}: {
  title: React.ReactNode;
  leading?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Group
      component="header"
      h={48}
      px="md"
      gap="xs"
      wrap="nowrap"
      className="shrink-0"
      style={{ borderBottom: "1px solid var(--ae-border)" }}
    >
      {leading}
      <Text size="sm" fw={500} truncate style={{ flex: 1 }}>
        {title}
      </Text>
      {action}
    </Group>
  );
}

/** `mobile` when the phone frame is chosen or the desktop frame itself is narrower than a tablet */
function RecipeShell({ children }: { children: (frame: Frame) => React.ReactNode }) {
  const [frame, setFrame] = useState<Frame>("desktop");
  const { ref, width } = useElementSize();
  const layout: Frame = frame === "mobile" || (width > 0 && width < 560) ? "mobile" : "desktop";
  return (
    <ClientOnly>
      <AiKitProvider>
        <Stack gap="sm" className="w-full" ref={ref}>
          <FrameSwitch frame={frame} onChange={setFrame} />
          <RecipeFrame key={frame} frame={frame}>
            {width > 0 && children(layout)}
          </RecipeFrame>
        </Stack>
      </AiKitProvider>
    </ClientOnly>
  );
}

const shareAction = (
  <Tooltip label="Share">
    <ActionIcon variant="subtle" color="gray" aria-label="Share">
      <IconShare2 size={16} />
    </ActionIcon>
  </Tooltip>
);

function FullPageChat({ frame }: { frame: Frame }) {
  const [empty, setEmpty] = useState(false);
  return (
    <>
      <Header
        title={empty ? "New chat" : "Add retry to token refresh"}
        action={
          <Group gap="xs" wrap="nowrap">
            <Switch
              size="xs"
              label="Empty"
              checked={empty}
              onChange={(event) => setEmpty(event.currentTarget.checked)}
            />
            {shareAction}
          </Group>
        }
      />
      <FullPageChatBody key={String(empty)} empty={empty} compact={frame === "mobile"} />
    </>
  );
}

function FullPageChatBody({ empty, compact }: { empty: boolean; compact: boolean }) {
  const chat = useDemoChat(empty ? [] : SESSION_MESSAGES);
  return (
    <AgentChat
      messages={chat.messages}
      status={chat.status}
      onSend={chat.onSend}
      onStop={chat.onStop}
      contentWidth={COLUMN}
      collapseToolRuns
      alignComposer
      topFade
      searchable
      wrapLines={compact}
      emptyState={WELCOME}
      style={{ flex: 1, minHeight: 0 }}
    />
  );
}

function ChatWithSidebar({ frame }: { frame: Frame }) {
  const compact = frame === "mobile";
  const sessions = useMemo(() => createSessions(new Date()), []);
  const [selectedId, setSelectedId] = useState(sessions[0]?.id ?? "");
  const [historyOpened, setHistoryOpened] = useState(false);
  const chat = useDemoChat(SESSION_MESSAGES);
  const selected = sessions.find((session) => session.id === selectedId);

  const history = (
    <ScrollArea type="hover" style={{ flex: 1, minHeight: 0 }} px="xs" py="xs">
      <SessionList
        sessions={sessions}
        selectedId={selectedId}
        onSelect={(session) => {
          setSelectedId(session.id);
          setHistoryOpened(false);
        }}
        withSearch="on-demand"
        toolbar={
          <Tooltip label="New chat">
            <ActionIcon variant="subtle" color="gray" aria-label="New chat">
              <IconMessagePlus size={16} />
            </ActionIcon>
          </Tooltip>
        }
      />
    </ScrollArea>
  );

  return (
    <Box style={{ display: "flex", flex: 1, minHeight: 0 }}>
      {!compact && (
        <Box
          component="nav"
          w={272}
          style={{
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            background: "var(--ae-bg-tertiary)",
            borderInlineEnd: "1px solid var(--ae-border)",
          }}
        >
          {history}
        </Box>
      )}
      <Box style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <Header
          title={selected?.title}
          leading={
            compact && (
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Open history"
                onClick={() => setHistoryOpened(true)}
              >
                <IconLayoutSidebar size={18} />
              </ActionIcon>
            )
          }
          action={shareAction}
        />
        <AgentChat
          messages={chat.messages}
          status={chat.status}
          onSend={chat.onSend}
          onStop={chat.onStop}
          contentWidth={COLUMN}
          alignComposer
          topFade
          wrapLines={compact}
          style={{ flex: 1, minHeight: 0 }}
        />
      </Box>
      <Drawer
        opened={compact && historyOpened}
        onClose={() => setHistoryOpened(false)}
        size="85%"
        withCloseButton={false}
        classNames={{ inner: OVERLAY_INNER_CLASS }}
      >
        <Box style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 32px)" }}>{history}</Box>
      </Drawer>
    </Box>
  );
}

function Inspector({ kind }: { kind: "diff" | "tasks" }) {
  const [decisions, setDecisions] = useState<Record<string, FileDecision>>({});
  const tasks = useMemo(() => createTasks(), []);
  const header = (
    <Text size="sm" fw={500}>
      {kind === "diff" ? "Changes" : "Background tasks"}
    </Text>
  );
  return kind === "diff" ? (
    <DiffReview
      changes={DIFF_FIXTURES}
      decisions={decisions}
      onAccept={(change) => setDecisions((current) => ({ ...current, [change.path]: "accepted" }))}
      onReject={(change) => setDecisions((current) => ({ ...current, [change.path]: "rejected" }))}
      withHotkeys={false}
      header={header}
    />
  ) : (
    <BackgroundTasksPanel tasks={tasks} header={header} />
  );
}

function ChatWithInspector({ frame }: { frame: Frame }) {
  const compact = frame === "mobile";
  const [kind, setKind] = useState<"diff" | "tasks">("diff");
  const [drawerOpened, setDrawerOpened] = useState(false);
  const chat = useDemoChat(SESSION_MESSAGES);

  const chatColumn = (
    <Box style={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>
      <Header
        title="Add retry to token refresh"
        action={
          <Group gap={4} wrap="nowrap">
            <SegmentedControl
              size="xs"
              value={kind}
              onChange={(value) => setKind(value as "diff" | "tasks")}
              data={[
                { value: "diff", label: "Changes" },
                { value: "tasks", label: "Tasks" },
              ]}
            />
            {compact && (
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Open inspector"
                onClick={() => setDrawerOpened(true)}
              >
                <IconLayoutSidebarRight size={18} />
              </ActionIcon>
            )}
          </Group>
        }
      />
      <AgentChat
        messages={chat.messages}
        status={chat.status}
        onSend={chat.onSend}
        onStop={chat.onStop}
        contentWidth={COLUMN}
        alignComposer
        topFade
        wrapLines={compact}
        style={{ flex: 1, minHeight: 0 }}
      />
    </Box>
  );

  if (compact) {
    return (
      <>
        {chatColumn}
        <Drawer
          opened={drawerOpened}
          onClose={() => setDrawerOpened(false)}
          position="bottom"
          size="92%"
          withCloseButton={false}
          classNames={{ inner: OVERLAY_INNER_CLASS }}
        >
          <Inspector kind={kind} />
        </Drawer>
      </>
    );
  }

  return (
    <Splitter withHandle={false} lineSize={1} handleColor="var(--ae-border)" style={{ flex: 1, minHeight: 0 }}>
      <Splitter.Pane defaultSize={55} min="300px">
        {chatColumn}
      </Splitter.Pane>
      <Splitter.Pane defaultSize={45} min="280px" collapsible collapseThreshold="200px">
        <Box style={{ height: "100%", overflow: "auto" }}>
          <Inspector key={kind} kind={kind} />
        </Box>
      </Splitter.Pane>
    </Splitter>
  );
}

const SETTINGS_SECTIONS: SettingsNavItem[] = [
  { id: "general", label: "General" },
  { id: "mcp", label: "MCP servers", fill: true },
  { id: "usage", label: "Usage" },
];

function SettingsScreen() {
  const [activeId, setActiveId] = useState("general");
  const [period, setPeriod] = useState<UsagePeriod>("week");
  const [limits] = useState(createLimits);
  const [daily] = useState(createDailyUsage);

  return (
    <SettingsLayout
      title="Settings"
      sections={SETTINGS_SECTIONS}
      activeId={activeId}
      onActiveChange={setActiveId}
      breakpoint={560}
      navWidth={180}
      style={{ flex: 1, minHeight: 0 }}
    >
      {activeId === "general" && (
        <Stack gap="xl" p="md">
          <SettingsSection title="Chat" description="How messages are sent and shown">
            <SettingRow
              label="Send with Enter"
              description="Use Shift+Enter for a new line"
              control={<Switch aria-label="Send with Enter" defaultChecked />}
            />
            <SettingRow
              label="Collapse read and search tools"
              description="Show runs of tool calls as one summary line"
              control={<Switch aria-label="Collapse read and search tools" defaultChecked />}
            />
          </SettingsSection>
          <SettingsSection title="Privacy">
            <SettingRow
              label="Keep history for"
              control={
                <Select
                  aria-label="Keep history for"
                  data={["30 days", "90 days", "Forever"]}
                  defaultValue="90 days"
                  allowDeselect={false}
                  w={140}
                />
              }
            />
          </SettingsSection>
        </Stack>
      )}
      {activeId === "mcp" && <McpSettingsPanel servers={MCP_SERVERS} />}
      {activeId === "usage" && (
        <UsagePanel
          period={period}
          onPeriodChange={setPeriod}
          summary={{ tokens: 6_200_000, cost: 67.54, requests: 1_284 }}
          limits={limits}
          models={MODEL_USAGE}
          daily={daily}
        />
      )}
    </SettingsLayout>
  );
}

type Onboarding = { workspace: string; model: string | null; servers: string[] };

const ONBOARDING_STEPS: WizardStep<Onboarding>[] = [
  {
    id: "workspace",
    label: "Workspace",
    description: "Name the workspace",
    validate: (values) => (values.workspace.trim() ? null : { workspace: "Enter a workspace name" }),
    render: ({ values, setValue, errors }) => (
      <TextInput
        label="Workspace name"
        placeholder="Payments team"
        value={values.workspace}
        error={errors.workspace}
        onChange={(event) => setValue("workspace", event.currentTarget.value)}
      />
    ),
  },
  {
    id: "model",
    label: "Model",
    description: "Default model for new chats",
    validate: (values) => (values.model ? null : { model: "Choose a model" }),
    render: ({ values, setValue, errors }) => (
      <Select
        label="Default model"
        placeholder="Choose a model"
        data={["Qwen 2.5 Coder 32B", "Llama 3.3 70B", "Mistral Large", "DeepSeek V3"]}
        value={values.model}
        error={errors.model}
        onChange={(value) => setValue("model", value)}
      />
    ),
  },
  {
    id: "tools",
    label: "Tools",
    description: "Connect MCP servers",
    optional: true,
    render: ({ values, setValue }) => (
      <Checkbox.Group
        label="MCP servers"
        value={values.servers}
        onChange={(value) => setValue("servers", value)}
      >
        <Stack gap="xs" mt="xs">
          {["git", "issues", "filesystem", "postgres"].map((server) => (
            <Checkbox key={server} value={server} label={server} />
          ))}
        </Stack>
      </Checkbox.Group>
    ),
  },
];

function OnboardingWizard({ compact }: { compact: boolean }) {
  const [result, setResult] = useState<Onboarding | null>(null);
  const [key, setKey] = useState(0);

  if (result) {
    return (
      <Stack gap="xs" p="xl" align="flex-start">
        <Text size="sm" fw={500}>
          Workspace “{result.workspace}” is ready
        </Text>
        <Text size="sm" c="dimmed">
          {result.model}
          {result.servers.length > 0 ? ` · ${result.servers.join(", ")}` : " · no MCP servers"}
        </Text>
        <Button
          size="xs"
          variant="default"
          onClick={() => {
            setResult(null);
            setKey((current) => current + 1);
          }}
        >
          Start again
        </Button>
      </Stack>
    );
  }

  return (
    <ScrollArea style={{ flex: 1 }} p="md">
      <Wizard
        key={key}
        orientation={compact ? "horizontal" : "vertical"}
        steps={ONBOARDING_STEPS}
        initialValues={{ workspace: "", model: null, servers: ["git"] }}
        review={(values) => (
          <Stack gap={4}>
            <Text size="sm">Workspace: {values.workspace}</Text>
            <Text size="sm">Model: {values.model}</Text>
            <Text size="sm">MCP servers: {values.servers.join(", ") || "none"}</Text>
          </Stack>
        )}
        labels={{ finish: "Create workspace" }}
        onComplete={async (values) => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          setResult(values);
        }}
      />
    </ScrollArea>
  );
}

export type RecipeId = "full-page" | "sidebar" | "inspector" | "settings" | "widget" | "onboarding";

export function RecipePreview({ id }: { id: RecipeId }) {
  if (id === "widget") {
    return (
      <ClientOnly>
        <AiKitProvider>
          <ChatLauncherPreview />
        </AiKitProvider>
      </ClientOnly>
    );
  }
  return (
    <RecipeShell>
      {(frame) => {
        switch (id) {
          case "full-page":
            return <FullPageChat frame={frame} />;
          case "sidebar":
            return <ChatWithSidebar frame={frame} />;
          case "inspector":
            return <ChatWithInspector frame={frame} />;
          case "settings":
            return <SettingsScreen />;
          case "onboarding":
            return <OnboardingWizard compact={frame === "mobile"} />;
        }
      }}
    </RecipeShell>
  );
}

