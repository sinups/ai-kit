import Link from "next/link";
import type { ReactNode } from "react";
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

type ModuleEntry = { title: string; components: string[]; note: ReactNode };

const MODULES: ModuleEntry[] = [
  {
    title: "Primitives",
    components: [
      "Wizard",
      "SettingsLayout",
      "SettingsModal",
      "MasterDetail",
      "EntityList",
      "CommandPalette",
      "ConfirmDialog",
      "KeyValueEditor",
      "SchemaView",
      "StatusBadge",
      "ShortcutHint",
      "ValidationErrorsList",
      "InvalidSettingsNotice",
    ],
    note: (
      <>
        Domain-neutral building blocks: multi-step flows with validation (<C>WizardModal</C>,{" "}
        <C>useWizard</C>), settings screens (<C>SettingsSection</C>, <C>SettingRow</C>), list and
        detail panes, searchable lists (<C>EntityListItem</C>), a Mod+K palette (
        <C>useFuzzySearch</C>) and one status vocabulary.
      </>
    ),
  },
  {
    title: "MCP",
    components: [
      "McpSettingsPanel",
      "McpServerList",
      "McpServerDetail",
      "McpToolDetail",
      "McpServerWizard",
      "McpImportDialog",
      "McpDiscoveredServers",
      "McpConfigWarnings",
      "McpToolAnnotationBadges",
      "McpTransportIcon",
    ],
    note: (
      <>
        Servers over stdio, HTTP and SSE with status, reconnect and authentication, tools, resources
        and prompts, an add and edit wizard (<C>McpServerWizardModal</C>), import from another
        client and approval of servers found in project configuration.
      </>
    ),
  },
  {
    title: "Agents",
    components: [
      "AgentsSettingsPanel",
      "AgentList",
      "AgentDetail",
      "AgentEditor",
      "AgentCreateWizard",
      "ToolSelector",
      "AgentAvatar",
      "AgentIdentityFields",
    ],
    note: (
      <>
        Agent definitions: list, detail, editor, creation wizard and tool selection. The form
        fields are exported separately (<C>AgentPromptField</C>, <C>AgentModelFields</C>,{" "}
        <C>AgentColorPicker</C>).
      </>
    ),
  },
  {
    title: "Skills",
    components: ["SkillsSettingsPanel", "SkillCatalog", "SkillDetail", "SkillEditor", "SkillPicker"],
    note: "Skill catalog by source, detail, an editor with validation and a multi-select picker for forms such as an agent editor.",
  },
  {
    title: "Permissions",
    components: [
      "PermissionRulesPanel",
      "AddPermissionRuleWizard",
      "PermissionRuleInput",
      "PermissionModeSelector",
    ],
    note: "Allow, ask and deny rules with search, counts, a warning for broad rules and a rule wizard.",
  },
  {
    title: "Hooks",
    components: ["HooksPanel", "HookWizard"],
    note: "Lifecycle hooks grouped by event, with an enable switch per hook, matcher validation and payload examples.",
  },
  {
    title: "Memory",
    components: ["MemoryPanel", "MemoryFileDetail"],
    note: "Memory files by scope with search, a Markdown preview and an inline editor.",
  },
  {
    title: "Sessions",
    components: ["SessionList", "SessionPreview", "ExportDialog"],
    note: "Session history grouped by date with search, pinned and archived filters, per-session actions and export.",
  },
  {
    title: "Message actions",
    components: [
      "MessageActions",
      "EditMessageComposer",
      "FeedbackForm",
      "PlanApproval",
      "RewindDialog",
      "ToolResultNotice",
      "MemoryNotice",
      "CommandChip",
    ],
    note: (
      <>
        Edit, retry, rewind, branch, copy and feedback under messages. Pass them to{" "}
        <C>AgentChat</C> through <C>messageActions</C>.
      </>
    ),
  },
  {
    title: "Background tasks",
    components: [
      "BackgroundTasksPanel",
      "TaskList",
      "TaskDetail",
      "AgentTree",
      "TaskStatusPill",
      "AgentMessage",
      "TaskElapsed",
    ],
    note: (
      <>
        Running and finished tasks and subagents as a list or a tree, with detail, stop and retry.{" "}
        <C>BackgroundTasksDrawer</C> opens the panel in a drawer.
      </>
    ),
  },
  {
    title: "Diff review",
    components: ["DiffReview", "DiffFileList", "DiffFileView", "DiffStats"],
    note: (
      <>
        Multi-file review with unified and split views, word highlighting, viewed marks, j/k
        navigation and accept or reject per file. <C>DiffReviewModal</C> opens it in a modal.
      </>
    ),
  },
  {
    title: "Model settings and help",
    components: [
      "ModelSettingsPanel",
      "EffortSelector",
      "OutputStylePicker",
      "UsagePanel",
      "StatusPanel",
      "CommandsHelp",
    ],
    note: "Model, reasoning effort and output style, token and cost usage with plan limits, an environment summary, commands and shortcuts.",
  },
  {
    title: "Elicitation",
    components: ["ElicitationForm"],
    note: "Forms built from MCP elicitation schemas, including URL requests.",
  },
];

