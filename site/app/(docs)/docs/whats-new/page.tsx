import Link from 'next/link';
import type { ReactNode } from 'react';
import { DocCodeBlock } from '@/app/components/doc-code-block';
import { DocPageShell } from '@/app/components/doc-page-shell';
import {
  Bullets,
  C,
  ComponentLink,
  docLinkClass,
  GuideHeader,
  GuideSection,
  P,
} from '@/app/components/doc-guide';
import { getDocNav } from '@/app/utils/doc-nav';

type ModuleEntry = { title: string; components: string[]; note: ReactNode };

const MODULES: ModuleEntry[] = [
  {
    title: 'Primitives',
    components: [
      'Wizard',
      'SettingsLayout',
      'SettingsModal',
      'MasterDetail',
      'EntityList',
      'CommandPalette',
      'ConfirmDialog',
      'KeyValueEditor',
      'SchemaView',
      'StatusBadge',
      'ShortcutHint',
      'ValidationErrorsList',
      'InvalidSettingsNotice',
    ],
    note: (
      <>
        Domain-neutral building blocks: multi-step flows with validation (<C>WizardModal</C>,{' '}
        <C>useWizard</C>), settings screens (<C>SettingsSection</C>, <C>SettingRow</C>), list and
        detail panes, searchable lists (<C>EntityListItem</C>), a Mod+K palette (
        <C>useFuzzySearch</C>) and one status vocabulary.
      </>
    ),
  },
  {
    title: 'MCP',
    components: [
      'McpSettingsPanel',
      'McpServerList',
      'McpServerDetail',
      'McpToolDetail',
      'McpServerWizard',
      'McpImportDialog',
      'McpDiscoveredServers',
      'McpConfigWarnings',
      'McpToolAnnotationBadges',
      'McpTransportIcon',
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
    title: 'Agents',
    components: [
      'AgentsSettingsPanel',
      'AgentList',
      'AgentDetail',
      'AgentEditor',
      'AgentCreateWizard',
      'ToolSelector',
      'AgentAvatar',
      'AgentIdentityFields',
    ],
    note: (
      <>
        Agent definitions: list, detail, editor, creation wizard and tool selection. The form fields
        are exported separately (<C>AgentPromptField</C>, <C>AgentModelFields</C>,{' '}
        <C>AgentColorPicker</C>).
      </>
    ),
  },
  {
    title: 'Skills',
    components: [
      'SkillsSettingsPanel',
      'SkillCatalog',
      'SkillDetail',
      'SkillEditor',
      'SkillPicker',
    ],
    note: 'Skill catalog by source, detail, an editor with validation and a multi-select picker for forms such as an agent editor.',
  },
  {
    title: 'Permissions',
    components: [
      'PermissionRulesPanel',
      'AddPermissionRuleWizard',
      'PermissionRuleInput',
      'PermissionModeSelector',
    ],
    note: 'Allow, ask and deny rules with search, counts, a warning for broad rules and a rule wizard.',
  },
  {
    title: 'Hooks',
    components: ['HooksPanel', 'HookWizard'],
    note: 'Lifecycle hooks grouped by event, with an enable switch per hook, matcher validation and payload examples.',
  },
  {
    title: 'Memory',
    components: ['MemoryPanel', 'MemoryFileDetail'],
    note: 'Memory files by scope with search, a Markdown preview and an inline editor.',
  },
  {
    title: 'Sessions',
    components: ['SessionList', 'SessionPreview', 'ExportDialog'],
    note: 'Session history grouped by date with search, pinned and archived filters, per-session actions and export.',
  },
  {
    title: 'Message actions',
    components: [
      'MessageActions',
      'EditMessageComposer',
      'FeedbackForm',
      'PlanApproval',
      'RewindDialog',
      'ToolResultNotice',
      'MemoryNotice',
      'CommandChip',
    ],
    note: (
      <>
        Edit, retry, rewind, branch, copy and feedback under messages. Pass them to <C>AgentChat</C>{' '}
        through <C>messageActions</C>.
      </>
    ),
  },
  {
    title: 'Background tasks',
    components: [
      'BackgroundTasksPanel',
      'TaskList',
      'TaskDetail',
      'AgentTree',
      'TaskStatusPill',
      'AgentMessage',
      'TaskElapsed',
    ],
    note: (
      <>
        Running and finished tasks and subagents as a list or a tree, with detail, stop and retry.{' '}
        <C>BackgroundTasksDrawer</C> opens the panel in a drawer.
      </>
    ),
  },
  {
    title: 'Diff review',
    components: ['DiffReview', 'DiffFileList', 'DiffFileView', 'DiffStats'],
    note: (
      <>
        Multi-file review with unified and split views, word highlighting, viewed marks, j/k
        navigation and accept or reject per file. <C>DiffReviewModal</C> opens it in a modal.
      </>
    ),
  },
  {
    title: 'Model settings and help',
    components: [
      'ModelSettingsPanel',
      'EffortSelector',
      'OutputStylePicker',
      'UsagePanel',
      'StatusPanel',
      'CommandsHelp',
    ],
    note: 'Model, reasoning effort and output style, token and cost usage with plan limits, an environment summary, commands and shortcuts.',
  },
  {
    title: 'Elicitation',
    components: ['ElicitationForm'],
    note: 'Forms built from MCP elicitation schemas, including URL requests.',
  },
];

const CHAT_COMPONENTS: Array<{ name: string; note: string }> = [
  {
    name: 'AgentStatus',
    note: 'Live status line with elapsed time, tokens and stall detection (useStalled).',
  },
  {
    name: 'ContextUsage',
    note: 'Context window ring with warning and danger levels and a compact action.',
  },
  {
    name: 'ContextBreakdown',
    note: 'What fills the context window, group by group, with suggestions to free space.',
  },
  { name: 'CompactBoundary', note: 'Marker where earlier history was replaced with a summary.' },
  { name: 'TurnSummary', note: 'End-of-turn row: duration, tokens, running background tasks.' },
  { name: 'ContextEventRow', note: 'Files, memories, skills or diagnostics pulled into context.' },
  { name: 'HookActivity', note: 'Hooks that ran for an event, and why they blocked or failed.' },
  {
    name: 'IdleReturnPrompt',
    note: 'Offers to keep or restart a long conversation after a break.',
  },
  {
    name: 'SpendThresholdNotice',
    note: 'Tells the user that the session spend passed a threshold.',
  },
  { name: 'TranscriptSearch', note: 'Conversation search opened with Mod+F.' },
  { name: 'PromptHistorySearch', note: 'Fuzzy search over sent prompts opened with Mod+R.' },
  { name: 'PastedTextAttachment', note: 'Chip for a long paste collapsed out of the composer.' },
  { name: 'CodeBlock', note: 'Code with optional syntax highlighting and collapsing.' },
  { name: 'ShellOutput', note: 'Command output with ANSI colors, links, JSON and a tail view.' },
];

const INSTALL = `npm install @sinups/ai-kit @mantine/core @mantine/hooks @tabler/icons-react`;

const MIGRATION = `// Before
<AgentChat {...chat} suggestions={suggestions} emptySuggestionsPosition="bottom" />

// After: suggestions render above the composer
<AgentChat {...chat} suggestions={suggestions} />

// Or a centered greeting with pills above the composer
<AgentChat {...chat} emptyState={{ layout: "center", title: "What should we work on?", suggestions }} />`;

const QUESTION_BAR = `// Before (0.1.x): one callback for answers and for skipping
<InputBar
  questionBar={{
    id: "deploy",
    questions,
    onSubmit: (answer) => {
      if (answer.kind === "skip") closePanel();
      else saveAnswer(answer);
    },
  }}
/>

// After (0.2.0): onSubmit gets the 1-based question index, skipping has its own callback
<InputBar
  questionBar={{
    id: "deploy",
    questions,
    onSubmit: (answer, { questionIndex }) => saveAnswer(questionIndex, answer),
    onSkip: ({ questionIndex }) => closePanel(questionIndex),
  }}
/>`;

const APPROVAL_LABELS = `// Before
<BashTool {...step} approval={{ onApprove, onReject, approveLabel: "Run it", rejectLabel: "No" }} />

// After: button texts sit with the other footer texts
<BashTool
  {...step}
  approval={{ onApprove, onReject, labels: { approve: "Run it", reject: "No" } }}
/>`;

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
  const { previousHref, nextHref } = getDocNav('/docs/whats-new');

  return (
    <DocPageShell
      sections={[
        { id: 'unreleased', label: 'Unreleased' },
        { id: 'next', label: '0.3.0' },
        { id: 'next-defaults', label: 'Changed defaults in 0.3.0' },
        { id: 'overview', label: 'Overview' },
        { id: 'breaking', label: 'Breaking changes' },
        { id: 'package', label: 'Package' },
        { id: 'deprecations', label: 'Deprecations' },
        { id: 'modules', label: 'New modules' },
        { id: 'chat', label: 'New chat components' },
        { id: 'changed', label: 'Changed components' },
        { id: 'theming', label: 'Theming' },
        { id: 'launcher', label: 'Launcher' },
        { id: 'testing', label: 'Testing' },
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
          props and gain new optional ones, with one exception: the <C>InputBar</C> question bar
          changed its callbacks. Installation changes: icons become a peer dependency and the peer
          ranges move to Mantine 9.4 and React 19.2.
        </P>
      </GuideHeader>

      <GuideSection id="unreleased" title="Unreleased">
        <Bullets>
          <li>
            MCP calls are read strictly by the MCP specification. A result is the{' '}
            <C>CallToolResult</C> (or its bare content array): <C>structuredContent</C> by the{' '}
            <C>outputSchema</C> of the catalog, else the content blocks by type — text as it is,
            images and audio as a preview and a player, resources as chips, <C>isError</C> as a
            failure. The kit no longer guesses: text is not parsed as JSON, lists are counted only when
            the schema declares an array, envelope and pagination keys mean nothing, dates are dates
            only by <C>format</C>. Arguments follow <C>inputSchema</C> and are no longer unfolded from
            JSON strings (<C>unfoldToolArgs</C> is deprecated). Annotation badges apply the defaults of
            the specification: without <C>readOnlyHint</C> a tool may be destructive and reach an
            open world.
          </li>
          <li>
            What stays: custom <C>toolRenderers</C> and <C>toolOutputs</C> formatters get{' '}
            <C>output</C> with the same value as in 0.3 — for an MCP tool the text of its content,
            parsed when it holds JSON — and <C>unwrapToolOutput</C>, <C>unwrapMcpOutput</C> and{' '}
            <C>getToolOutputValue</C> return what they returned. New next to it: <C>result</C>, the{' '}
            <C>CallToolResult</C> of the call, and <C>structuredContent</C> on renderers. Prefer{' '}
            <C>result</C>; <C>output</C> is kept for existing code. What changes is only what the kit
            shows by itself, as described above.
          </li>
          <li>
            The dark theme follows the Mantine dark scale: the page is the host body color
            (<C>--mantine-color-body</C>) instead of near-black, the composer, tool cards and code
            blocks sit one step above it on <C>dark-6</C>, the header of a code block is only a shade
            lighter than its body, borders are softer, and the switch and progress track is a little
            darker. White text on accent and danger fills keeps at least 4.5:1. Dark screenshots
            change accordingly.
          </li>
          <li>
            <C>partRenderers</C> on <ComponentLink name="AgentChat" /> and{' '}
            <ComponentLink name="MessageList" /> renders your own part types, keyed by{' '}
            <C>part.type</C>; parts without a renderer stay hidden as before.
          </li>
          <li>
            <C>draft</C> and <C>onDraftChange</C> control the composer text of <C>AgentChat</C>, for
            example to ask about a selection; without them the chat keeps its own draft.
          </li>
          <li>
            <C>messageActions.actions</C> and <ComponentLink name="MessageActions" />{' '}
            <C>actions</C> add your buttons to the message toolbar; <C>MessageActionButton</C>{' '}
            gives them the look of the built-in ones.
          </li>
          <li>
            <C>sendScroll=&quot;prompt-top&quot;</C> puts a sent question at the top and grows the
            answer under it; <C>streamingCaret</C> shows a caret after the growing text;{' '}
            <C>lazyTurns</C> skips layout of finished turns out of view. All are off by default.
          </li>
          <li>
            The transcript is a <C>log</C> that is busy while an answer streams, and screen readers
            hear <C>labels.answerReady</C>, <C>labels.answerFailed</C> or{' '}
            <C>labels.answerStopped</C> once when it ends.
          </li>
          <li>
            <C>MarkdownLinksProvider</C> (or <C>onLinkClick</C> and <C>linkSchemes</C> on{' '}
            <ComponentLink name="Markdown" />) handles link clicks and allows schemes such as{' '}
            <C>artifact:</C>; <C>javascript:</C>, <C>vbscript:</C>, <C>data:</C>, <C>blob:</C> and{' '}
            <C>file:</C> links render as text.
          </li>
          <li>
            <ComponentLink name="MediaPart" />: <C>createMediaPartRenderers()</C> shows <C>file</C>{' '}
            parts of an answer as an image with a preview, a native audio or video player, or a file
            chip.
          </li>
          <li>
            <ComponentLink name="ArtifactPanel" /> with <C>useArtifactPanel</C> opens an artifact
            next to the chat or in a drawer, and <C>createArtifactPartRenderer</C> renders{' '}
            <C>artifact</C> parts as cards that open it.
          </li>
          <li>
            <ComponentLink name="FileAttachment" /> shows uploads: <C>status</C>,{' '}
            <C>progress</C>, <C>error</C>, <C>onCancel</C> and <C>onRetry</C>.{' '}
            <ComponentLink name="InputBar" /> passes them through with{' '}
            <C>onCancelFile</C> and <C>onRetryFile</C> and keeps Send off while a file uploads.
          </li>
          <li>
            <C>filterFiles</C> and <C>useFileIntake</C> apply one <C>accept</C>, <C>maxFiles</C>{' '}
            and <C>maxFileSize</C> policy to picked, pasted and dropped files;{' '}
            <ComponentLink name="ChatDropZone" /> takes files dropped anywhere on the chat.
          </li>
          <li>
            Voice controls that leave audio to you: <ComponentLink name="MicButton" />,{' '}
            <ComponentLink name="VoiceLevel" /> and <ComponentLink name="SpeakingIndicator" />.
          </li>
          <li>
            <ComponentLink name="CommandToggles" /> pins commands to the composer, and{' '}
            <ComponentLink name="StarterCategories" /> groups starter questions in{' '}
            <C>emptyState.content</C>, a new slot for host content in an empty chat.
          </li>
        </Bullets>
      </GuideSection>

      <GuideSection id="next" title="0.3.0">
        <P>
          New props of <ComponentLink name="AgentChat" /> and <ComponentLink name="MessageList" />,
          the composer and the mode picker. Some defaults of <C>AgentChat</C> changed as well; see{' '}
          <a href="#next-defaults" className={docLinkClass}>
            Changed defaults in 0.3.0
          </a>
          .
        </P>
        <Bullets>
          <li>
            <C>presentation</C>: <C>&apos;cards&apos;</C> by default, <C>rowsPresentation</C> for the
            flat transcript of a terminal client, <C>quietPresentation</C> for muted MCP lines and
            one folded line per turn such as <C>Thought · used 2 tools · 26s</C>. Both are imported
            values, so they reach the bundle only when used.
          </li>
          <li>
            <C>toolCatalog</C> (tool definitions keyed by <C>mcp__&lt;server&gt;__&lt;tool&gt;</C>:{' '}
            <C>title</C>, <C>description</C>, <C>annotations</C>, <C>inputSchema</C>),{' '}
            <C>toolArgs</C> and <C>toolOutputs</C> formatters, and <C>locale</C> for numbers and
            dates in tool arguments and results.
          </li>
          <li>
            <C>approvals</C> attaches Allow/Deny to any call by <C>toolCallId</C>;{' '}
            <C>ToolApprovalsProvider</C> does the same for a standalone <C>MessageList</C>, and{' '}
            <C>labels.toolApproval.scopes</C> names the scope in the settled line.
          </li>
          <li>
            <C>labels</C> covers the whole chat by section, including <C>durationUnits</C>,{' '}
            <C>thinkingTool</C>, <C>messageList.toolRuns</C> and <C>messageList.planning</C>;{' '}
            <C>ChatLabelsProvider</C> does the same for a standalone list.
          </li>
          <li>
            <C>evenSpacing</C>, <C>workingRow</C>, <C>toolActivity</C>, <C>animateAppearance</C>{' '}
            and <C>frameBatched</C> control spacing, the working line, the timer of running calls,
            the fade-in of new parts and how often the streaming answer commits.
          </li>
          <li>
            <ComponentLink name="ThinkingTool" /> shows <C>Thinking</C> with a timer while the part
            streams and <C>Thought for 4s</C> after it; both texts are labels.
          </li>
          <li>
            <ComponentLink name="InputBar" />: <C>contextItems</C> shows context chips above the
            text, for example the open document; <C>onRemoveContext</C> adds a remove button to each
            chip and <C>onRestoreContext</C> shows removed items as a line that brings them back.
          </li>
          <li>
            <ComponentLink name="ModeSelector" />: <C>labels.title</C> adds a heading to the open
            menu, a mode&apos;s <C>badge</C> marks it, for example <C>Default</C>, and{' '}
            <C>shortcuts</C> picks a mode by its digit while the menu is open.
          </li>
        </Bullets>
      </GuideSection>

      <GuideSection id="next-defaults" title="Changed defaults in 0.3.0">
        <P>These change what an existing app renders without code changes. Each one can be undone.</P>
        <Bullets>
          <li>
            <C>AgentChat</C> now turns on <C>frameBatched</C>, <C>animateAppearance</C>,{' '}
            <C>workingRow</C> and <C>toolActivity</C> by default. A standalone{' '}
            <C>MessageList</C> keeps all four off. To get the old chat, pass{' '}
            <C>frameBatched={'{false}'}</C>, <C>animateAppearance={'{false}'}</C>,{' '}
            <C>workingRow={'{false}'}</C> and <C>toolActivity={'{false}'}</C>.
          </li>
          <li>
            <ComponentLink name="ToolRowBase" /> and <ComponentLink name="AgentStatus" /> keep a
            status on screen for at least 600ms before a newer one replaces it, so a step that ends
            in a few frames does not flash. <C>minStatusMs={'{0}'}</C> switches back to immediate
            updates.
          </li>
          <li>
            Durations from one hour up read <C>1h 5m</C> instead of <C>65m 3s</C>. The units come
            from <C>labels.durationUnits</C>.
          </li>
          <li>
            <C>--ae-user-message-y</C>, the vertical padding of the user bubble, is 6px instead of
            10px, also without <C>AiKitProvider</C>. Set the token to <C>10px</C> on an ancestor to
            keep the old bubble.
          </li>
          <li>
            Timers in status rows share one animation frame loop and stop while the tab is hidden;
            they catch up when it becomes visible again.
          </li>
          <li>
            Types: <C>InputBarLabels</C> has new required keys (<C>send</C>, <C>stop</C>,{' '}
            <C>closeInfoBar</C>, <C>attach</C>, <C>attachment</C>, <C>question</C>,{' '}
            <C>questionHeader</C>, <C>removeContext</C>, <C>restoreContext</C>), and{' '}
            <C>ToolApprovalLabels</C> has <C>scopes</C>. This only affects code that declares a full
            labels object; the <C>labels</C> props take <C>Partial</C> objects and need no change.
          </li>
          <li>
            Package: type declarations are split into <C>index.d.mts</C> for <C>import</C> and{' '}
            <C>index.d.ts</C> for <C>require</C>.
          </li>
        </Bullets>
      </GuideSection>

      <GuideSection id="overview" title="Overview">
        <Bullets>
          <li>
            New components follow one contract: controlled props, async callbacks with pending and
            error states, loading, error and empty states, and layout by their own width. See{' '}
            <Link href="/docs/architecture" className={docLinkClass}>
              Architecture
            </Link>
            .
          </li>
          <li>
            Logic is exported as pure functions and hooks. See{' '}
            <Link href="/docs/utilities" className={docLinkClass}>
              Hooks and utilities
            </Link>
            .
          </li>
          <li>
            Page recipes for full-page chat, sidebars, inspectors and settings are on{' '}
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
            Peer ranges now match what the kit is built on: <C>@mantine/core</C> and{' '}
            <C>@mantine/hooks</C> 9.4 or later, <C>react</C> and <C>react-dom</C> 19.2 or later,{' '}
            <C>@tabler/icons-react</C> 3.
          </li>
          <li>
            The package declares <C>sideEffects</C>, so bundlers keep only the components you
            import. Keep importing <C>@sinups/ai-kit/styles.css</C> once at the app root.
          </li>
          <li>
            <ComponentLink name="InputBar" />: <C>questionBar.onSubmit</C> now runs for every
            answered question and receives the 1-based <C>{'{ questionIndex }'}</C> as a second
            argument. Skipping no longer arrives as an answer with <C>kind: &quot;skip&quot;</C>: it
            calls <C>questionBar.onSkip({'{ questionIndex }'})</C> and closes the panel.
          </li>
        </Bullets>
        <DocCodeBlock code={INSTALL} language="bash" />
        <DocCodeBlock code={QUESTION_BAR} language="tsx" />
      </GuideSection>

      <GuideSection id="package" title="Package">
        <Bullets>
          <li>
            Styles can be imported per component, like <C>@mantine/core/styles/Button.css</C>:{' '}
            <C>@sinups/ai-kit/styles/base.css</C> once, then <C>styles/Wizard.css</C>,{' '}
            <C>styles/AgentChat.css</C> and so on. Each file includes the styles of the components
            it renders. <C>styles.css</C> with everything stays. See{' '}
            <Link href="/docs/installation" className={docLinkClass}>
              Installation
            </Link>{' '}
            and{' '}
            <Link href="/docs/bundle-size" className={docLinkClass}>
              Bundle size
            </Link>
            .
          </li>
          <li>
            Projects with <C>moduleResolution: node16</C> in ESM mode now get the kit types instead
            of <C>any</C>.
          </li>
          <li>
            Source maps are no longer published: the unpacked package is 3.4 MB instead of 13.9 MB,
            the tarball 0.72 MB instead of 1.77 MB.
          </li>
        </Bullets>
      </GuideSection>

      <GuideSection id="deprecations" title="Deprecations">
        <P>
          <C>AgentChat</C> <C>emptySuggestionsPosition</C> is deprecated. Suggestions always render
          above the composer, and <C>&quot;bottom&quot;</C> behaves as <C>&quot;top&quot;</C>.{' '}
          <C>InputBar</C> places suggestion pills above the field as well. Remove the prop; for a
          centered start screen use <C>emptyState</C> with <C>layout: &quot;center&quot;</C>.
        </P>
        <DocCodeBlock code={MIGRATION} language="tsx" />
        <P>
          <ComponentLink name="ToolApprovalFooter" /> <C>approval.approveLabel</C> and{' '}
          <C>approval.rejectLabel</C> are deprecated. Both still work; the button texts now live
          with the rest of the footer texts in <C>labels.approve</C> and <C>labels.reject</C>.
        </P>
        <DocCodeBlock code={APPROVAL_LABELS} language="tsx" />
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
          <C>MessageList</C> renders the new message parts <C>compaction</C>, <C>turn-summary</C>,{' '}
          <C>context-event</C> and <C>hook-activity</C> with these components.
        </P>
      </GuideSection>

      <GuideSection id="changed" title="Changed components">
        <Bullets>
          <li>
            <ComponentLink name="AgentChat" />: <C>emptyState</C> (welcome and center layouts),{' '}
            <C>emptyStateWidth</C>, <C>statusBar</C>, <C>messageActions</C>, <C>onRetry</C>,{' '}
            <C>onToolAction</C>, <C>withSearch</C>, <C>stickyPrompt</C>, <C>longMessageThreshold</C>
            , <C>highlighter</C>, <C>collapseToolRuns</C>, <C>alignComposer</C>, <C>topFade</C>,{' '}
            <C>wrapLines</C>, <C>responsiveTables</C>, <C>hideSuggestionsWhenNotEmpty</C>,{' '}
            <C>inputBarProps</C>. <C>contentWidth</C> accepts any CSS width.
          </li>
          <li>
            <ComponentLink name="MessageList" />: the same feed options, plus <C>searchOpened</C>,{' '}
            <C>onSearchOpenedChange</C>, <C>commands</C>, <C>onScrollbarWidthChange</C>,{' '}
            <C>labels</C> and a new-messages button.
          </li>
          <li>
            <ComponentLink name="InputBar" />: <C>completions</C> for <C>/</C> and <C>@</C>{' '}
            triggers, a message queue (<C>onQueue</C>, <C>queuedMessages</C>, <C>onRemoveQueued</C>
            ), collapsed long pastes (<C>pasteCollapseThreshold</C>), prompt history (<C>history</C>
            , <C>historySearchHotkey</C>, <C>onHistorySearch</C>), <C>labels</C>.
          </li>
          <li>
            <ComponentLink name="ErrorMessage" />: <C>variant</C>, <C>retry</C> countdown,{' '}
            <C>resetsAt</C>, <C>collapsible</C>, <C>onRetry</C>.
          </li>
          <li>
            <ComponentLink name="Markdown" />: <C>streaming</C> re-parses only the growing tail;{' '}
            <C>highlighter</C>, <C>wrapLines</C>, <C>responsiveTables</C>.
          </li>
          <li>
            <ComponentLink name="UserMessage" />: slash command chips (<C>commands</C>) and
            collapsing of long messages (<C>longMessageThreshold</C>).
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
            <C>withOutputMeta</C>, <C>formatOutput</C>, <C>commandSummary</C>). The line budget{' '}
            <C>maxOutputLines</C> is a prop of <C>BashToolTerminalCard</C>, the card BashTool
            renders.
          </li>
          <li>
            <ComponentLink name="EditTool" /> and <ComponentLink name="DiffView" />: word
            highlighting, line wrapping and syntax highlighting.
          </li>
          <li>
            <ComponentLink name="TodoTool" />: blockers, owners and <C>maxVisible</C>.
          </li>
          <li>
            <ComponentLink name="ToolRenderer" />: custom renderers keyed by the full part type (
            <C>tool-Bash</C>) override built-in cards and report actions through <C>onAction</C>.
          </li>
        </Bullets>
      </GuideSection>

      <GuideSection id="theming" title="Theming">
        <P>
          <ComponentLink name="AiKitProvider" /> applies the kit theme to a subtree inside your{' '}
          <C>MantineProvider</C>, with <C>accent</C>, <C>radius</C>, <C>density</C> and{' '}
          <C>colorScheme</C> settings, <C>tokens</C> and persistence.{' '}
          <ComponentLink name="AiKitThemeCustomizer" /> is a ready settings panel.{' '}
          <C>createAiKitTheme</C> and <C>mergeAiKitTheme</C> cover a global setup. The kit theme
          keeps destructive buttons readable (<C>--ae-danger-fill</C>), shows scrollbars on hover,
          styles field labels, <C>Kbd</C>, code blocks and <C>Stepper</C>, and opens dialogs with
          focus inside the body. See{' '}
          <Link href="/docs/theming" className={docLinkClass}>
            Theming
          </Link>
          .
        </P>
      </GuideSection>

      <GuideSection id="launcher" title="Launcher">
        <P>
          <ComponentLink name="ChatLauncher" /> is a floating chat button and panel.{' '}
          <C>mountChatLauncher</C> mounts it on any page in a shadow root. See{' '}
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
