import { generateAgentElementsOg } from "@/lib/og";
import { seoPages } from "@/app/lib/seo";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return seoPages().map((page) => ({ image: `${page.id}.png` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ image: string }> }) {
  const { image } = await params;
  const page = seoPages().find((item) => `${item.id}.png` === image)!;
  return generateAgentElementsOg({
    title: page.title,
    description: page.summary,
    section: page.section,
    eyebrow: page.eyebrow,
  });
}
