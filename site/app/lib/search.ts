import { COMPONENT_DOCS, componentIdFromName } from "@/app/data/component-docs";
import { SIDEBAR_SECTIONS } from "@/app/data/sidebar";

export interface SearchRecord {
  title: string;
  description: string;
  href: string;
  section: string;
  content: string;
}

function formatLabel(label: string) {
  return label
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
}

export function buildSearchIndex(): SearchRecord[] {
  const records: SearchRecord[] = [];

  // Non-component pages (Home, Getting Started) — indexed with label only
  for (const section of SIDEBAR_SECTIONS) {
    if (section.title === "Components") continue;
    for (const item of section.items) {
      records.push({
        title: item.label,
        description: "",
        href: item.href,
        section: section.title,
        content: `${item.label} ${section.title}`,
      });
    }
  }

  // Component pages — indexed with code/usage block text
  for (const doc of COMPONENT_DOCS) {
    const id = componentIdFromName(doc.name);
    const label = formatLabel(doc.name);
    const blockText = (doc.blocks ?? [])
      .map((block) => {
        if (block.type === "example") return `${block.title} ${block.code}`;
        return `${block.title} ${block.content}`;
      })
      .join("\n");

    records.push({
      title: label,
      description: `${label} component`,
      href: `/docs/${id}`,
      section: "Components",
      content: `${label}\n${doc.name}\n${blockText}`,
    });
  }

  return records;
}
