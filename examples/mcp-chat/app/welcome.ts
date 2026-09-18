import type { ChatWelcomeAction } from '@sinups/ai-kit';
import type { Messages, WelcomePromptId } from './i18n/en';

const PROMPT_SERVERS: Record<WelcomePromptId, string> = {
  team: 'files',
  release: 'files',
  note: 'files',
  docs: 'context7',
  repo: 'deepwiki',
};

const PROMPT_IDS = Object.keys(PROMPT_SERVERS) as WelcomePromptId[];

/** Starter actions for the servers that actually answered the handshake */
export function welcomeActions(
  messages: Messages,
  connected: string[],
  onSelect: (text: string) => void
): ChatWelcomeAction[] {
  return PROMPT_IDS.filter((id) => connected.includes(PROMPT_SERVERS[id])).map((id) => ({
    id,
    label: messages.welcome.prompts[id],
    badge: PROMPT_SERVERS[id],
    onSelect: () => onSelect(messages.welcome.prompts[id]),
  }));
}

/** Short pills above the composer, read-only questions only */
export function welcomeSuggestions(messages: Messages, connected: string[]) {
  return PROMPT_IDS.flatMap((id) => {
    const label = messages.welcome.short[id];
    return label && connected.includes(PROMPT_SERVERS[id])
      ? [{ id, label, value: messages.welcome.prompts[id] }]
      : [];
  });
}