const CHAT_COMPONENTS: Array<{ name: string; note: string }> = [
  { name: "AgentStatus", note: "Live status line with elapsed time, tokens and stall detection (useStalled)." },
  { name: "ContextUsage", note: "Context window ring with warning and danger levels and a compact action." },
  { name: "ContextBreakdown", note: "What fills the context window, group by group, with suggestions to free space." },
  { name: "CompactBoundary", note: "Marker where earlier history was replaced with a summary." },
  { name: "TurnSummary", note: "End-of-turn row: duration, tokens, running background tasks." },
  { name: "ContextEventRow", note: "Files, memories, skills or diagnostics pulled into context." },
  { name: "HookActivity", note: "Hooks that ran for an event, and why they blocked or failed." },
  { name: "IdleReturnPrompt", note: "Offers to keep or restart a long conversation after a break." },
  { name: "SpendThresholdNotice", note: "Tells the user that the session spend passed a threshold." },
  { name: "TranscriptSearch", note: "Conversation search opened with Mod+F." },
  { name: "PromptHistorySearch", note: "Fuzzy search over sent prompts opened with Mod+R." },
  { name: "PastedTextAttachment", note: "Chip for a long paste collapsed out of the composer." },
  { name: "CodeBlock", note: "Code with optional syntax highlighting and collapsing." },
  { name: "ShellOutput", note: "Command output with ANSI colors, links, JSON and a tail view." },
];

const INSTALL = `npm install @sinups/ai-kit @mantine/core @mantine/hooks @tabler/icons-react`;

const MIGRATION = `// Before
<AgentChat {...chat} suggestions={suggestions} emptySuggestionsPosition="bottom" />

// After: suggestions render above the composer
<AgentChat {...chat} suggestions={suggestions} />

// Or a centered greeting with pills above the composer
<AgentChat {...chat} emptyState={{ layout: "center", title: "What should we work on?", suggestions }} />`;

function ComponentLinks({ names }: { names: string[] }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {names.map((name) => (
        <ComponentLink key={name} name={name} />
      ))}
    </span>
  );
}

