import type { RecipeId } from "@/app/components/recipes";

export type Recipe = {
  id: RecipeId;
  title: string;
  summary: string;
  components: string[];
  code: string;
  height: string;
};

export const RECIPES: Recipe[] = [
  {
    id: "full-page",
    title: "Full-page chat",
    summary:
      "One centered column: a header, the feed and the composer pinned to the bottom. Switch Empty to see the welcome state with starter actions.",
    components: ["AgentChat", "MessageList", "InputBar", "TranscriptSearch"],
    height: "700px",
    code: `<Box h="100dvh" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
  <Header title="Add retry to token refresh" />
  <AgentChat
    {...chat}
    contentWidth={760}
    collapseToolRuns
    alignComposer
    topFade
    withSearch
    wrapLines={compact}
    emptyState={{
      avatar: <IconSparkles size={22} />,
      title: "How can I help you today?",
      actions: [{ id: "explain", label: "Explain this repository", icon: <IconBook2 /> }],
    }}
    style={{ flex: 1, minHeight: 0 }}
  />
</Box>`,
  },
  {
    id: "sidebar",
    title: "Chat with a history sidebar",
    summary: "Session history beside the chat. On a phone the history moves into a drawer opened from the header.",
    components: ["SessionList", "AgentChat"],
    height: "700px",
    code: `<Box style={{ display: "flex", flex: 1, minHeight: 0 }}>
  {!compact && (
    <Box component="nav" w={272} style={{ background: "var(--ae-bg-tertiary)", borderInlineEnd: "1px solid var(--ae-border)" }}>
      <SessionList sessions={sessions} selectedId={selectedId} onSelect={select} withSearch="on-demand" />
    </Box>
  )}
  <AgentChat {...chat} contentWidth={760} alignComposer topFade wrapLines={compact} style={{ flex: 1 }} />
  <Drawer opened={compact && historyOpened} onClose={closeHistory} size="85%" classNames={{ inner: OVERLAY_INNER_CLASS }}>
    <SessionList sessions={sessions} selectedId={selectedId} onSelect={select} />
  </Drawer>
</Box>`,
  },
  {
    id: "inspector",
    title: "Chat with an inspector",
    summary: "A resizable pane with the diff review or background tasks. On a phone it opens as a bottom drawer.",
    components: ["DiffReview", "BackgroundTasksPanel", "AgentChat"],
    height: "700px",
    code: `<Splitter withHandle={false} lineSize={1} handleColor="var(--ae-border)">
  <Splitter.Pane defaultSize={55} min="360px">
    <AgentChat {...chat} contentWidth={760} alignComposer topFade />
  </Splitter.Pane>
  <Splitter.Pane defaultSize={45} min="320px" collapsible collapseThreshold="240px">
    {kind === "diff" ? (
      <DiffReview changes={changes} decisions={decisions} onAccept={accept} onReject={reject} header="Changes" />
    ) : (
      <BackgroundTasksPanel tasks={tasks} header="Background tasks" />
    )}
  </Splitter.Pane>
</Splitter>`,
  },
  {
    id: "settings",
    title: "Settings screen",
    summary: "Section navigation beside the content when wide, a list with a back action when narrow.",
    components: ["SettingsLayout", "McpSettingsPanel", "UsagePanel"],
    height: "700px",
    code: `<SettingsLayout title="Settings" sections={sections} activeId={activeId} onActiveIdChange={setActiveId}>
  {activeId === "general" && (
    <SettingsSection title="Chat">
      <SettingRow label="Send with Enter" control={<Switch defaultChecked />} />
    </SettingsSection>
  )}
  {activeId === "mcp" && <McpSettingsPanel servers={servers} />}
  {activeId === "usage" && <UsagePanel period={period} onPeriodChange={setPeriod} {...usage} />}
</SettingsLayout>`,
  },
  {
    id: "widget",
    title: "Embedded widget",
    summary:
      "A floating assistant on a host page. Click the button in the corner. To mount it on a page that is not a React app, see Embedding the launcher.",
    components: ["ChatLauncher", "AgentChat"],
    height: "700px",
    code: `<ChatLauncher title="Assistant" unreadCount={unread}>
  <AgentChat {...chat} contentWidth="100%" wrapLines alignComposer emptyState={welcome} />
</ChatLauncher>`,
  },
  {
    id: "onboarding",
    title: "Onboarding wizard",
    summary: "Validated steps, an optional step and a review before an async finish.",
    components: ["Wizard"],
    height: "700px",
    code: `<Wizard
  steps={[
    { id: "workspace", label: "Workspace", validate: requireName, render: WorkspaceStep },
    { id: "model", label: "Model", validate: requireModel, render: ModelStep },
    { id: "tools", label: "Tools", optional: true, render: ToolsStep },
  ]}
  initialValues={{ workspace: "", model: null, servers: ["git"] }}
  review={(values) => <Summary values={values} />}
  labels={{ finish: "Create workspace" }}
  onComplete={createWorkspace}
/>`,
  },
];
