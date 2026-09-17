import { DocPageShell } from "@/app/components/doc-page-shell";
import { C, GuideHeader, GuideSection, P } from "@/app/components/doc-guide";
import { getUtilityGroups } from "@/app/lib/utility-exports";
import { getDocNav } from "@/app/utils/doc-nav";

const sectionId = (title: string) => title.toLowerCase().replace(/\s+/g, "-");

export default function UtilitiesPage() {
  const { previousHref, nextHref } = getDocNav("/docs/utilities");
  const groups = getUtilityGroups();
  const hookCount = groups.reduce(
    (count, group) => count + group.items.filter((item) => item.kind === "hook").length,
    0,
  );
  const functionCount = groups.reduce((count, group) => count + group.items.length, 0) - hookCount;

  return (
    <DocPageShell
      sections={groups.map((group) => ({ id: sectionId(group.title), label: group.title }))}
    >
      <GuideHeader
        title="Hooks and utilities"
        description="Hooks and pure functions exported by @sinups/ai-kit, grouped by module."
        previousHref={previousHref}
        nextHref={nextHref}
      >
        <P>
          Components keep their logic in pure functions next to them: parsing, validation,
          filtering, grouping and formatting. The package exports them, so you can validate a draft
          on the server, pre-filter a list or format a value the same way the UI does. This page
          lists {hookCount} hooks and {functionCount} functions, generated from the package source.
          Everything is imported from <C>@sinups/ai-kit</C>.
        </P>
      </GuideHeader>

      {groups.map((group) => (
        <GuideSection key={group.title} id={sectionId(group.title)} title={group.title}>
          <div className="rounded-[8px] border border-border divide-y divide-border">
            {group.items.map((item) => (
              <div key={item.name} id={item.name} className="px-3 py-2 space-y-1 scroll-mt-8">
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] text-an-foreground">
                  {item.signature}
                </pre>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </GuideSection>
      ))}
    </DocPageShell>
  );
}
