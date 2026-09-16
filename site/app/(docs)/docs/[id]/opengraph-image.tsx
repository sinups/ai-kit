export const dynamic = "force-static";

import { generateAgentElementsOg } from "@/lib/og";
import {
  COMPONENT_DOCS,
  componentIdFromName,
} from "@/app/data/component-docs";
import { getComponentSeo } from "@/app/utils/component-seo";

export function generateStaticParams() {
  return COMPONENT_DOCS.map((item) => ({ id: componentIdFromName(item.name) }));
}

export const alt = "Component - AI UI Kit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string | string[] }>;
}) {
  const resolved = await params;
  const rawId = Array.isArray(resolved.id) ? resolved.id[0] : resolved.id;
  const normalizedId = (rawId ?? "").toLowerCase();
  const component = COMPONENT_DOCS.find(
    (item) => componentIdFromName(item.name) === normalizedId,
  );

  if (!component) {
    return generateAgentElementsOg({
      title: "Component not found",
      description: "This component does not exist in AI UI Kit.",
      section: "components",
      eyebrow: "COMPONENT",
    });
  }

  const seo = getComponentSeo(component.name);
  return generateAgentElementsOg({
    title: component.name,
    description: seo.description,
    section: "components",
    eyebrow: "COMPONENT",
  });
}
