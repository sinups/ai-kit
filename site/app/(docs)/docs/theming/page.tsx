import { DocCodeBlock } from "@/app/components/doc-code-block";
import { DocPageShell } from "@/app/components/doc-page-shell";
import {
  Bullets,
  C,
  ComponentLink,
  DocTable,
  GuideHeader,
  GuideSection,
  P,
} from "@/app/components/doc-guide";
import { getDocNav } from "@/app/utils/doc-nav";

const PROVIDER = `import "@mantine/core/styles.css";
import "@sinups/ai-kit/styles.css";

import { MantineProvider } from "@mantine/core";
import { AiKitProvider, McpSettingsPanel } from "@sinups/ai-kit";

export function App() {
  return (
    <MantineProvider theme={appTheme}>
      <AppHeader />
      <AiKitProvider accent="violet" radius="default" density="compact">
        <McpSettingsPanel servers={servers} />
      </AiKitProvider>
    </MantineProvider>
  );
}`;

const CUSTOMIZER = `import { AiKitProvider, AiKitThemeCustomizer } from "@sinups/ai-kit";

export function Settings() {
  return (
    <AiKitProvider persistKey="workspace-kit-theme">
      <AiKitThemeCustomizer sections={{ mode: false }} />
    </AiKitProvider>
  );
}`;

const CONTROLLED = `import { useState } from "react";
import {
  AiKitProvider,
  AiKitThemeCustomizer,
  type AiKitThemeSettings,
} from "@sinups/ai-kit";

export function ThemeSettings() {
  const [settings, setSettings] = useState<AiKitThemeSettings>({ accent: "indigo" });

  return (
    <>
      <AiKitThemeCustomizer
        value={settings}
        onChange={(next) => {
          setSettings(next);
          saveUserPreference(next);
        }}
        accents={["gray", "indigo", "violet"]}
      />
      <AiKitProvider {...settings}>
        <ChatScreen />
      </AiKitProvider>
    </>
  );
}`;

const HOOK = `import { Button } from "@mantine/core";
import { useAiKitTheme } from "@sinups/ai-kit";

export function CompactToggle() {
  const { settings, setSettings, reset, aiKit } = useAiKitTheme();

  return (
    <>
      <Button
        onClick={() =>
          setSettings({ density: settings.density === "compact" ? "default" : "compact" })
        }
      >
        Row height: {aiKit.controlHeights.row}
      </Button>
      <Button variant="subtle" onClick={reset}>
        Reset
      </Button>
    </>
  );
}`;

const OVERRIDES = `<AiKitProvider
  accent="blue"
  theme={{
    fontFamily: "Inter, sans-serif",
    components: { Button: { defaultProps: { size: "sm" } } },
  }}
  tokens={{
    "tool-radius": "12px",
    "user-message-bg": "var(--mantine-color-blue-light)",
  }}
>
  <AgentChat {...chat} />
</AiKitProvider>`;

const HOST_SCOPE = `<AiKitProvider accent="grape">
  <MasterDetail
    list={<AgentList agents={agents} onSelect={select} />}
    detail={
      <>
        <AiKitHostScope>
          <HostToolbar />
        </AiKitHostScope>
        <AgentDetail agent={selected} />
      </>
    }
  />
</AiKitProvider>`;

const CSS_TOKENS = `.support-chat {
  --ae-max-width: 720px;
  --ae-user-message-bg: var(--mantine-color-gray-1);
  --ae-tool-radius: 6px;
}`;

const GLOBAL = `import { MantineProvider } from "@mantine/core";
import { AI_KIT_SCOPE_CLASS, mergeAiKitTheme } from "@sinups/ai-kit";

export function App() {
  return (
    <MantineProvider theme={mergeAiKitTheme(appTheme)}>
      <div className={AI_KIT_SCOPE_CLASS}>
        <Routes />
      </div>
    </MantineProvider>
  );
}`;

const OPT_OUT = `<AiKitProvider>
  <Button unstyled>Keeps Mantine defaults</Button>
  <Button data-ai-kit-unstyled>Also opted out</Button>
</AiKitProvider>`;

