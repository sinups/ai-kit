import Link from "next/link";
import { CliCommands } from "@/app/components/cli-commands";
import { DocCodeBlock } from "@/app/components/doc-code-block";
import { DocNavButton } from "@/app/components/doc-nav-button";
import { DocPageShell } from "@/app/components/doc-page-shell";
import { getDocNav } from "@/app/utils/doc-nav";

const STYLES_EXAMPLE = `import "@mantine/core/styles.css";
import "@sinups/ai-kit/styles.css";`;

const PROVIDER_EXAMPLE = `import { MantineProvider } from "@mantine/core";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}`;

const USAGE_EXAMPLE = `"use client";

import { AgentChat } from "@sinups/ai-kit";
import type { ChatMessage } from "@sinups/ai-kit";

const messages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    parts: [{ type: "text", text: "Welcome to AI UI Kit." }],
  },
];

export default function App() {
  return (
    <div style={{ height: 600 }}>
      <AgentChat
        messages={messages}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
      />
    </div>
  );
}`;

const USE_CHAT_EXAMPLE = `"use client";

import { AgentChat } from "@sinups/ai-kit";
import { useChat } from "@ai-sdk/react";

export default function Chat() {
  const { messages, status, sendMessage, stop } = useChat();

  return (
    <AgentChat
      messages={messages}
      status={status}
      onSend={({ content }) => sendMessage({ text: content })}
      onStop={stop}
    />
  );
}`;

export default function InstallationPage() {
  const { previousHref, nextHref } = getDocNav("/docs/installation");

  return (
    <DocPageShell
      sections={[
        { id: "prerequisites", label: "Prerequisites" },
        { id: "install", label: "Install the package" },
        { id: "styles", label: "Styles and provider" },
        { id: "usage", label: "Usage" },
      ]}
    >
      <header className="space-y-2">
        <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-medium text-an-foreground">
            Installation
          </h1>
          <DocNavButton
            title="Installation"
            description="Install AI UI Kit from npm."
            installCommand="npm install @sinups/ai-kit @mantine/core @mantine/hooks @tabler/icons-react"
            previousHref={previousHref}
            nextHref={nextHref}
          />
        </div>
        <p className="text-base text-muted-foreground">
          AI UI Kit is a regular npm package. Install it next to{" "}
          <code className="code-doc">@mantine/core</code>, import the
          stylesheet once, and every component is available from the package
          root.
        </p>
      </header>

      <div id="prerequisites" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Prerequisites
        </div>
        <ul className="list-disc pl-5 space-y-1 text-base text-muted-foreground">
          <li>Node 18+</li>
          <li>React 19.2+</li>
          <li>
            Mantine 9.4+ (<code className="code-doc">@mantine/core</code> and{" "}
            <code className="code-doc">@mantine/hooks</code>)
          </li>
          <li>
            <code className="code-doc">@tabler/icons-react</code> 3
          </li>
        </ul>
        <p className="text-base text-muted-foreground">
          No Tailwind, no shadcn, no path aliases. If your app already uses
          Mantine you are ready to go.
        </p>
      </div>

      <div id="install" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Install the package
        </div>
        <p className="text-base text-muted-foreground">
          One package contains the whole library: chat surface, composer, tool
          cards and streaming states. Tree-shaking keeps only what you import.
        </p>
        <CliCommands />
      </div>

      <div id="styles" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Styles and provider
        </div>
        <p className="text-base text-muted-foreground">
          Import the Mantine stylesheet and the package stylesheet at the root
          of your application:
        </p>
        <DocCodeBlock code={STYLES_EXAMPLE} language="tsx" />
        <p className="text-base text-muted-foreground">
          Components render inside{" "}
          <code className="code-doc">MantineProvider</code> and follow its
          color scheme. Light and dark mode work out of the box:
        </p>
        <DocCodeBlock code={PROVIDER_EXAMPLE} language="tsx" />
        <p className="text-base text-muted-foreground">
          All colors, radii and sizes derive from Mantine CSS variables.
          Override the <code className="code-doc">--ae-*</code> custom
          properties on any ancestor to restyle a chat instance.
        </p>
        <p className="text-base text-muted-foreground">
          To give the stock Mantine components inside kit screens the kit
          look, and to offer accent, radius and density settings, wrap those
          screens in <code className="code-doc">AiKitProvider</code> inside
          your <code className="code-doc">MantineProvider</code>. See{" "}
          <Link
            href="/docs/theming"
            className="text-an-primary-color hover:underline underline-offset-2"
          >
            Theming
          </Link>
          .
        </p>
      </div>

      <div id="usage" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">Usage</div>
        <p className="text-base text-muted-foreground">
          Import components from the package root:
        </p>
        <DocCodeBlock code={USAGE_EXAMPLE} language="tsx" />
        <p className="text-base text-muted-foreground">
          Messages are structurally compatible with{" "}
          <code className="code-doc">UIMessage</code> from the{" "}
          <a
            href="https://sdk.vercel.ai/"
            className="text-an-primary-color hover:underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Vercel AI SDK
          </a>
          , so <code className="code-doc">useChat</code> output can be passed
          as is:
        </p>
        <DocCodeBlock code={USE_CHAT_EXAMPLE} language="tsx" />
        <p className="text-base text-muted-foreground">
          Head to{" "}
          <Link
            href="/docs/agent-chat"
            className="text-an-primary-color hover:underline underline-offset-2"
          >
            AgentChat
          </Link>{" "}
          for the full prop reference, or pick individual pieces from the
          sidebar.
        </p>
      </div>
    </DocPageShell>
  );
}
