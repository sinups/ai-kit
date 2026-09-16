import { SIDEBAR_SECTIONS } from "@/app/data/sidebar";

export function getDocNav(href: string) {
  const primaryDocs = [
    "/docs",
    "/docs/installation",
    "/docs/mcp",
    "/docs/skills",
    "/docs/use-cases",
  ];
  if (primaryDocs.includes(href)) {
    const currentIndex = primaryDocs.indexOf(href);
    return {
      previousHref:
        currentIndex > 0 ? primaryDocs[currentIndex - 1] : undefined,
      nextHref:
        currentIndex >= 0 && currentIndex < primaryDocs.length - 1
          ? primaryDocs[currentIndex + 1]
          : undefined,
    };
  }

  const docItems = SIDEBAR_SECTIONS.flatMap((section) => section.items);
  const currentIndex = docItems.findIndex((item) => item.href === href);
  return {
    previousHref:
      currentIndex > 0 ? docItems[currentIndex - 1]?.href : undefined,
    nextHref: currentIndex >= 0 ? docItems[currentIndex + 1]?.href : undefined,
  };
}
