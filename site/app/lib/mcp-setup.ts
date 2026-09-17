import { SITE_URL } from "@/app/lib/site";

export const LLMS_URL = `${SITE_URL}/llms.txt`;
export const LLMS_FULL_URL = `${SITE_URL}/llms-full.txt`;

export const FETCH_SERVER_CONFIG = `{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}`;

export const PROJECT_INSTRUCTIONS = `## UI

This project builds agent screens with @sinups/ai-kit (Mantine).
Before writing UI code, fetch ${LLMS_FULL_URL}
and use only components, props and exports listed there.`;

export const EXAMPLE_PROMPTS = [
  "Read the AI UI Kit docs and add a full-page AgentChat with a welcome empty state: avatar, greeting and three starter actions.",
  "Embed ChatLauncher in the bottom-right corner of our dashboard with an unread badge, and keep the chat mounted while it is closed.",
  "Show the agent's file changes in DiffReview next to the chat, with accept and reject per file.",
  "Wrap the settings screen in AiKitProvider with the indigo accent and compact density, and add AiKitThemeCustomizer to it.",
  "Render our custom tool-Deploy parts with a toolRenderers entry that reports approve through onToolAction.",
];

export const CONTEXT7_NOTE =
  "Context7 does not index @sinups/ai-kit yet. Until it does, use a fetch server or the project instructions below; both read the same files this site publishes.";
