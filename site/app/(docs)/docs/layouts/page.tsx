import Link from "next/link";
import { DocCodeBlock } from "@/app/components/doc-code-block";
import { DocPageShell } from "@/app/components/doc-page-shell";
import {
  Bullets,
  C,
  ComponentLink,
  docLinkClass,
  GuideHeader,
  GuideSection,
  P,
} from "@/app/components/doc-guide";
import { getDocNav } from "@/app/utils/doc-nav";

const FULL_PAGE = `import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { IconShare2 } from "@tabler/icons-react";
import { AgentChat } from "@sinups/ai-kit";

const COLUMN = 760;

export function ChatPage({ chat }: { chat: ChatState }) {
  return (
    <Box h="100dvh" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Group component="header" h={48} px="md" maw={COLUMN} w="100%" mx="auto" wrap="nowrap">
        <Text size="sm" fw={500} truncate style={{ flex: 1 }}>
          Add retry to token refresh
        </Text>
        <ActionIcon variant="subtle" color="gray" aria-label="Share">
          <IconShare2 size={16} />
        </ActionIcon>
      </Group>
      <AgentChat
        {...chat}
        contentWidth={COLUMN}
        collapseToolRuns
        alignComposer
        topFade
        searchable
        stickyPrompt
        style={{ flex: 1, minHeight: 0 }}
      />
    </Box>
  );
}`;

const EMPTY = `const welcome = {
  avatar: <IconSparkles size={22} />,
  title: "How can I help you today?",
  description: "Ask about the code, fix a bug or plan a change.",
  actions: [
    { id: "explain", label: "Explain this repository", icon: <IconBook2 /> },
    { id: "tests", label: "Find flaky tests", icon: <IconBug />, badge: "New" },
  ],
};

// Welcome: greeting and actions in the message area, composer at the bottom
<AgentChat {...chat} contentWidth={760} alignComposer emptyState={welcome} />

// Center: greeting and composer centered; suggestion pills render above the composer
<AgentChat
  {...chat}
  contentWidth={760}
  emptyState={{
    layout: "center",
    title: "What should we work on?",
    suggestions: [
      { id: "explain", label: "Explain this repository" },
      { id: "tests", label: "Find flaky tests" },
    ],
  }}
/>`;

const SIDEBAR = `import { useState } from "react";
import { Box, Drawer, ScrollArea } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { AgentChat, OVERLAY_INNER_CLASS, SessionList } from "@sinups/ai-kit";

export function ChatWithHistory({ chat, sessions, selectedId, onSelect }: Props) {
  const { ref, width } = useElementSize();
  const compact = width > 0 && width < 720;
  const [historyOpened, setHistoryOpened] = useState(false);

  const history = (
    <ScrollArea type="hover" style={{ flex: 1, minHeight: 0 }} px="xs">
      <SessionList
        sessions={sessions}
        selectedId={selectedId}
        onSelect={(session) => {
          onSelect(session);
          setHistoryOpened(false);
        }}
        withSearch="on-demand"
      />
    </ScrollArea>
  );

  return (
    <Box ref={ref} style={{ display: "flex", flex: 1, minHeight: 0 }}>
      {!compact && (
        <Box
          component="nav"
          w={272}
          style={{
            display: "flex",
            flexDirection: "column",
            background: "var(--ae-bg-tertiary)",
            borderInlineEnd: "1px solid var(--ae-border)",
          }}
        >
          {history}
        </Box>
      )}
      <AgentChat {...chat} contentWidth={760} alignComposer wrapLines={compact} style={{ flex: 1 }} />
      <Drawer
        opened={compact && historyOpened}
        onClose={() => setHistoryOpened(false)}
        size="85%"
        withCloseButton={false}
        classNames={{ inner: OVERLAY_INNER_CLASS }}
      >
        {history}
      </Drawer>
    </Box>
  );
}`;

const INSPECTOR = `import { Splitter } from "@mantine/core";
import { AgentChat, DiffReview } from "@sinups/ai-kit";

<Splitter withHandle={false} lineSize={1} handleColor="var(--ae-border)" style={{ flex: 1, minHeight: 0 }}>
  <Splitter.Pane defaultSize={62} min="420px">
    <AgentChat {...chat} contentWidth={760} alignComposer topFade />
  </Splitter.Pane>
  <Splitter.Pane defaultSize={38} min="360px" collapsible collapseThreshold="240px">
    <DiffReview
      changes={changes}
      decisions={decisions}
      onAccept={(change) => accept(change.path)}
      onReject={(change) => reject(change.path)}
      header={<Text size="sm" fw={500}>Changes</Text>}
    />
  </Splitter.Pane>
</Splitter>`;

const SETTINGS = `import { useState } from "react";
import { Switch } from "@mantine/core";
import {
  McpSettingsPanel,
  SettingRow,
  SettingsLayout,
  SettingsSection,
  UsagePanel,
  type SettingsNavItem,
} from "@sinups/ai-kit";

const SECTIONS: SettingsNavItem[] = [
  { id: "general", label: "General" },
  { id: "mcp", label: "MCP servers", fill: true },
  { id: "usage", label: "Usage" },
];

export function SettingsPage() {
  const [activeId, setActiveId] = useState("general");

  return (
    <SettingsLayout title="Settings" sections={SECTIONS} activeId={activeId} onActiveChange={setActiveId}>
      {activeId === "general" && (
        <SettingsSection title="Chat">
          <SettingRow
            label="Send with Enter"
            description="Use Shift+Enter for a new line"
            control={<Switch aria-label="Send with Enter" defaultChecked />}
          />
        </SettingsSection>
      )}
      {activeId === "mcp" && <McpSettingsPanel servers={servers} />}
      {activeId === "usage" && <UsagePanel {...usage} />}
    </SettingsLayout>
  );
}`;

