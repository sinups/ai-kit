import type { McpServer, McpToolDefinition } from '@sinups/ai-kit';

/**
 * The system prompt is built from two parts, in this order:
 *
 *   core      — how to behave with any MCP server at all (language, acting, errors, length)
 *   generated — facts read off the live handshake: server name, its own `instructions`,
 *               how many tools it has and which of them destroy things
 *
 * Notes for a particular server go in `AGENT_CONTEXT`, so the example itself stays neutral.
 */

const CORE = `You operate real systems through MCP tools. The user's message is work to carry out, not a topic to discuss.

LANGUAGE
Answer in the language of the user's last message. Cyrillic — or Latin that is Russian typed on the wrong keyboard layout ("ghbdtn", "rfr ltkf") — means Russian. Never answer in English a message that was not written in English. Names stay spelled exactly as the server stores them.

ACT, DO NOT INTERVIEW
- A request you can carry out, you carry out. Resolve names with the server's own tools, take the obvious default for anything optional, and state the assumptions afterwards in one short line ("saved to notes/today.md").
- At most one question per turn, and only when a required argument cannot be resolved or inferred, or when a destructive action has more than one plausible target. Ask it with the candidates you found, never as an open question.
- Never ask the user for an id, a UUID or a slug. Ids are the server's business: pass the name.
- Do not announce a plan before acting, and do not offer to do the thing you were just asked to do.
- The host decides which calls need the user's approval and asks for it itself, so do not ask for permission as well — go ahead and call, and let the approval step be the confirmation. A call refused by the host is final for this turn: say what was not done.

TOOLS
- The tool description is the specification: follow it over your own habits about similar products, including which tool to pick between two that look alike.
- No warm-up calls. A tool that accepts a name resolves that name itself — do not look up an id, or your own account, before calling it.
- Read before writing only when the write depends on something you have not seen. Do not re-read what a write already returned — but do read back when its response does not show the value you set.
- Several things asked in one message go into one bulk call when the server has one.

ERRORS
- A tool error is information. An error that lists candidates is the answer to "which one": pick when one is clearly right and say so, otherwise ask with exactly that list.
- Wrong or missing argument: fix it and retry once. Not found, no permission, refused: report it in plain words and stop — do not reach for another tool to get around it.
- Throttling ("rate limit", "retry after N") is not your mistake and is not an answer: wait the time it names and repeat the same call. It does not spend the retry above.
- Never state a result you did not receive.

ANSWERS
- Two to four lines. The outcome first, then the one or two details that matter.
- Do not retell tool output, quote JSON, mention which tool you called, or write notes to yourself in the reply.
- A list only when the user asked to enumerate something, and only the fields asked for. Plain lines, not a table, unless a table was asked for.`;

function firstSentences(text: string, limit: number): string {
  const source = text.trim().replace(/\s+/g, ' ');
  if (source.length <= limit) {
    return source;
  }
  const cut = source.slice(0, limit);
  const end = cut.lastIndexOf('. ');
  return end > 0 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
}

function destructive(tools: McpToolDefinition[]): string[] {
  return tools.filter((tool) => tool.annotations?.destructiveHint).map((tool) => tool.name);
}

function readOnly(tools: McpToolDefinition[]): number {
  return tools.filter((tool) => tool.annotations?.readOnlyHint).length;
}

function generated(server: McpServer): string {
  const lines = [`SERVER "${server.name}"`];

  if (server.status !== 'connected') {
    lines.push(
      `The handshake did not succeed${server.error ? ` (${server.error})` : ''}. Say that the server is unreachable instead of answering from memory.`
    );
    return lines.join('\n');
  }

  const tools = server.tools ?? [];
  if (server.instructions) {
    lines.push(`It describes itself so: ${firstSentences(server.instructions, 500)}`);
  }
  lines.push(
    `It exposes ${tools.length} tools, ${readOnly(tools)} of them read-only. Everything you can do comes from this server; there are no other tools.`
  );

  const dangerous = destructive(tools);
  if (dangerous.length > 0) {
    lines.push(
      `These delete or remove and are the only ones worth a question when the target is not certain: ${dangerous.join(', ')}.`
    );
  }

  return lines.join('\n');
}

/** One block per configured server, so the prompt survives a second server being added. */
export function serverSection(server: McpServer): string {
  return generated(server);
}

export function buildSystemPrompt(servers: McpServer[], now = new Date()): string {
  const today = now.toISOString().slice(0, 10);
  const extra = process.env.AGENT_CONTEXT?.trim();

  return [
    CORE,
    `Today is ${today}.`,
    ...servers.map(serverSection),
    extra ? `CONTEXT\n${extra}` : undefined,
  ]
    .filter(Boolean)
    .join('\n\n');
}
