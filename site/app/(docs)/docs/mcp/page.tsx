import { DocCodeBlock } from "@/app/components/doc-code-block";
import { DocPageShell } from "@/app/components/doc-page-shell";
import { Bullets, C, docLinkClass, GuideHeader, GuideSection, P } from "@/app/components/doc-guide";
import {
  CONTEXT7_NOTE,
  EXAMPLE_PROMPTS,
  FETCH_SERVER_CONFIG,
  LLMS_FULL_URL,
  LLMS_URL,
  PROJECT_INSTRUCTIONS,
} from "@/app/lib/mcp-setup";
import { getDocNav } from "@/app/utils/doc-nav";

export default function McpPage() {
  const { previousHref, nextHref } = getDocNav("/docs/mcp");

  return (
    <DocPageShell
      sections={[
        { id: "files", label: "Docs for assistants" },
        { id: "fetch", label: "With a fetch server" },
        { id: "instructions", label: "Without MCP" },
        { id: "context7", label: "Context7" },
        { id: "prompts", label: "Example prompts" },
      ]}
    >
      <GuideHeader
        title="MCP"
        description="Give your AI assistant the AI UI Kit docs."
        previousHref={previousHref}
        nextHref={nextHref}
      >
        <P>
          The site publishes its documentation as plain text for AI assistants. An assistant that
          reads it uses the current components, props and exports instead of guessing them.
        </P>
      </GuideHeader>

      <GuideSection id="files" title="Docs for assistants">
        <Bullets>
          <li>
            <a href={LLMS_URL} className={docLinkClass}>
              llms.txt
            </a>
            : the index. Package version, install command, peer dependencies, and every page with a
            one-line summary.
          </li>
          <li>
            <a href={LLMS_FULL_URL} className={docLinkClass}>
              llms-full.txt
            </a>
            : every guide and component page in one file, with code examples, API tables and the
            exported hooks and utilities.
          </li>
        </Bullets>
        <P>
          Both files are generated from the same sources as this site when it is built, so they
          match the published package.
        </P>
      </GuideSection>

      <GuideSection id="fetch" title="With a fetch server">
        <P>
          Any Model Context Protocol client can read the files through the reference fetch server.
          Add it to the MCP configuration of your editor or agent:
        </P>
        <DocCodeBlock code={FETCH_SERVER_CONFIG} language="json" />
        <P>
          Then ask the assistant to fetch <C>{LLMS_FULL_URL}</C> before it writes UI code. The
          server needs <C>uvx</C> from the uv Python tool.
        </P>
      </GuideSection>

      <GuideSection id="instructions" title="Without MCP">
        <P>
          Assistants that can fetch URLs on their own need no server. Add a short note to your
          project instructions file, for example <C>AGENTS.md</C>:
        </P>
        <DocCodeBlock code={PROJECT_INSTRUCTIONS} language="text" />
        <P>
          For assistants without network access, download <C>llms-full.txt</C> into the repository
          and point the note at the local file.
        </P>
      </GuideSection>

      <GuideSection id="context7" title="Context7">
        <P>{CONTEXT7_NOTE}</P>
      </GuideSection>

      <GuideSection id="prompts" title="Example prompts">
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
      </GuideSection>
    </DocPageShell>
  );
}
