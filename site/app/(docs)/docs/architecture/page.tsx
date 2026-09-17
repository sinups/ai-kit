import Link from "next/link";
import { DocCodeBlock } from "@/app/components/doc-code-block";
import { DocNavButton } from "@/app/components/doc-nav-button";
import { DocPageShell } from "@/app/components/doc-page-shell";
import { componentIdFromName } from "@/app/data/component-docs";
import { getDocNav } from "@/app/utils/doc-nav";

const LAYERS = `styles/            --ae-* tokens, keyframes
utils/, hooks/     pure functions and generic hooks, no JSX
primitives/        domain-neutral building blocks (Wizard, SettingsLayout, EntityList, ...)
<chat modules>     AgentChat, MessageList, input/, tools/, question/, elicitation/, ...
<domain modules>   mcp/, agents/, skills/, permissions/, hooks-config/, sessions/, tasks/,
                   message-actions/, diff/, model-settings/`;

const CONTROLLED_EXAMPLE = `<McpServerList
  servers={servers}                          // data comes from your app
  loading={isLoading}
  error={loadError}
  onRetry={reload}
  onReconnect={(server) => api.reconnect(server.id)}  // a promise: the action shows pending state
  onRemove={(server) => api.remove(server.id)}        // a rejection is shown in an alert
  labels={{ addServer: "Connect server" }}            // English defaults, override any label
/>`;

const FILES = `<module>/<Name>/<Name>.tsx          memo component, JSDoc on every prop
<module>/<Name>/<Name>.module.css   optional
<module>/<Name>/<Name>.story.tsx    Usage + Narrow + Wide (+ states: Loading, Error, Empty)
<module>/<Name>/<Name>.test.tsx     behavior tests with @mantine-tests/core + user-event
<module>/<logic>.ts + .test.ts      pure logic`;

const PRIMITIVES: Array<{ names: string[]; page: string; purpose: string }> = [
  {
    names: ["Wizard", "WizardModal", "useWizard"],
    page: "Wizard",
    purpose: "Multi-step flows: per-step validation, conditional steps, review step, non-linear editing",
  },
  {
    names: ["SettingsLayout", "SettingsSection", "SettingRow"],
    page: "SettingsLayout",
    purpose: "Settings screens: section navigation, titled groups, label/description/control rows",
  },
  {
    names: ["MasterDetail"],
    page: "MasterDetail",
    purpose: "List + detail: two panes when wide, stacked with a back action when narrow",
  },
  {
    names: ["EntityList", "EntityListItem"],
    page: "EntityList",
    purpose: "Searchable, filterable, groupable lists with the four data states and per-item actions",
  },
  {
    names: ["CommandPalette", "useFuzzySearch"],
    page: "CommandPalette",
    purpose: "Mod+K palette: fuzzy search, groups, shortcuts, recent items",
  },
  {
    names: ["ConfirmDialog"],
    page: "ConfirmDialog",
    purpose: "Confirmation for destructive actions with pending and error states",
  },
  {
    names: ["StatusBadge"],
    page: "StatusBadge",
    purpose: "One status vocabulary: idle, pending, running, success, warning, error, disabled, needs-auth",
  },
  {
    names: ["SchemaView"],
    page: "SchemaView",
    purpose: "JSON Schema as a parameter table: name, type, required, default, enum, nested objects",
  },
  {
    names: ["KeyValueEditor"],
    page: "KeyValueEditor",
    purpose: "Editable key/value pairs (env vars, headers) with secret masking and validation",
  },
  {
    names: ["ShortcutHint"],
    page: "ShortcutHint",
    purpose: "Keyboard shortcut rendered with Kbd, mod key resolved per platform",
  },
];

const linkClass = "text-an-primary-color hover:underline underline-offset-2";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="space-y-3 scroll-mt-8">
      <div className="text-base font-medium text-an-foreground">{title}</div>
      {children}
    </div>
  );
}

