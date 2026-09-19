import { INSTALL_COMMAND, PEER_DEPENDENCIES } from "@/app/lib/package-info";
import { LLMS_FULL_URL, LLMS_URL } from "@/app/lib/mcp-setup";
import { PACKAGE_NAME, SITE_URL } from "@/app/lib/site";

export const SKILL_URL = `${SITE_URL}/skills/ai-kit/SKILL.md`;

const PEER_RANGES = PEER_DEPENDENCIES.map((peer) => `${peer.name} ${peer.range}`).join(", ");

export const AGENT_SETUP_STEPS = [
  `Read ${LLMS_URL}. For props and examples read ${LLMS_FULL_URL}, and use only the components, props and exports listed there.`,
  `Install the package and its peers with the project's package manager (npm: \`${INSTALL_COMMAND}\`). Peer ranges: ${PEER_RANGES}. If an installed peer is older, ask before upgrading it.`,
  `Import the stylesheets once at the app root: \`@mantine/core/styles.css\`, then \`${PACKAGE_NAME}/styles.css\`.`,
  "Render the kit inside `MantineProvider`, reusing the app's provider if it has one. Wrap the chat in `AiKitProvider` to apply the kit theme; without it the kit follows the Mantine theme.",
  "Render `AgentChat` on the chat screen and connect it to the chat state the project already has: `messages`, `status` (`'submitted' | 'streaming' | 'ready' | 'error'`), `onSend` and `onStop`. The kit makes no network requests, so keep the existing transport. With the AI SDK, pass `messages` and `status` from `useChat()` as they are and map `onSend` to `({ content }) => sendMessage({ text: content })`.",
  "Run the project's type check and build, and fix what they report.",
];

export const AGENT_SETUP_PROMPT = [
  `Set up AI UI Kit (${PACKAGE_NAME}) in this project.`,
  "",
  ...AGENT_SETUP_STEPS.map((step, index) => `${index + 1}. ${step}`),
].join("\n");
