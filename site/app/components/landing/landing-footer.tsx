import Link from "next/link";
import { AppLogo } from "@/app/components/app-logo";
import { LLMS_URL } from "@/app/lib/mcp-setup";
import { PACKAGE_NAME, REPO_URL, SITE_NAME, UPSTREAM_NAME, UPSTREAM_URL } from "@/app/lib/site";

const LINKS = [
  { label: "Docs", href: "/docs" },
  { label: "GitHub", href: REPO_URL },
  { label: "npm", href: `https://www.npmjs.com/package/${PACKAGE_NAME}` },
  { label: "llms.txt", href: LLMS_URL },
  { label: "Mantine", href: "https://mantine.dev" },
];

const linkClass =
  "rounded-sm text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <AppLogo className="size-4" />
            {SITE_NAME}
          </span>
          <span className="text-[13px] text-muted-foreground">
            MIT licensed. Built by Sinups, forked from{" "}
            <a
              href={UPSTREAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-muted-foreground/40 underline-offset-[3px] hover:text-foreground"
            >
              {UPSTREAM_NAME}
            </a>{" "}
            by 21st.dev.
          </span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LINKS.map((link) =>
            link.href.startsWith("/") ? (
              <Link key={link.label} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {link.label}
              </a>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}
