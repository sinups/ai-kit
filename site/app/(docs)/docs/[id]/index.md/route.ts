import { COMPONENT_DOCS, componentIdFromName } from "@/app/data/component-docs";
import { renderComponent } from "@/app/lib/component-markdown";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENT_DOCS.map((item) => ({ id: componentIdFromName(item.name) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = COMPONENT_DOCS.find((item) => componentIdFromName(item.name) === id)!;
  return new Response(renderComponent(doc.name, 1), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
