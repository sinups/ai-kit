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

const REACT = `import { useState } from "react";
import { AgentChat, ChatLauncher, type ChatMessage } from "@sinups/ai-kit";

export function SupportWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);

  return (
    <ChatLauncher
      title="Assistant"
      unreadCount={unread}
      onOpenedChange={(opened) => opened && setUnread(0)}
    >
      <AgentChat
        messages={messages}
        status="ready"
        onSend={({ content }) => sendToAgent(content, setMessages)}
        onStop={stopAgent}
        contentWidth="100%"
        wrapLines
        alignComposer
        emptyState={{
          title: "How can I help?",
          description: "Ask about your account, billing or the API.",
        }}
      />
    </ChatLauncher>
  );
}`;

const CONTROLLED = `const [opened, setOpened] = useState(false);

<Button onClick={() => setOpened(true)}>Ask the assistant</Button>
<ChatLauncher opened={opened} onOpenedChange={setOpened} position="bottom-left" offset={{ x: 16, y: 88 }}>
  <AgentChat {...chat} contentWidth="100%" wrapLines />
</ChatLauncher>`;

const MOUNT = `import mantineCss from "@mantine/core/styles.css?inline";
import kitCss from "@sinups/ai-kit/styles.css?inline";
import { AgentChat, AiKitProvider, ChatLauncher, mountChatLauncher } from "@sinups/ai-kit";

const host = document.createElement("div");
document.body.append(host);

const widget = mountChatLauncher(
  host,
  <ChatLauncher title="Assistant">
    <AgentChat {...chat} contentWidth="100%" wrapLines alignComposer />
  </ChatLauncher>,
  {
    styles: [mantineCss, kitCss],
    theme: { fontFamily: "system-ui, sans-serif" },
    colorScheme: "light",
    wrap: (element) => <AiKitProvider accent="indigo">{element}</AiKitProvider>,
  },
);

// Later, for example when the host page navigates away
widget.unmount();`;

const URLS = `mountChatLauncher(host, <SupportLauncher />, {
  styleUrls: [
    "https://cdn.example.com/widget/mantine-core.css",
    "https://cdn.example.com/widget/ai-kit.css",
  ],
});`;

const DEV = `mountChatLauncher(host, <SupportLauncher />, {
  adoptDocumentStyles: import.meta.env.DEV,
  styles: import.meta.env.DEV ? [] : [mantineCss, kitCss],
});`;

