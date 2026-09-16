import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DocPageSection = {
  id: string;
  label: string;
  children?: Array<{ id: string; label: string }>;
};

type DocPageShellProps = {
  children: ReactNode;
  className?: string;
  /**
   * Optional table of contents. When provided, renders a sticky "On this page"
   * list on xl+ viewports. When omitted, the right column is still reserved so
   * the content column width matches pages that do have a TOC.
   */
  sections?: DocPageSection[];
};

export function DocPageShell({
  children,
  className,
  sections,
}: DocPageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto max-w-6xl px-0 sm:px-4 lg:px-8 py-8 sm:py-10 lg:py-12 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] gap-y-8 xl:gap-y-10 gap-x-14",
        className,
      )}
    >
      <div className="order-2 xl:order-1 flex flex-col gap-10 min-w-0">
        {children}
      </div>
      {sections && sections.length > 0 && (
        <aside className="hidden xl:block order-1 xl:order-2">
          <div className="sticky top-0 pt-4 space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              On this page
            </div>
            <nav className="flex flex-col gap-2 text-sm">
              {sections.map((section) => (
                <div key={section.id} className="flex flex-col gap-1">
                  <a
                    href={`#${section.id}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {section.label}
                  </a>
                  {section.children && (
                    <div className="flex flex-col gap-1 pl-4">
                      {section.children.map((child) => (
                        <a
                          key={child.id}
                          href={`#${child.id}`}
                          className="text-muted-foreground/80 hover:text-foreground"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>
      )}
    </div>
  );
}