export default function ThemingPage() {
  const { previousHref, nextHref } = getDocNav("/docs/theming");

  return (
    <DocPageShell
      sections={[
        { id: "how-it-works", label: "How theming works" },
        { id: "provider", label: "AiKitProvider" },
        { id: "settings", label: "Settings" },
        { id: "customizer", label: "Customizer panel" },
        { id: "hook", label: "Reading and changing settings" },
        { id: "overrides", label: "Theme and token overrides" },
        { id: "nesting", label: "Nesting in a host app" },
        { id: "global", label: "Global theme" },
        { id: "opt-out", label: "Opting out" },
      ]}
    >
      <GuideHeader
        title="Theming"
        description="Theme the kit with AiKitProvider, the customizer panel and --ae-* tokens."
        previousHref={previousHref}
        nextHref={nextHref}
      >
        <P>
          Kit components read two sets of CSS variables: the Mantine variables of your theme and the
          kit&apos;s own <C>--ae-*</C> tokens from <C>@sinups/ai-kit/styles.css</C>. Without any
          provider the kit already follows your primary color, fonts and color scheme.{" "}
          <C>AiKitProvider</C> adds the kit&apos;s visual language to the stock Mantine components
          used inside the kit (buttons, inputs, badges, alerts) and exposes a small set of settings.
        </P>
      </GuideHeader>

      <GuideSection id="how-it-works" title="How theming works">
        <Bullets>
          <li>
            <C>--ae-primary</C> points at <C>--mantine-primary-color-filled</C>, <C>--ae-font-*</C>{" "}
            at the Mantine font variables, and kit radii follow <C>theme.defaultRadius</C>. A host
            that already set <C>primaryColor</C>, <C>defaultRadius</C> and fonts gets a matching kit
            without configuration.
          </li>
          <li>
            Neutral surfaces (<C>--ae-bg</C>, <C>--ae-fg</C>, <C>--ae-border</C> and the rest) have a
            light and a dark value and switch with the Mantine color scheme. The dark values follow the
            Mantine dark scale: the page is <C>--mantine-color-body</C>, the composer and code blocks
            sit one step above it on <C>--mantine-color-dark-6</C>, and borders use{' '}
            <C>dark-5</C>, so the kit matches a dark host without configuration. White text on
            accent and danger fills keeps at least 4.5:1, and selected and progress indicators keep
            3:1 against the background.
          </li>
          <li>
            <C>AiKitProvider</C> applies <C>createAiKitTheme()</C> to its subtree only. Components
            outside the provider keep the host theme.
          </li>
          <li>
            Inside the kit, filled red buttons use <C>--ae-danger-fill</C> with white text (at least
            4.5:1 in both schemes), disabled ghost and light buttons keep their look at reduced
            opacity, scrollbars appear only on hover or focus, field labels share one xs style and
            dialogs open with focus inside the body instead of on the close button.
          </li>
        </Bullets>
      </GuideSection>

      <GuideSection id="provider" title="AiKitProvider">
        <P>
          Render <C>AiKitProvider</C> inside your <C>MantineProvider</C>, around the kit screens. It
          needs the host provider: it reads the host theme and color scheme from it.
        </P>
        <DocCodeBlock code={PROVIDER} language="tsx" />
        <P>
          Mantine writes CSS variables only at the document root. The provider therefore renders a
          scoped stylesheet with the variables that differ between the host theme and the kit theme,
          and adds its scope class to portals, so menus, modals and popovers opened from kit
          components look the same as the inline content. See the{" "}
          <ComponentLink name="AiKitProvider" /> reference for the full prop list.
        </P>
      </GuideSection>

      <GuideSection id="settings" title="Settings">
        <P>Every setting is optional. An unset value keeps the host value.</P>
        <DocTable
          columns={["Prop", "Values", "Effect"]}
          rows={[
            [
              <C key="p">accent</C>,
              <span key="v">
                <C>gray</C>, <C>blue</C>, <C>indigo</C>, <C>violet</C>, <C>grape</C>, <C>pink</C>
              </span>,
              <span key="e">
                Sets <C>primaryColor</C> and a <C>primaryShade</C> per scheme. Each accent is tested
                for 4.5:1 text contrast on its fill in both schemes.
              </span>,
            ],
            [
              <C key="p">radius</C>,
              <span key="v">
                <C>sharp</C>, <C>default</C>, <C>round</C>
              </span>,
              <span key="e">
                Sets <C>defaultRadius</C> to <C>xs</C>, <C>md</C> or <C>lg</C>. Composer, card, notice,
                row and button radii scale together.
              </span>,
            ],
            [
              <C key="p">density</C>,
              <span key="v">
                <C>default</C>, <C>compact</C>
              </span>,
              <span key="e">
                <C>default</C>: 20, 24 and 28px controls and 28px rows. <C>compact</C>: 20, 22 and
                24px controls and 24px rows.
              </span>,
            ],
            [
              <C key="p">colorScheme</C>,
              <span key="v">
                <C>light</C>, <C>dark</C>, <C>auto</C>
              </span>,
              <span key="e">
                Calls <C>setColorScheme</C> of the host provider, so it changes the color scheme of
                the whole app, not only the subtree.
              </span>,
            ],
            [
              <C key="p">persistKey</C>,
              <span key="v">string</span>,
              <span key="e">
                Saves changes made through <C>useAiKitTheme</C> or the customizer to localStorage
                under this key and restores them. Invalid stored values are ignored.
              </span>,
            ],
          ]}
        />
      </GuideSection>

      <GuideSection id="customizer" title="Customizer panel">
        <P>
          <ComponentLink name="AiKitThemeCustomizer" /> is a ready settings panel with Color, Radius,
          Density and Mode sections. Inside a provider it edits that provider&apos;s settings.{" "}
          <C>sections</C> hides sections, for example Mode when your app controls the color scheme;{" "}
          <C>accents</C> limits the offered colors; <C>labels</C> translates the text.
        </P>
        <DocCodeBlock code={CUSTOMIZER} language="tsx" />
        <P>
          To store the settings yourself, control the panel with <C>value</C> and <C>onChange</C>{" "}
          and pass the same object to the provider. <C>defaultValue</C> makes it uncontrolled
          without a provider.
        </P>
        <DocCodeBlock code={CONTROLLED} language="tsx" />
      </GuideSection>

      <GuideSection id="hook" title="Reading and changing settings">
        <P>
          <C>useAiKitTheme()</C> returns <C>settings</C> (props plus changes), <C>defaults</C>{" "}
          (props only), <C>setSettings(patch)</C>, <C>reset()</C>, <C>hostTheme</C> and{" "}
          <C>aiKit</C>, the resolved <C>theme.other.aiKit</C> values: <C>radii</C>,{" "}
          <C>controlHeights</C>, <C>density</C>, <C>contextPadding</C> and{" "}
          <C>userMessagePadding</C>. It throws outside a provider; <C>useOptionalAiKitTheme()</C>{" "}
          returns <C>null</C> there instead.
        </P>
        <DocCodeBlock code={HOOK} language="tsx" />
      </GuideSection>

      <GuideSection id="overrides" title="Theme and token overrides">
        <P>
          <C>theme</C> is a regular <C>MantineThemeOverride</C> merged on top of the kit theme.{" "}
          <C>tokens</C> sets <C>--ae-*</C> values for the subtree; keys are token names without the{" "}
          <C>--ae-</C> prefix, typed as <C>AeTokenOverrides</C>, and win over the settings. The full
          list of names is exported as <C>AE_TOKENS</C>.
        </P>
        <DocCodeBlock code={OVERRIDES} language="tsx" />
        <P>
          Tokens are ordinary CSS custom properties, so a stylesheet can also set them on any
          ancestor of a kit component:
        </P>
        <DocCodeBlock code={CSS_TOKENS} language="css" />
      </GuideSection>

      <GuideSection id="nesting" title="Nesting in a host app">
        <Bullets>
          <li>
            Put <C>AiKitProvider</C> below <C>MantineProvider</C>, never above it. Several providers
            with different settings can live on one page.
          </li>
          <li>
            Host UI rendered inside a kit subtree, for example your own toolbar between kit panels,
            goes into <C>AiKitHostScope</C>. It restores the host theme and host CSS variables for
            its children.
          </li>
          <li>
            If your stylesheet uses CSS layers, import <C>@sinups/ai-kit/styles.layer.css</C>{" "}
            instead of <C>styles.css</C>: it wraps the kit styles in <C>@layer mantine</C>.
          </li>
        </Bullets>
        <DocCodeBlock code={HOST_SCOPE} language="tsx" />
      </GuideSection>

      <GuideSection id="global" title="Global theme">
        <P>
          When the whole app should use the kit language, merge the kit theme into your theme
          instead of wrapping screens. <C>mergeAiKitTheme(appTheme)</C> keeps your values and fills
          the rest from the kit. Add the <C>ae-kit</C> class (<C>AI_KIT_SCOPE_CLASS</C>) to the app
          root; portals receive it from the theme. <C>createAiKitTheme(overrides)</C> returns the kit
          theme with your overrides on top, when you need the kit values to win.
        </P>
        <DocCodeBlock code={GLOBAL} language="tsx" />
      </GuideSection>

      <GuideSection id="opt-out" title="Opting out">
        <P>
          A stock component inside the kit subtree keeps its own <C>className</C>,{" "}
          <C>classNames</C> and <C>vars</C>; they add to the kit styles. To render it with plain
          Mantine styles, pass <C>unstyled</C>, <C>variant=&quot;unstyled&quot;</C> or{" "}
          <C>data-ai-kit-unstyled</C>.
        </P>
        <DocCodeBlock code={OPT_OUT} language="tsx" />
      </GuideSection>
    </DocPageShell>
  );
}
