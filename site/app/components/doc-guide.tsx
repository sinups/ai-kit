import Link from "next/link";
import type { ReactNode } from "react";
import { DocNavButton } from "@/app/components/doc-nav-button";
import { componentIdFromName } from "@/app/data/component-docs";

export const docLinkClass = "text-an-primary-color hover:underline underline-offset-2";

export function GuideHeader({
  title,
  description,
  previousHref,
  nextHref,
  children,
}: {
  title: string;
  description: string;
  previousHref?: string;
  nextHref?: string;
  children: ReactNode;
}) {
  return (
    <header className="space-y-2">
      <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-medium text-an-foreground">{title}</h1>
        <DocNavButton
          title={title}
          description={description}
          installCommand="npm install @sinups/ai-kit @mantine/core @mantine/hooks @tabler/icons-react"
          previousHref={previousHref}
          nextHref={nextHref}
        />
      </div>
      {children}
    </header>
  );
}

export function GuideSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="space-y-3 scroll-mt-8">
      <h2 className="text-base font-medium text-an-foreground">{title}</h2>
      {children}
    </div>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-base text-muted-foreground">{children}</p>;
}

export function C({ children }: { children: ReactNode }) {
  return <code className="code-doc">{children}</code>;
}

export function Bullets({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-2 text-base text-muted-foreground">{children}</ul>;
}

/** Link to a component page by its exported name */
export function ComponentLink({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <Link href={`/docs/${componentIdFromName(name)}`} className={docLinkClass}>
      {children ?? <code className="code-doc">{name}</code>}
    </Link>
  );
}

export function DocTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  const template = { gridTemplateColumns: columns.map(() => "minmax(0,1fr)").join(" ") };
  return (
    <div className="rounded-[8px] border border-border overflow-x-auto text-sm">
      <div
        className="grid gap-3 px-3 py-2 font-medium text-muted-foreground border-b border-border min-w-[520px]"
        style={template}
      >
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>
      <div className="divide-y divide-border min-w-[520px]">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid gap-3 px-3 py-2" style={template}>
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} className="min-w-0 text-muted-foreground">
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
