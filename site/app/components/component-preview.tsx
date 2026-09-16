"use client";

import { COMPONENT_SHOWCASES } from "@/app/data/component-showcase";
import { componentIdFromName } from "@/app/data/component-docs";

export function ComponentPreview({ name }: { name: string }) {
  const component = COMPONENT_SHOWCASES.find(
    (item) => componentIdFromName(item.name) === componentIdFromName(name),
  );

  if (!component) return null;
  return <>{component.node}</>;
}
