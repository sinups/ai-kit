/** Public origin including the Pages sub-path, overridable at build time */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sinups.github.io/ai-kit";
/** Sub-path the site is served from, "" for the domain root */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const SITE_NAME = "AI UI Kit";
export const PACKAGE_NAME = "@sinups/ai-kit";
export const REPO_URL = "https://github.com/sinups/ai-kit";
export const UPSTREAM_NAME = "Agent Elements";
export const UPSTREAM_URL = "https://github.com/21st-dev/agent-elements";
export const UPSTREAM_SITE_URL = "https://agent-elements.21st.dev";
