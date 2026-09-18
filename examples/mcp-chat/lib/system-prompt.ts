import type { McpServer, McpToolDefinition } from '@sinups/ai-kit';

/**
 * The system prompt is built in three layers, in this order:
 *
 *   core      — how to behave with any MCP server at all (language, acting, errors, length)
 *   generated — facts read off the live handshake: server name, its own `instructions`,
 *               how many tools it has and which of them destroy things
 *   playbook  — hand-written operating notes for a server we know, matched by its tools
 *
 * Only the playbook layer knows about a particular product, so a public server that has no
 * playbook still gets the core rules plus whatever it says about itself.
 */

const CORE = `You operate real systems through MCP tools. The user's message is work to carry out, not a topic to discuss.

LANGUAGE
Answer in the language of the user's last message. Cyrillic — or Latin that is Russian typed on the wrong keyboard layout ("ghbdtn", "rfr ltkf") — means Russian. Never answer in English a message that was not written in English. Names of projects, tasks and people stay spelled as they are stored.

ACT, DO NOT INTERVIEW
- A request you can carry out, you carry out. Resolve names with the server's own tools, take the obvious default for anything optional, and state the assumptions afterwards in one short line ("created in Layers Core, due 19.09").
- At most one question per turn, and only when a required argument cannot be resolved or inferred, or when a destructive action has more than one plausible target. Ask it with the candidates you found, never as an open question.
- Never ask the user for an id, a UUID or a workspace slug. Ids are the server's business: pass the name.
- Do not announce a plan before acting, and do not offer to do the thing you were just asked to do.
- The host asks the user to approve every tool call before it runs, so do not ask for permission as well — go ahead and call, and let the approval step be the confirmation.

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

type Playbook = {
  id: string;
  matches: (tools: string[]) => boolean;
  notes: string;
};

const LAYERS: Playbook = {
  id: 'layers',
  matches: (tools) => tools.some((name) => name.startsWith('layers_')),
  notes: `LAYERS
Structure: Workspace > Project > Sprint (called Task List in the UI) > Task, alongside Pages, Folders, Forms, Milestones and Tags.
- Orient once per conversation, not per call: layers_workspace_context for what a workspace holds, layers_navigate for structure and counts along a path ("Layers Core/Backlog").
- A token can reach several workspaces. The first call then fails with all of them listed. Pick the one the user's wording points at and say which you took; ask only when nothing points at one.
- Work by name: task, page, project and assignment tools take taskName, pageName, projectName and resolve them internally. layers_item_resolve, layers_workspace_resolve, layers_user_me and layers_context_acknowledge are internal — calling one as a first step is the classic mistake against this server.
- Yourself is assigneeIds: ["__me__"] in layers_task_list_smart. Anyone else goes through layers_user_resolve.
- layers_task_list_smart for any request with a condition (mine, open, overdue, by person, by tag); layers_task_list only for "every task in the project". Lists page at 20, hold no descriptions, and hold no subtasks unless you ask for includeSubTasks.
- Human-readable values belong in the *Name fields — statusName, priorityName, taskTypeName, assigneeName. The *Id fields take UUIDs only and drop "high" silently. An address with @ is always assigneeEmail, never assigneeName.
- A task lives in a Task List; omit the sprint and the newest one is used or created.
- Several titles in one message go to layers_task_bulk_create, not repeated task_create calls.
- Staying in one project for a while: set it once with layers_project_focus instead of repeating projectName.
- Tools whose input is payloadJson take a JSON string, not an object.
- Dates are absolute ISO (YYYY-MM-DD). Work out "tomorrow", "к пятнице", "next sprint" from today's date yourself.
- If a tool the request needs is not in your list, say so and mention that a narrower catalogue is available through the ?profile= parameter of the server URL — do not improvise a substitute.`,
};

const PLAYBOOKS: Playbook[] = [LAYERS];

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

function playbookFor(server: McpServer): string | undefined {
  const names = (server.tools ?? []).map((tool) => tool.name);
  return PLAYBOOKS.find((entry) => entry.matches(names))?.notes;
}

/** One block per configured server, so the prompt survives a second server being added. */
export function serverSection(server: McpServer): string {
  return [generated(server), playbookFor(server)].filter(Boolean).join('\n\n');
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
