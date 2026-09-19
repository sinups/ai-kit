import { getComponentProps } from "@/app/components/[id]/api-reference";
import { COMPONENT_DOCS, componentIdFromName, type ComponentBlock } from "@/app/data/component-docs";
import { componentDefinition } from "@/app/lib/seo";
import { SITE_URL } from "@/app/lib/site";

export function codeFence(code: string, lang = "tsx") {
  return ["```" + lang, code.trim(), "```"].join("\n");
}

const escapeCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");

const RELATED_EXPORTS: Record<string, string[]> = {
  ArtifactPanel: [
    "`ArtifactCard`: a card in an answer that opens an artifact in `ArtifactPanel`; the whole card is one button.",
  ],
  MessageActions: [
    "`MessageActionButton`: an icon button in the look of the message toolbar, for host actions in the `actions` slot of `MessageActions`.",
  ],
  Markdown: [
    "`MarkdownLinksProvider`: hands `onLinkClick` and `linkSchemes` to every `Markdown` inside, such as the answers of `AgentChat`; a link with a host scheme never navigates and only reaches `onLinkClick`.",
  ],
};

function blockToMarkdown(block: ComponentBlock, heading: string): string {
  if (block.type === "example") {
    return [`${heading} Example: ${block.title}`, "", codeFence(block.code)].join("\n");
  }
  if (block.type === "code") {
    return [`${heading} ${block.title}`, "", codeFence(block.content)].join("\n");
  }
  return [`${heading} ${block.title}`, "", block.content.trim()].join("\n");
}

/** A component page as Markdown: definition, docs blocks, related exports and API table; `level` is the heading level of the name */
export function renderComponent(name: string, level = 2): string {
  const title = "#".repeat(level);
  const sub = "#".repeat(level + 1);
  const doc = COMPONENT_DOCS.find((item) => item.name === name);
  const parts: string[] = [
    `${title} ${name}`,
    "",
    componentDefinition(name),
    "",
    `URL: ${SITE_URL}/docs/${componentIdFromName(name)}`,
    "",
  ];
  for (const block of doc?.blocks ?? []) {
    parts.push(blockToMarkdown(block, sub), "");
  }
  const related = RELATED_EXPORTS[name];
  if (related) {
    parts.push(`${sub} Related exports`, "", ...related.map((line) => `- ${line}`), "");
  }
  const apiProps = getComponentProps(name);
  if (apiProps?.length) {
    parts.push(`${sub} API reference`, "", "| Prop | Type | Required | Description |", "| --- | --- | --- | --- |");
    for (const prop of apiProps) {
      parts.push(
        `| ${prop.name} | \`${escapeCell(prop.type)}\` | ${prop.required ? "Yes" : "No"} | ${escapeCell(prop.description ?? "")} |`,
      );
    }
    parts.push("");
  }
  return parts.join("\n");
}
