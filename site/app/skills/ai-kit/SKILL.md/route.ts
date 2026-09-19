import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-static";

export function GET() {
  return new Response(fs.readFileSync(path.join(process.cwd(), "skills/ai-kit/SKILL.md"), "utf8"), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