export default function WhatsNewPage() {
  const { previousHref, nextHref } = getDocNav("/docs/whats-new");

  return (
    <DocPageShell
      sections={[
        { id: "overview", label: "Overview" },
        { id: "breaking", label: "Breaking changes" },
        { id: "deprecations", label: "Deprecations" },
        { id: "modules", label: "New modules" },
        { id: "chat", label: "New chat components" },
        { id: "changed", label: "Changed components" },
        { id: "theming", label: "Theming" },
        { id: "launcher", label: "Launcher" },
        { id: "testing", label: "Testing" },
      ]}
    >
      <GuideHeader
        title="What's new"
        description="Everything added in this release, breaking changes, changes to existing components and the deprecation."
        previousHref={previousHref}
        nextHref={nextHref}
      >
        <P>
          <C>@sinups/ai-kit</C> grows from a set of chat components into a kit for agent products.
          This release adds the screens around the chat, shared primitives, a theme provider, an
          embeddable launcher and a Storybook-based test setup. Existing chat components keep their
          props and gain new optional ones. Installation changes: icons become a peer dependency and
          the peer ranges move to Mantine 9.4 and React 19.2.
        </P>
      </GuideHeader>

      <GuideSection id="overview" title="Overview">
        <Bullets>
          <li>
            New components follow one contract: controlled props, async callbacks with pending and
            error states, loading, error and empty states, and layout by their own width. See{" "}
            <Link href="/docs/architecture" className={docLinkClass}>
              Architecture
            </Link>
            .
          </li>
          <li>
            Logic is exported as pure functions and hooks. See{" "}
            <Link href="/docs/utilities" className={docLinkClass}>
              Hooks and utilities
            </Link>
            .
          </li>
          <li>
            Page recipes for full-page chat, sidebars, inspectors and settings are on{" "}
            <Link href="/docs/layouts" className={docLinkClass}>
              Layouts
            </Link>
            .
          </li>
        </Bullets>
      </GuideSection>

      <GuideSection id="breaking" title="Breaking changes">
        <Bullets>
          <li>
            <C>@tabler/icons-react</C> moved from dependencies to peer dependencies, so the kit no
            longer installs its own copy. Add <C>@tabler/icons-react</C> to your dependencies.
          </li>
          <li>
            Peer ranges now match what the kit is built on: <C>@mantine/core</C> and{" "}
            <C>@mantine/hooks</C> 9.4 or later, <C>react</C> and <C>react-dom</C> 19.2 or later,{" "}
            <C>@tabler/icons-react</C> 3.
          </li>
          <li>
            The package declares <C>sideEffects</C>, so bundlers keep only the components you import.
            Keep importing <C>@sinups/ai-kit/styles.css</C> once at the app root.
          </li>
        </Bullets>
        <DocCodeBlock code={INSTALL} language="bash" />
      </GuideSection>

      <GuideSection id="deprecations" title="Deprecations">
        <P>
          <C>AgentChat</C> <C>emptySuggestionsPosition</C> is deprecated. Suggestions always render
          above the composer, and <C>&quot;bottom&quot;</C> behaves as <C>&quot;top&quot;</C>.{" "}
          <C>InputBar</C> places suggestion pills above the field as well. Remove the prop; for a
          centered start screen use <C>emptyState</C> with <C>layout: &quot;center&quot;</C>.
        </P>
        <DocCodeBlock code={MIGRATION} language="tsx" />
      </GuideSection>

      <GuideSection id="modules" title="New modules">
        <div className="rounded-[8px] border border-border divide-y divide-border text-sm">
          {MODULES.map((module) => (
            <div key={module.title} className="px-3 py-3 space-y-1">
              <div className="font-medium text-an-foreground">{module.title}</div>
              <ComponentLinks names={module.components} />
              <p className="text-muted-foreground">{module.note}</p>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection id="chat" title="New chat components">
        <div className="rounded-[8px] border border-border divide-y divide-border text-sm">
          {CHAT_COMPONENTS.map((item) => (
            <div
              key={item.name}
              className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-1 sm:gap-3 px-3 py-2"
            >
              <ComponentLink name={item.name} />
              <span className="text-muted-foreground">{item.note}</span>
            </div>
          ))}
        </div>
        <P>
          <C>MessageList</C> renders the new message parts <C>compaction</C>,{" "}
          <C>turn-summary</C>, <C>context-event</C> and <C>hook-activity</C> with these components.
        </P>
      </GuideSection>

      <GuideSection id="changed" title="Changed components">
        <Bullets>
          <li>
            <ComponentLink name="AgentChat" />: <C>emptyState</C> (welcome and center layouts),{" "}
            <C>emptyStateWidth</C>, <C>statusBar</C>, <C>messageActions</C>, <C>onRetry</C>,{" "}
            <C>onToolAction</C>, <C>searchable</C>, <C>stickyPrompt</C>,{" "}
            <C>longMessageThreshold</C>, <C>highlighter</C>, <C>collapseToolRuns</C>,{" "}
            <C>alignComposer</C>, <C>topFade</C>, <C>wrapLines</C>, <C>responsiveTables</C>,{" "}
            <C>hideSuggestionsWhenNotEmpty</C>, <C>inputBarProps</C>. <C>contentWidth</C> accepts
            any CSS width.
          </li>
          <li>
            <ComponentLink name="MessageList" />: the same feed options, plus{" "}
            <C>searchOpened</C>, <C>onSearchOpenedChange</C>, <C>commands</C>,{" "}
            <C>onScrollbarWidthChange</C>, <C>labels</C> and a new-messages button.
          </li>
          <li>
            <ComponentLink name="InputBar" />: <C>completions</C> for <C>/</C> and <C>@</C>{" "}
            triggers, a message queue (<C>onQueue</C>, <C>queuedMessages</C>,{" "}
            <C>onRemoveQueued</C>), collapsed long pastes (<C>pasteCollapseThreshold</C>), prompt
            history (<C>history</C>, <C>historySearchHotkey</C>, <C>onHistorySearch</C>),{" "}
            <C>labels</C>.
          </li>
          <li>
            <ComponentLink name="ErrorMessage" />: <C>variant</C>, <C>retry</C> countdown,{" "}
            <C>resetsAt</C>, <C>collapsible</C>, <C>onRetry</C>.
          </li>
          <li>
            <ComponentLink name="Markdown" />: <C>streaming</C> re-parses only the growing tail;{" "}
            <C>highlighter</C>, <C>codeWrap</C>, <C>responsiveTables</C>.
          </li>
          <li>
            <ComponentLink name="UserMessage" />: slash command chips (<C>commands</C>) and
            collapsing of long messages (<C>longTextThreshold</C>).
          </li>
          <li>
            <ComponentLink name="QuestionPrompt" /> and <ComponentLink name="QuestionTool" />:
            option previews, notes, a review step and question progress.
          </li>
          <li>
            <ComponentLink name="ToolApprovalFooter" />: approval scopes, risk levels, explanations,
            editable rule suggestions, the matched rule, the requesting agent and rejection with
            feedback.
          </li>
          <li>
            <ComponentLink name="BashTool" />: run metadata and formatted output (
            <C>showOutputMeta</C>, <C>formatOutput</C>, <C>maxOutputLines</C>,{" "}
            <C>commandSummary</C>).
          </li>
          <li>
            <ComponentLink name="EditTool" /> and <ComponentLink name="DiffView" />: word
            highlighting, line wrapping and syntax highlighting.
          </li>
          <li>
            <ComponentLink name="TodoTool" />: blockers, owners and <C>maxVisible</C>.
          </li>
          <li>
            <ComponentLink name="ToolRenderer" />: custom renderers keyed by the full part type (<C>tool-Bash</C>) override built-in cards and
            report actions through <C>onAction</C>.
          </li>
        </Bullets>
      </GuideSection>

      <GuideSection id="theming" title="Theming">
        <P>
          <ComponentLink name="AiKitProvider" /> applies the kit theme to a subtree inside your{" "}
          <C>MantineProvider</C>, with <C>accent</C>, <C>radius</C>, <C>density</C> and{" "}
          <C>colorScheme</C> settings, <C>tokens</C> and persistence.{" "}
          <ComponentLink name="AiKitThemeCustomizer" /> is a ready settings panel.{" "}
          <C>createAiKitTheme</C> and <C>mergeAiKitTheme</C> cover a global setup. The kit theme
          keeps destructive buttons readable (<C>--ae-danger-fill</C>), shows scrollbars on hover,
          styles field labels, <C>Kbd</C>, code blocks and <C>Stepper</C>, and opens dialogs with
          focus inside the body. See{" "}
          <Link href="/docs/theming" className={docLinkClass}>
            Theming
          </Link>
          .
        </P>
      </GuideSection>

      <GuideSection id="launcher" title="Launcher">
        <P>
          <ComponentLink name="ChatLauncher" /> is a floating chat button and panel.{" "}
          <C>mountChatLauncher</C> mounts it on any page in a shadow root. See{" "}
          <Link href="/docs/launcher" className={docLinkClass}>
            Embedding the launcher
          </Link>
          .
        </P>
      </GuideSection>

      <GuideSection id="testing" title="Testing">
        <Bullets>
          <li>
            Stories whose names end with <C>Flow</C> carry <C>play</C> functions that drive the
            component and check callbacks and the visible result. <C>yarn test:storybook</C> runs
            them together with a render check of every story.
          </li>
          <li>
            <C>yarn test:visual:baseline</C> records light and dark screenshots from a Storybook
            built from <C>main</C>, and <C>yarn test:visual</C> compares the branch with them.
            Baselines are not stored in git.
          </li>
        </Bullets>
      </GuideSection>
    </DocPageShell>
  );
}
