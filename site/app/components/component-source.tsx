import Link from "next/link";
import { DocsCodeBlock } from "@/app/components/docs-code-block";
import {
  getPrimaryFile,
  getRegistryDependencies,
} from "@/app/lib/component-source";

export async function ComponentSource({ name }: { name: string }) {
  const [primary, deps] = await Promise.all([
    getPrimaryFile(name),
    getRegistryDependencies(name),
  ]);

  if (!primary) return null;

  return (
    <div className="space-y-4">
      <DocsCodeBlock
        code={primary.content}
        language={primary.language}
        filename={primary.relativePath}
      />

      {deps.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-[13px] text-muted-foreground">
            Depends on:
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {deps.map((dep) => (
              <li key={dep.id}>
                <Link
                  href={dep.href}
                  className="inline-flex items-center h-7 px-2.5 rounded-md border border-border bg-background text-[13px] text-foreground hover:bg-muted/60 transition-colors"
                >
                  {dep.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
