import { COMPONENT_DOCS, componentIdFromName } from "@/app/data/component-docs";
import { COMPONENT_GROUPS, SIDEBAR_SECTIONS } from "@/app/data/sidebar";
import { DOC_PAGE_DESCRIPTIONS, summarizeUsage } from "@/app/lib/doc-pages";
import { PACKAGE_VERSION } from "@/app/lib/package-info";
import {
  PACKAGE_NAME,
  REPO_URL,
  SITE_NAME,
  SITE_URL,
  UPSTREAM_URL,
  markdownPageUrl,
  ogImageUrl,
} from "@/app/lib/site";
import { COMPONENT_SEO } from "@/app/utils/component-seo";
import type { OgEyebrow } from "@/lib/og";

export const SITE_DESCRIPTION =
  "AI UI Kit (@sinups/ai-kit) is an open-source React UI kit for agent products on Mantine 9: agent chat, MCP tool calls and approvals, settings and diff review.";

const GROUP_PURPOSE: Record<string, string> = {
  Chat: "the chat screen of an agent product",
  Messages: "rendering the messages of an agent chat",
  Status: "showing what an agent is doing and how much context it uses",
  Tools: "showing an agent's tool calls, their results and approvals",
  Input: "the message composer of an agent chat",
  Voice: "voice input and spoken answers in an agent chat",
  Primitives: "building the settings screens, lists and dialogs around an agent chat",
  "Agents & skills": "managing subagents and skills",
  MCP: "managing MCP servers and their tools",
  "Permissions & hooks": "tool permissions and lifecycle hooks of an agent",
  "Sessions & tasks": "conversation history and background tasks of an agent",
  Diff: "reviewing file changes made by an agent",
  Settings: "the model, usage and memory settings of an agent product",
};

const COMPONENT_PURPOSE: Record<string, string> = {
  AiKitProvider: "applying the AI UI Kit theme to a part of a Mantine app",
  AiKitThemeCustomizer: "letting users change the accent, radius, density and color scheme of the kit",
  ChatLauncher: "embedding an agent chat as a floating widget",
  CommandsHelp: "a searchable reference of slash commands and keyboard shortcuts",
};

export function componentGroup(name: string): string | undefined {
  return COMPONENT_GROUPS.find((group) => group.components.includes(name))?.title;
}

/** One-sentence definition that opens every component page, its meta description and its Markdown copy */
export function componentDefinition(name: string): string {
  const group = componentGroup(name);
  const purpose =
    COMPONENT_PURPOSE[name] ?? (group ? GROUP_PURPOSE[group] : undefined) ?? "agent product UIs";
  return `${name} is a React component for ${purpose}, built on Mantine 9 and part of AI UI Kit (\`${PACKAGE_NAME}\`).`;
}

/** What the component does, from the SEO copy or the first sentence of its usage docs */
export function componentSummary(name: string): string {
  return COMPONENT_SEO[name]?.description ?? summarizeUsage(name);
}