export default function ArchitecturePage() {
  const { previousHref, nextHref } = getDocNav("/docs/architecture");

  return (
    <DocPageShell
      sections={[
        { id: "layers", label: "Layers" },
        { id: "contract", label: "Component contract" },
        { id: "mantine", label: "Mantine only" },
        { id: "primitives", label: "Primitives" },
        { id: "files", label: "Files per component" },
        { id: "checks", label: "Checks" },
      ]}
    >
      <header className="space-y-2">
        <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-medium text-an-foreground">Architecture</h1>
          <DocNavButton
            title="Architecture"
            description="How AI UI Kit is organized and the contract every component follows."
            installCommand="npm install @sinups/ai-kit @mantine/core @mantine/hooks @tabler/icons-react"
            previousHref={previousHref}
            nextHref={nextHref}
          />
        </div>
        <p className="text-base text-muted-foreground">
          <code className="code-doc">@sinups/ai-kit</code> is a UI construction kit for agent
          products built on Mantine. It covers the chat itself and everything around it:
          multi-step wizards, settings screens, MCP servers, agents, skills, permissions, hooks,
          sessions, background tasks and diff review. Every piece works in a narrow widget (about
          360px) and in a full-page app (900px and wider).
        </p>
      </header>

      <Section id="layers" title="Layers">
        <DocCodeBlock code={LAYERS} language="text" />
        <p className="text-base text-muted-foreground">
          Dependencies point down only. A domain module may use primitives, utilities and chat
          modules; a primitive never imports a domain module; domain modules do not import each
          other except through exported types. Everything public is exported from the package
          root.
        </p>
      </Section>

      <Section id="contract" title="Component contract">
        <ul className="list-disc pl-5 space-y-2 text-base text-muted-foreground">
          <li>
            <span className="text-an-foreground">Presentational and controlled.</span> Components
            receive data through props and report intent through callbacks (
            <code className="code-doc">onSelect</code>, <code className="code-doc">onSave</code>,{" "}
            <code className="code-doc">onReconnect</code>). No fetching, no global stores, no
            routing: your app owns data and side effects.
          </li>
          <li>
            <span className="text-an-foreground">Async actions return promises.</span> While the
            promise is pending the button shows a loader; a rejection message is shown in an alert.
          </li>
          <li>
            <span className="text-an-foreground">Every data view handles four states:</span>{" "}
            loading (skeleton), error (alert with optional retry), empty (Mantine{" "}
            <code className="code-doc">EmptyState</code>) and data.
          </li>
          <li>
            <span className="text-an-foreground">Logic lives outside JSX.</span> Parsing,
            validation, filtering and formatting are pure, tested functions exported next to the
            components; reusable stateful logic is a hook (
            <code className="code-doc">useWizard</code>,{" "}
            <code className="code-doc">useFuzzySearch</code>).
          </li>
          <li>
            <span className="text-an-foreground">Domain types</span> are exported and stay
            compatible with the source protocol: the MCP specification for MCP components, the AI
            SDK <code className="code-doc">UIMessage</code> for chat.
          </li>
          <li>
            <span className="text-an-foreground">Labels</span> are English defaults that can be
            overridden through props, usually <code className="code-doc">labels</code>.
          </li>
          <li>
            <span className="text-an-foreground">Width.</span> Layout adapts to the component&apos;s
            own width, not the viewport: side by side when wide (list and detail, navigation and
            content), stacked with a back action when narrow.
          </li>
        </ul>
        <DocCodeBlock code={CONTROLLED_EXAMPLE} language="tsx" />
      </Section>

      <Section id="mantine" title="Mantine only">
        <p className="text-base text-muted-foreground">
          Components are built from Mantine components and the Styles API, so they follow your
          theme, color scheme and fonts. Peer dependencies are only{" "}
          <code className="code-doc">@mantine/core</code>,{" "}
          <code className="code-doc">@mantine/hooks</code> and{" "}
          <code className="code-doc">@tabler/icons-react</code>. Styles use{" "}
          <code className="code-doc">--mantine-*</code> and{" "}
          <code className="code-doc">--ae-*</code> variables, which you can override on any
          ancestor.
        </p>
      </Section>

      <Section id="primitives" title="Primitives">
        <p className="text-base text-muted-foreground">
          Domain modules such as{" "}
          <Link href="/docs/mcp-settings-panel" className={linkClass}>
            MCP
          </Link>
          ,{" "}
          <Link href="/docs/permission-rules-panel" className={linkClass}>
            Permissions
          </Link>{" "}
          and{" "}
          <Link href="/docs/hooks-panel" className={linkClass}>
            Hooks
          </Link>{" "}
          are assembled from these domain-neutral building blocks. Use them directly for your own
          screens.
        </p>
        <div className="rounded-[8px] border border-border overflow-hidden text-sm">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-3 py-2 font-medium text-muted-foreground border-b border-border">
            <div>Primitive</div>
            <div>Purpose</div>
          </div>
          <div className="divide-y divide-border">
            {PRIMITIVES.map((item) => (
              <div
                key={item.page}
                className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link href={`/docs/${componentIdFromName(item.page)}`} className={linkClass}>
                    {item.names.join(", ")}
                  </Link>
                </div>
                <div className="text-muted-foreground">{item.purpose}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="files" title="Files per component">
        <DocCodeBlock code={FILES} language="text" />
        <p className="text-base text-muted-foreground">
          Small modules keep components flat in the module folder, for example{" "}
          <code className="code-doc">tools/</code> and <code className="code-doc">input/</code>.
          Every component has stories for a narrow and a wide container.
        </p>
      </Section>

      <Section id="checks" title="Checks">
        <p className="text-base text-muted-foreground">
          In the repository, <code className="code-doc">yarn test</code> runs dependency checks,
          formatting, type checking, lint and unit tests; <code className="code-doc">yarn build</code>{" "}
          builds the package and <code className="code-doc">yarn storybook</code> serves the
          stories.
        </p>
      </Section>
    </DocPageShell>
  );
}
