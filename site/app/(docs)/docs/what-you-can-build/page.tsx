import Link from "next/link";
import { DocCodeBlock } from "@/app/components/doc-code-block";
import { DocPageShell } from "@/app/components/doc-page-shell";
import { ComponentLink, docLinkClass, GuideHeader, GuideSection, P } from "@/app/components/doc-guide";
import { PreviewCodeTabs } from "@/app/components/preview-code-tabs";
import { RecipePreview } from "@/app/components/recipes";
import { RECIPES } from "@/app/data/recipes";
import { getDocNav } from "@/app/utils/doc-nav";

export default function WhatYouCanBuildPage() {
  const { previousHref, nextHref } = getDocNav("/docs/what-you-can-build");

  return (
    <DocPageShell sections={RECIPES.map((recipe) => ({ id: recipe.id, label: recipe.title }))}>
      <GuideHeader
        title="What you can build"
        description="Live recipes assembled from kit components."
        previousHref={previousHref}
        nextHref={nextHref}
      >
        <P>
          Each recipe below is a working screen built only from public components. Use the Desktop and
          Mobile switch to see how it adapts, and the Code tab for the composition. The rules behind
          these layouts are on{" "}
          <Link href="/docs/layouts" className={docLinkClass}>
            Layouts
          </Link>
          .
        </P>
      </GuideHeader>

      {RECIPES.map((recipe) => (
        <GuideSection key={recipe.id} id={recipe.id} title={recipe.title}>
          <P>
            {recipe.summary}
            {recipe.id === "widget" && (
              <>
                {" "}
                <Link href="/docs/launcher" className={docLinkClass}>
                  Open the launcher guide
                </Link>
                .
              </>
            )}
          </P>
          <PreviewCodeTabs
            preview={<RecipePreview id={recipe.id} />}
            code={<DocCodeBlock code={recipe.code} language="tsx" variant="plain" />}
            codeText={recipe.code}
            height={recipe.height}
            previewClassName="[align-items:safe_center]! !p-4"
          />
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>Uses:</span>
            {recipe.components.map((name) => (
              <ComponentLink key={name} name={name} />
            ))}
          </p>
        </GuideSection>
      ))}
    </DocPageShell>
  );
}
