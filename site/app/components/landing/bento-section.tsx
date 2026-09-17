"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconGitCompare,
  IconListDetails,
  IconMessageCircle,
  IconPalette,
  IconPlug,
  IconRobot,
  IconShieldCheck,
  IconStack2,
  type IconProps,
} from "@tabler/icons-react";
import {
  AgentsBentoPreview,
  ChatBentoPreview,
  DiffBentoPreview,
  McpBentoPreview,
  PermissionsBentoPreview,
  TasksBentoPreview,
  ThemeBentoPreview,
  WizardBentoPreview,
} from "./bento-previews";
import { useNearViewport } from "./use-near-viewport";
import classes from "./landing.module.css";

type Module = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<IconProps>;
  preview: ComponentType;
  className?: string;
};

const MODULES: Module[] = [
  {
    id: "chat",
    title: "Chat & tool calls",
    description: "Streaming markdown, tool cards, plans and questions.",
    href: "/docs/agent-chat",
    icon: IconMessageCircle,
    preview: ChatBentoPreview,
    className: "md:col-span-2",
  },
  {
    id: "diff",
    title: "Diff review",
    description: "Unified and split diffs, per-file decisions.",
    href: "/docs/diff-review",
    icon: IconGitCompare,
    preview: DiffBentoPreview,
  },
  {
    id: "tasks",
    title: "Sessions & tasks",
    description: "History, background jobs and progress.",
    href: "/docs/task-list",
    icon: IconListDetails,
    preview: TasksBentoPreview,
  },
  {
    id: "mcp",
    title: "MCP servers",
    description: "Connect, authorize and inspect servers.",
    href: "/docs/mcp",
    icon: IconPlug,
    preview: McpBentoPreview,
  },
  {
    id: "permissions",
    title: "Permissions",
    description: "Approvals, modes and saved rules.",
    href: "/docs/tool-approval-footer",
    icon: IconShieldCheck,
    preview: PermissionsBentoPreview,
  },
  {
    id: "agents",
    title: "Agents & skills",
    description: "Subagents with their models and tools.",
    href: "/docs/agent-list",
    icon: IconRobot,
    preview: AgentsBentoPreview,
    className: "hidden sm:flex",
  },
  {
    id: "wizard",
    title: "Wizards & settings",
    description: "Step-by-step setup with validation.",
    href: "/docs/wizard",
    icon: IconStack2,
    preview: WizardBentoPreview,
    className: "hidden sm:flex",
  },
  {
    id: "theme",
    title: "Theme & launcher",
    description: "Accent, radius and density controls.",
    href: "/docs/theming",
    icon: IconPalette,
    preview: ThemeBentoPreview,
    className: "md:col-span-2 lg:col-span-1",
  },
];

export function BentoSection() {
  const [ref, near] = useNearViewport<HTMLUListElement>("600px");

  return (
    <section aria-labelledby="modules-title" className="border-t border-border px-4 py-16 sm:px-6 sm:pb-28 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-6 sm:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2
              id="modules-title"
              className="text-balance text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.035em] text-foreground"
            >
              Every surface an agent needs.
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Each module works alone or inside AgentChat. These are the real
              components, rendered live.
            </p>
          </div>
          <Link
            href="/docs/agent-chat"
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Browse all components
            <IconArrowRight
              className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
        <ul ref={ref} className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {MODULES.map((module) => (
            <BentoCard key={module.id} module={module} live={near} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function BentoCard({ module, live }: { module: Module; live: boolean }) {
  const Icon = module.icon;
  const Preview = module.preview;

  return (
    <li
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-foreground/20 ${module.className ?? ""}`}
    >
      <div className="flex flex-col gap-1.5 p-5 pb-4">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" stroke={1.75} aria-hidden="true" />
          <h3 className="text-[15px] font-medium tracking-tight text-foreground">
            <Link
              href={module.href}
              className="rounded-sm after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
            >
              {module.title}
            </Link>
          </h3>
          <IconArrowRight
            className="ml-auto size-4 -translate-x-1 text-muted-foreground opacity-0 transition-[transform,opacity] duration-150 group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden="true"
          />
        </div>
        <p className="text-sm leading-snug text-muted-foreground">{module.description}</p>
      </div>
      <div
        inert
        aria-hidden="true"
        className={`${classes.bentoPreview} relative mt-auto h-[240px] border-t border-border bg-muted/25 sm:h-[300px]`}
      >
        <div className="mx-auto w-full max-w-[480px] p-4">{live ? <Preview /> : null}</div>
      </div>
    </li>
  );
}