const WIDGET = `<ChatLauncher title="Assistant">
  <AgentChat {...chat} contentWidth="100%" wrapLines alignComposer emptyState={welcome} />
</ChatLauncher>`;

export default function LayoutsPage() {
  const { previousHref, nextHref } = getDocNav("/docs/layouts");

  return (
    <DocPageShell
      sections={[
        { id: "rules", label: "Rules for every layout" },
        { id: "full-page", label: "Full-page chat" },
        { id: "empty", label: "New chat" },
        { id: "sidebar", label: "Chat with a sidebar" },
        { id: "inspector", label: "Chat with an inspector" },
        { id: "settings", label: "Settings page" },
        { id: "widget", label: "Widget" },
      ]}
    >
      <GuideHeader
        title="Layouts"
        description="Compose full pages, sidebars, inspectors, settings and widgets from kit components."
        previousHref={previousHref}
        nextHref={nextHref}
      >
        <P>
          The kit does not ship page shells. Components fill the box you give them and adapt to its
          width, so a layout is a few flex containers around them. The recipes below match the
          layout stories in the repository Storybook (<C>layouts/*</C>).
        </P>
      </GuideHeader>

      <GuideSection id="rules" title="Rules for every layout">
        <Bullets>
          <li>
            Give the chat a bounded height: a flex column with <C>minHeight: 0</C> on every level
            down to <C>AgentChat</C>. Without it the message list grows with its content and the
            composer scrolls away.
          </li>
          <li>
            <C>contentWidth</C> sets the message column and composer width. Use a number such as{" "}
            <C>760</C> on pages and <C>&quot;100%&quot;</C> in panels and widgets. The default is
            420px.
          </li>
          <li>
            Below about 720px of container width, pass <C>wrapLines</C> so code and diffs wrap, and
            move side panes into a <C>Drawer</C>. Measure the container with{" "}
            <C>useElementSize</C>, not the viewport: the same screen can be a page or a panel.
          </li>
          <li>
            <C>alignComposer</C> lines the composer and <C>statusBar</C> up with the text of the
            messages; <C>topFade</C> softens the top edge under a header.
          </li>
          <li>Separate zones with background and a 1px <C>--ae-border</C> line, not with cards.</li>
        </Bullets>
      </GuideSection>

      <GuideSection id="full-page" title="Full-page chat">
        <P>
          One centered column: a 48px header aligned with the column, the feed without frames and
          the composer pinned to the bottom. <C>searchable</C> adds Mod+F search;{" "}
          <C>stickyPrompt</C> keeps the prompt of a long answer visible.
        </P>
        <DocCodeBlock code={FULL_PAGE} language="tsx" />
      </GuideSection>

      <GuideSection id="empty" title="New chat">
        <P>
          <C>emptyState</C> replaces the empty feed. The <C>welcome</C> layout keeps the composer at
          the bottom and lists starter actions above it. The <C>center</C> layout centers the
          greeting and the composer, with suggestion pills above the composer. Both switch to the regular feed after the first message.
        </P>
        <DocCodeBlock code={EMPTY} language="tsx" />
      </GuideSection>

      <GuideSection id="sidebar" title="Chat with a sidebar">
        <P>
          A 272px history column on <C>--ae-bg-tertiary</C> with <ComponentLink name="SessionList" />
          , next to the chat. When the container is narrow, the same list opens in a drawer from a
          header button. Pass <C>OVERLAY_INNER_CLASS</C> to overlays so they stay inside a
          transformed container such as a preview frame.
        </P>
        <DocCodeBlock code={SIDEBAR} language="tsx" />
      </GuideSection>

      <GuideSection id="inspector" title="Chat with an inspector">
        <P>
          A resizable, collapsible pane beside the chat for <ComponentLink name="DiffReview" /> or{" "}
          <ComponentLink name="BackgroundTasksPanel" />. On phones open the same content in a
          bottom <C>Drawer</C> (<C>position=&quot;bottom&quot;</C>, <C>size=&quot;92%&quot;</C>).
          Pane components take a <C>header</C> prop so the pane title sits in their own header row.
        </P>
        <DocCodeBlock code={INSPECTOR} language="tsx" />
      </GuideSection>

      <GuideSection id="settings" title="Settings page">
        <P>
          <ComponentLink name="SettingsLayout" /> provides section navigation beside the content
          when wide and a list with a back action when narrow. Sections with <C>fill: true</C>{" "}
          give full height to panels that scroll themselves, such as{" "}
          <ComponentLink name="McpSettingsPanel" />. For the same content in a dialog use{" "}
          <ComponentLink name="SettingsModal" />.
        </P>
        <DocCodeBlock code={SETTINGS} language="tsx" />
      </GuideSection>

      <GuideSection id="widget" title="Widget">
        <P>
          A floating assistant on a host page. See{" "}
          <Link href="/docs/launcher" className={docLinkClass}>
            Embedding the launcher
          </Link>{" "}
          for the React and Shadow DOM setups.
        </P>
        <DocCodeBlock code={WIDGET} language="tsx" />
      </GuideSection>
    </DocPageShell>
  );
}
