import { IconArrowUpRight } from "@tabler/icons-react";
import { DocCodeBlock } from "@/app/components/doc-code-block";
import { AGENT_SETUP_PROMPT, SKILL_URL } from "@/app/lib/agent-setup";
import { LLMS_FULL_URL, LLMS_URL } from "@/app/lib/mcp-setup";

const LINKS = [
  { label: "llms.txt", description: "Index of the docs", href: LLMS_URL },
  { label: "llms-full.txt", description: "Every component with its API", href: LLMS_FULL_URL },
  { label: "SKILL.md", description: "Skill for coding agents", href: SKILL_URL },
];

export function AgentSetupSection() {
  return (
    <section aria-labelledby="agent-setup-title" className="border-t border-border px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <div>
            <h2
              id="agent-setup-title"
              className="text-balance text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.035em] text-foreground"
            >
              Set up with your agent.
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Paste the prompt into your coding agent inside your project. It reads the docs, installs
              the kit and connects AgentChat to the chat state you already have.
            </p>
          </div>
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-sm py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="font-mono text-[13px] text-foreground">{link.label}</span>
                  <span className="truncate text-sm text-muted-foreground">{link.description}</span>
                  <IconArrowUpRight
                    className="ml-auto size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <DocCodeBlock
          code={AGENT_SETUP_PROMPT}
          language="text"
          className="self-start pr-11 [&_pre]:whitespace-pre-wrap [&_pre]:break-words"
        />
      </div>
    </section>
  );
}