export default function LauncherPage() {
  const { previousHref, nextHref } = getDocNav("/docs/launcher");

  return (
    <DocPageShell
      sections={[
        { id: "react", label: "In a React app" },
        { id: "behavior", label: "Behavior" },
        { id: "mount", label: "On any page" },
        { id: "styles", label: "Styles in the shadow root" },
        { id: "options", label: "Mount options" },
        { id: "checklist", label: "Checklist" },
      ]}
    >
      <GuideHeader
        title="Embedding the launcher"
        description="Floating chat launcher for React apps and third-party pages."
        previousHref={previousHref}
        nextHref={nextHref}
      >
        <P>
          <ComponentLink name="ChatLauncher" /> is a round button in a corner of the viewport that
          opens a chat panel. Use it directly when the page is your React app. Use{" "}
          <C>mountChatLauncher</C> when the widget goes on a page you do not control: it renders the
          launcher in a shadow root with its own Mantine provider, so the page styles do not reach
          the widget and the widget styles do not leak out.
        </P>
      </GuideHeader>

      <GuideSection id="react" title="In a React app">
        <P>
          Render <C>ChatLauncher</C> anywhere inside your <C>MantineProvider</C> and pass the chat
          as children. Give <C>AgentChat</C> <C>contentWidth=&quot;100%&quot;</C> and{" "}
          <C>wrapLines</C>: the panel is 380px wide by default, and long code lines should wrap
          instead of scrolling sideways.
        </P>
        <DocCodeBlock code={REACT} language="tsx" />
        <P>
          The open state is uncontrolled by default. Control it with <C>opened</C> and{" "}
          <C>onOpenedChange</C> to open the panel from your own button:
        </P>
        <DocCodeBlock code={CONTROLLED} language="tsx" />
      </GuideSection>

      <GuideSection id="behavior" title="Behavior">
        <Bullets>
          <li>
            The panel is a non-modal dialog. Opening it moves focus into the chat composer; closing
            it with the header button or Escape returns focus to the launcher button.
          </li>
          <li>
            <C>keepMounted</C> is on by default: the chat keeps its messages, scroll position and
            draft while the panel is closed.
          </li>
          <li>
            The panel never exceeds the viewport. When it does not fit, the offset drops to 12px.
            With <C>mobileFullScreen</C> (on by default) the panel opens full screen below{" "}
            <C>fullScreenBreakpoint</C> (520px) and the page behind it stops scrolling.
          </li>
          <li>
            Scrolling the feed to its end does not scroll the host page.
          </li>
          <li>
            <C>unreadCount</C> shows a badge on the closed button and adds the count to its
            accessible name. <C>labels</C> translates the accessible names.
          </li>
          <li>
            <C>withinPortal</C> is on by default. Turn it off to place the launcher inside a
            positioned container, for example a preview frame.
          </li>
        </Bullets>
      </GuideSection>

      <GuideSection id="mount" title="On any page">
        <P>
          <C>mountChatLauncher(target, element, options)</C> attaches an open shadow root to{" "}
          <C>target</C> (or uses the shadow root you pass), creates a React root with a{" "}
          <C>MantineProvider</C> inside it and renders <C>element</C>. Portals of the widget (menus,
          popovers, modals) render inside the same shadow root. It returns <C>container</C> and{" "}
          <C>unmount()</C>.
        </P>
        <DocCodeBlock code={MOUNT} language="tsx" />
      </GuideSection>

      <GuideSection id="styles" title="Styles in the shadow root">
        <P>
          Page stylesheets do not apply inside a shadow root, so the widget needs the Mantine and
          kit stylesheets passed explicitly. Choose one of three ways:
        </P>
        <Bullets>
          <li>
            <C>styles</C>: CSS text, for example from a bundler import with <C>?inline</C> (shown
            above). <C>:root</C>, <C>html</C> and <C>body</C> selectors are rewritten to the widget
            container, so Mantine variables are declared on the widget and not on the page.
          </li>
          <li>
            <C>styleUrls</C>: stylesheet URLs linked as they are, without rewriting. Host copies of{" "}
            <C>@mantine/core/styles.css</C> and <C>@sinups/ai-kit/styles.css</C> next to your
            widget bundle.
          </li>
          <li>
            <C>adoptDocumentStyles</C>: copies the <C>&lt;style&gt;</C> and stylesheet links of the
            current document head. Use it in development, where CSS modules are injected at runtime.
          </li>
        </Bullets>
        <DocCodeBlock code={URLS} language="tsx" />
        <DocCodeBlock code={DEV} language="tsx" />
      </GuideSection>

      <GuideSection id="options" title="Mount options">
        <DocTable
          columns={["Option", "Default", "Description"]}
          rows={[
            [<C key="o">shadow</C>, <C key="d">true</C>, "Render in an open shadow root. With false the widget renders into target directly and page styles apply."],
            [<C key="o">styles</C>, <C key="d">[]</C>, "CSS text added to the shadow root, document-level selectors scoped to the widget."],
            [<C key="o">styleUrls</C>, <C key="d">[]</C>, "Stylesheet URLs linked in the shadow root without scoping."],
            [<C key="o">adoptDocumentStyles</C>, <C key="d">false</C>, "Copy stylesheets from the current document head."],
            [<C key="o">theme</C>, "none", "MantineThemeOverride of the widget provider."],
            [<C key="o">colorScheme</C>, <C key="d">&quot;light&quot;</C>, "Forced color scheme of the widget: light or dark."],
            [<C key="o">wrap</C>, "none", "Wraps the element inside the provider, for example with AiKitProvider."],
          ]}
        />
      </GuideSection>

      <GuideSection id="checklist" title="Checklist">
        <Bullets>
          <li>Both stylesheets reach the shadow root: Mantine first, then the kit.</li>
          <li>
            The widget has its own font in <C>theme.fontFamily</C>: inherited page fonts can differ
            from what you tested.
          </li>
          <li>
            <C>unmount()</C> is called when the host page removes the widget; it also removes the
            added style nodes.
          </li>
          <li>Check the panel at 390px viewport width: it opens full screen there.</li>
        </Bullets>
      </GuideSection>
    </DocPageShell>
  );
}
