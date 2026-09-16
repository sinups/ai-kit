import { DocCodeBlock } from "@/app/components/doc-code-block";
import { DocNavButton } from "@/app/components/doc-nav-button";
import { DocPageShell } from "@/app/components/doc-page-shell";
import { SITE_URL } from "@/app/lib/site";
import { getDocNav } from "@/app/utils/doc-nav";

const CURSOR_MCP_CONFIG = `{
  "mcpServers": {
    "@sinups/ai-kit": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.context7.com/mcp"]
    }
  }
}`;

const CLAUDE_CODE_CMD = `claude mcp add --transport http context7 https://mcp.context7.com/mcp`;

const FETCH_CONFIG = `{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}`;

const EXAMPLE_PROMPTS = [
  "Show me all available AI UI Kit components.",
  "Add AgentChat to my Mantine app and wire it to the Vercel AI SDK.",
  "Show me the API reference and a preview of InputBar.",
  "Build a chat page using AgentChat with BashTool and EditTool renderers, and an InputBar with ModeSelector in the leftActions slot.",
];

export default function McpPage() {
  const { previousHref, nextHref } = getDocNav("/docs/mcp");

  return (
    <DocPageShell
      sections={[
        { id: "overview", label: "Overview" },
        { id: "what", label: "What is MCP?" },
        { id: "setup", label: "Setup" },
        { id: "usage", label: "Usage" },
      ]}
    >
      <header id="overview" className="space-y-2 scroll-mt-8">
        <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-medium text-an-foreground">MCP</h1>
          <DocNavButton
            title="MCP"
            description="Read AI UI Kit docs from your AI assistant."
            previousHref={previousHref}
            nextHref={nextHref}
          />
        </div>
        <p className="text-base text-muted-foreground">
          This site publishes its documentation in an assistant-friendly form:{" "}
          <a
            href={`${SITE_URL}/llms.txt`}
            className="text-an-primary-color hover:underline underline-offset-2"
          >
            llms.txt
          </a>{" "}
          is the index and{" "}
          <a
            href={`${SITE_URL}/llms-full.txt`}
            className="text-an-primary-color hover:underline underline-offset-2"
          >
            llms-full.txt
          </a>{" "}
          contains every page, example and API table in one file. Point any
          Model Context Protocol client (Cursor, Claude Code, Windsurf) at
          them and your assistant can browse the components, their props and
          usage patterns without leaving the editor.
        </p>
      </header>

      <div id="what" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          What is MCP?
        </div>
        <p className="text-base text-muted-foreground">
          The{" "}
          <a
            href="https://modelcontextprotocol.io"
            className="text-an-primary-color hover:underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Model Context Protocol
          </a>{" "}
          is an open standard that lets AI assistants talk to external tools.
          Because the library ships as a single npm package, no registry
          server is needed: a documentation MCP server such as{" "}
          <a
            href="https://context7.com"
            className="text-an-primary-color hover:underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Context7
          </a>{" "}
          or a plain fetch server gives the assistant the same catalog, prop
          shapes and examples you see on this site.
        </p>
      </div>

      <div id="setup" className="space-y-4 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">Setup</div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-an-foreground">Cursor</div>
          <p className="text-sm text-muted-foreground">
            Add this to{" "}
            <code className="code-doc">~/.cursor/mcp.json</code> (global) or{" "}
            <code className="code-doc">.cursor/mcp.json</code> (per project),
            then ask for the <code className="code-doc">@sinups/ai-kit</code>{" "}
            library:
          </p>
          <DocCodeBlock code={CURSOR_MCP_CONFIG} language="json" />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-an-foreground">
            Claude Code
          </div>
          <p className="text-sm text-muted-foreground">
            Register the server with the Claude Code CLI:
          </p>
          <DocCodeBlock code={CLAUDE_CODE_CMD} language="bash" />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-an-foreground">
            Any client, no third party
          </div>
          <p className="text-sm text-muted-foreground">
            A fetch server is enough: register it once and tell the assistant
            to read{" "}
            <code className="code-doc">{`${SITE_URL}/llms-full.txt`}</code>{" "}
            before touching the UI.
          </p>
          <DocCodeBlock code={FETCH_CONFIG} language="json" />
        </div>
      </div>

      <div id="usage" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">Usage</div>
        <p className="text-base text-muted-foreground">
          Once the server is connected, ask your assistant. Prompts like
          these just work:
        </p>
        <ul className="space-y-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <li
              key={prompt}
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-an-foreground"
            >
              {prompt}
            </li>
          ))}
        </ul>
        <p className="text-base text-muted-foreground">
          The assistant reads component descriptions, examples and prop tables
          from the docs, then installs the package with your package manager
          and writes the code.
        </p>
      </div>
    </DocPageShell>
  );
}
