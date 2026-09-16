import { DocCodeBlock } from "@/app/components/doc-code-block";
import { DocNavButton } from "@/app/components/doc-nav-button";
import { DocPageShell } from "@/app/components/doc-page-shell";
import { getDocNav } from "@/app/utils/doc-nav";

const INSTALL_COMMAND = "npx skills add sinups/ai-kit";

const EXAMPLE_PROMPTS = [
  "Add a streaming chat surface with AgentChat, wire it to my existing /api/chat route.",
  "Show me the available tool renderers in AI UI Kit and pick the right ones for my agent.",
  "Replace the default SendButton with one that matches my brand palette.",
  "Build a composer with InputBar, ModeSelector, and ModelPicker, then connect it to useChat.",
];

export default function SkillsPage() {
  const { previousHref, nextHref } = getDocNav("/docs/skills");

  return (
    <DocPageShell
      sections={[
        { id: "overview", label: "Overview" },
        { id: "install", label: "Install" },
        { id: "included", label: "What's included" },
        { id: "how", label: "How it works" },
        { id: "learn", label: "Learn more" },
      ]}
    >
      <header id="overview" className="space-y-2 scroll-mt-8">
        <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-medium text-an-foreground">Skills</h1>
          <DocNavButton
            title="Skills"
            description="Project-aware context for AI assistants."
            installCommand={INSTALL_COMMAND}
            previousHref={previousHref}
            nextHref={nextHref}
          />
        </div>
        <p className="text-base text-muted-foreground">
          Skills give AI assistants like Claude Code and Cursor project-aware
          context about AI UI Kit. When installed, your assistant knows
          how to find, install, compose, and customise components using the
          correct APIs, prop shapes, and styling patterns for your project.
        </p>
        <ul className="space-y-2 pt-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <li
              key={prompt}
              className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-an-foreground"
            >
              {prompt}
            </li>
          ))}
        </ul>
      </header>

      <div id="install" className="space-y-4 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">Install</div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-an-foreground">
            Via skills.sh
          </div>
          <p className="text-sm text-muted-foreground">
            Install the AI UI Kit skill via{" "}
            <a
              href="https://skills.sh"
              className="text-an-primary-color hover:underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              skills.sh
            </a>
            . The skill bundle registers with every compatible assistant on
            your machine:
          </p>
          <DocCodeBlock code={INSTALL_COMMAND} language="bash" />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-an-foreground">
            Manual install for Claude Code
          </div>
          <p className="text-sm text-muted-foreground">
            Want to try the skill right now? Copy the{" "}
            <a
              href="https://github.com/sinups/ai-kit/blob/master/site/skills/ai-kit/SKILL.md"
              className="text-an-primary-color hover:underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              SKILL.md
            </a>{" "}
            from the repo into your Claude Code skills folder:
          </p>
          <DocCodeBlock
            code={`mkdir -p ~/.claude/skills/ai-kit
curl -L https://raw.githubusercontent.com/sinups/ai-kit/master/site/skills/ai-kit/SKILL.md \\
  -o ~/.claude/skills/ai-kit/SKILL.md`}
            language="bash"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          After install, restart your assistant. It will detect AI UI Kit
          whenever{" "}
          <code className="code-doc">@sinups/ai-kit</code> is listed in
          your <code className="code-doc">package.json</code> or imported in
          the code you are editing.
        </p>
      </div>

      <div id="included" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          What&apos;s included
        </div>
        <ul className="list-disc pl-5 space-y-2 text-base text-muted-foreground">
          <li>
            <span className="font-medium text-an-foreground">
              Project detection.
            </span>{" "}
            Reads <code className="code-doc">package.json</code> and scans
            imports for <code className="code-doc">@sinups/ai-kit</code>.
          </li>
          <li>
            <span className="font-medium text-an-foreground">
              Component catalog.
            </span>{" "}
            Full inventory of the 25 components with API shapes, slots, and
            prop defaults.
          </li>
          <li>
            <span className="font-medium text-an-foreground">
              Composition patterns.
            </span>{" "}
            When to pair <code className="code-doc">AgentChat</code> with tool
            renderers, how to wire <code className="code-doc">InputBar</code>{" "}
            to the Vercel AI SDK, mode/model picker placement, and more.
          </li>
          <li>
            <span className="font-medium text-an-foreground">
              Theming guardrails.
            </span>{" "}
            The Mantine theme and <code className="code-doc">--ae-*</code>{" "}
            custom properties the library relies on, so the assistant restyles
            through tokens instead of overriding component internals.
          </li>
          <li>
            <span className="font-medium text-an-foreground">
              Docs access.
            </span>{" "}
            A pointer to <code className="code-doc">llms-full.txt</code> so
            the assistant can look up any component page on demand.
          </li>
        </ul>
      </div>

      <div id="how" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          How it works
        </div>
        <ol className="list-decimal pl-5 space-y-2 text-base text-muted-foreground">
          <li>
            <span className="font-medium text-an-foreground">Detection.</span>{" "}
            The skill inspects the workspace for the package dependency and
            a <code className="code-doc">MantineProvider</code>.
          </li>
          <li>
            <span className="font-medium text-an-foreground">
              Context injection.
            </span>{" "}
            Relevant component docs, prop types, and composition rules are
            loaded into the assistant&apos;s context on demand.
          </li>
          <li>
            <span className="font-medium text-an-foreground">
              Pattern enforcement.
            </span>{" "}
            The assistant follows the same patterns you see in the docs: no
            hallucinated props, no drifting away from the Mantine conventions
            of the rest of your codebase.
          </li>
          <li>
            <span className="font-medium text-an-foreground">
              On-demand install.
            </span>{" "}
            If the package is missing, the assistant installs{" "}
            <code className="code-doc">@sinups/ai-kit</code> with your
            package manager and adds the stylesheet import.
          </li>
        </ol>
      </div>

      <div id="learn" className="space-y-2 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Learn more
        </div>
        <ul className="list-disc pl-5 space-y-1 text-base text-muted-foreground">
          <li>
            <a
              href="https://skills.sh"
              className="text-an-primary-color hover:underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              skills.sh
            </a>
            : the hub where skills are published and discovered.
          </li>
          <li>
            <a
              href="https://ui.shadcn.com/docs/skills"
              className="text-an-primary-color hover:underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              shadcn/ui Skills
            </a>
            : the canonical pattern this skill follows.
          </li>
        </ul>
      </div>
    </DocPageShell>
  );
}
