"use client";

import { COMPONENT_SHOWCASES } from "@/app/data/component-showcase";
import { componentIdFromName } from "@/app/data/component-docs";
import { AiKitProvider } from "@sinups/ai-kit";
import { renderAgentUiPreview } from "@/app/components/agent-ui-previews";
import { ClientOnly } from "@/app/components/previews/frames";

export function ComponentPreview({ name }: { name: string }) {
  const component = COMPONENT_SHOWCASES.find(
    (item) => componentIdFromName(item.name) === componentIdFromName(name),
  );

  return (
    <ClientOnly>
      <AiKitProvider>
        {component ? component.node : (renderAgentUiPreview(name) ?? null)}
      </AiKitProvider>
    </ClientOnly>
  );
}