const plain = (text: string) => text.replace(/`/g, "");

const META_LIMIT = 158;
const META_TAIL = " Part of AI UI Kit for Mantine 9.";

/** Longest start of `text` that fits `limit`, cut after a clause or, failing that, a whole word */
function fitSentence(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const head = text.slice(0, limit);
  const clause = Math.max(head.lastIndexOf(": "), head.lastIndexOf(", "), head.lastIndexOf("; "), head.lastIndexOf(" - "));
  const cut = clause > limit * 0.5 ? clause : head.lastIndexOf(" ");
  return `${head.slice(0, cut).replace(/[\s,;:(-]+$/, "").replace(/\s+(and|or|with|in|the|a|an|of|to|for|by|from|as)$/i, "")}.`;
}

/** Meta description that names the component once: its own summary when it starts with the name, the definition otherwise */
export function componentMetaDescription(name: string): string {
  const summary = plain(componentSummary(name)).trim();
  const firstSentence = /^(.+?[.!?])(\s|$)/.exec(summary)?.[1] ?? summary;
  if (!summary.startsWith(`${name} `)) {
    return fitSentence(plain(componentDefinition(name)), META_LIMIT);
  }
  if (summary.length + META_TAIL.length <= META_LIMIT) return `${summary}${META_TAIL}`;
  if (firstSentence.length + META_TAIL.length <= META_LIMIT) return `${firstSentence}${META_TAIL}`;
  return fitSentence(firstSentence, META_LIMIT);
}

export type SeoPage = {
  /** Id of the social image, `og/<id>.png` */
  id: string;
  path: string;
  title: string;
  description: string;
  /** Short text of the social image */
  summary: string;
  /** Sidebar group shown on the social image */
  section: string;
  eyebrow: OgEyebrow;
  /** Component name when the page documents a component */
  component?: string;
};

function guidePages(): SeoPage[] {
  return SIDEBAR_SECTIONS.filter((section) => !section.components).flatMap((section) =>
    section.items.map((item) => ({
      id: item.href === "/docs" ? "docs" : item.href.split("/").pop()!,
      path: item.href,
      title: item.label,
      description: DOC_PAGE_DESCRIPTIONS[item.href] ?? "",
      summary: DOC_PAGE_DESCRIPTIONS[item.href] ?? "",
      section: section.title,
      eyebrow: "DOCUMENTATION" as const,
    })),
  );
}

function componentPages(): SeoPage[] {
  return COMPONENT_DOCS.map((doc) => {
    const id = componentIdFromName(doc.name);
    return {
      id,
      path: `/docs/${id}`,
      title: doc.name,
      description: componentMetaDescription(doc.name),
      summary: plain(componentSummary(doc.name)),
      section: componentGroup(doc.name) ?? "Components",
      eyebrow: "COMPONENT" as const,
      component: doc.name,
    };
  });
}

/** Every page of the site that has its own metadata, social image and sitemap entry */
export function seoPages(): SeoPage[] {
  return [
    {
      id: "home",
      path: "",
      title: "AI UI Kit",
      description: SITE_DESCRIPTION,
      summary: "React components for agent products on Mantine 9: chat, tool calls, approvals, MCP, settings and diff review.",
      section: "",
      eyebrow: "DOCUMENTATION",
    },
    ...guidePages(),
    ...componentPages(),
  ];
}

type JsonLd = Record<string, unknown>;

export function homeJsonLd(faq: Array<{ question: string; answer: string }>): JsonLd[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": ["SoftwareSourceCode", "SoftwareApplication"],
      name: SITE_NAME,
      alternateName: PACKAGE_NAME,
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      image: ogImageUrl("home"),
      codeRepository: REPO_URL,
      programmingLanguage: "TypeScript",
      runtimePlatform: ["React 19", "Mantine 9"],
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      softwareVersion: PACKAGE_VERSION,
      license: "https://opensource.org/licenses/MIT",
      isBasedOn: UPSTREAM_URL,
      offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
      author: { "@type": "Person", name: "Sinups", url: REPO_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
}

export function componentJsonLd(name: string): JsonLd[] {
  const path = `/docs/${componentIdFromName(name)}`;
  const url = `${SITE_URL}${path}/`;
  const group = componentGroup(name);
  return [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: `${name} — ${SITE_NAME}`,
      description: componentMetaDescription(name),
      url,
      image: ogImageUrl(componentIdFromName(name)),
      inLanguage: "en",
      about: {
        "@type": "SoftwareSourceCode",
        name,
        codeRepository: REPO_URL,
        programmingLanguage: "TypeScript",
      },
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      encoding: { "@type": "MediaObject", encodingFormat: "text/markdown", contentUrl: markdownPageUrl(path) },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: "Docs", item: `${SITE_URL}/docs/` },
        ...(group ? [{ name: group, item: `${SITE_URL}/docs/#at-a-glance` }] : []),
        { name, item: url },
      ].map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })),
    },
  ];
}
