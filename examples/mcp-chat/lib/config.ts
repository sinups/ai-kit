import path from 'node:path';

const DATA_DIR = '{dataDir}';

export type ServerConfig = {
  name: string;
  transport: 'stdio' | 'http';
  url?: string;
  headers?: Record<string, string>;
  command?: string;
  args?: string[];
  /** Environment of a stdio server; the place for its secrets, never `args` */
  env?: Record<string, string>;
};

type ServerInput = Partial<ServerConfig> & { token?: string };

export const sampleDir = path.join(process.cwd(), 'data');

function list(value: string | undefined, fallback: string[] = []): string[] {
  const parts = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : fallback;
}

function pairs(value: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of list(value)) {
    const [name, ...rest] = pair.split(':');
    if (name && rest.length > 0) {
      result[name.trim()] = rest.join(':').trim();
    }
  }
  return result;
}

function normalize(input: ServerInput, index: number): ServerConfig | null {
  const name = input.name ?? `server-${index + 1}`;
  const headers = { ...input.headers };
  if (input.token) {
    headers.Authorization = `Bearer ${input.token}`;
  }
  if (input.url) {
    return { name, transport: 'http', url: input.url, headers };
  }
  if (input.command) {
    return {
      name,
      transport: 'stdio',
      command: input.command,
      args: (input.args ?? []).map((arg) => arg.replace(DATA_DIR, sampleDir)),
      env: input.env,
    };
  }
  return null;
}

/** Everything before MCP_SERVERS: one server spread over MCP_TRANSPORT, MCP_URL, MCP_COMMAND… */
function legacyServer(): ServerInput | null {
  const name = process.env.MCP_SERVER_NAME;
  const transport = process.env.MCP_TRANSPORT;
  const url = process.env.MCP_URL;
  const command = process.env.MCP_COMMAND;
  if (!name && !transport && !url && !command) {
    return null;
  }
  if (transport === 'http' || (!command && url)) {
    if (!url) {
      throw new Error('MCP_TRANSPORT=http needs MCP_URL');
    }
    return {
      name: name ?? 'mcp',
      url,
      token: process.env.MCP_TOKEN,
      headers: pairs(process.env.MCP_HEADERS),
    };
  }
  return {
    name: name ?? 'files',
    command: command ?? 'npx',
    args: list(process.env.MCP_ARGS, ['-y', '@modelcontextprotocol/server-filesystem', DATA_DIR]),
  };
}

function parseServers(): ServerConfig[] {
  const inputs: ServerInput[] = [];

  const legacy = legacyServer();
  if (legacy) {
    inputs.push(legacy);
  }

  const raw = process.env.MCP_SERVERS?.trim();
  if (raw) {
    try {
      inputs.push(...(JSON.parse(raw) as ServerInput[]));
    } catch (error) {
      throw new Error(
        `MCP_SERVERS is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (inputs.length === 0) {
    inputs.push({
      name: 'files',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', DATA_DIR],
    });
  }

  return inputs
    .map(normalize)
    .filter((server): server is ServerConfig => server !== null)
    .filter((server, index, all) => all.findIndex((item) => item.name === server.name) === index);
}

export const servers = parseServers();

export const config = {
  model: process.env.AGENT_MODEL || 'claude-sonnet-5',
  maxTurns: Number(process.env.AGENT_MAX_TURNS || 30),
  contextWindow: Number(process.env.AGENT_CONTEXT_WINDOW || 200000),
};

export function serverOf(toolName: string): ServerConfig | undefined {
  return servers.find((server) => toolName.startsWith(`mcp__${server.name}__`));
}

type SdkServer =
  | { type: 'http'; url: string; headers?: Record<string, string> }
  | { command: string; args?: string[]; env?: Record<string, string> };

export function mcpServers(): Record<string, SdkServer> {
  return Object.fromEntries(
    servers.map((server): [string, SdkServer] => [
      server.name,
      server.transport === 'http'
        ? { type: 'http', url: server.url ?? '', headers: server.headers }
        : { command: server.command ?? '', args: server.args, env: server.env },
    ])
  );
}

/** Address without credentials: scheme, host and path of a URL, or the bare command of stdio */
export function publicTarget(server: ServerConfig): string {
  if (server.transport !== 'http') {
    return server.command ?? '';
  }
  try {
    const url = new URL(server.url ?? '');
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return '';
  }
}

/** Removes the values a server is configured with (URL, headers, arguments, env) from a text */
export function redact(text: string, server: ServerConfig): string {
  const secrets = [
    server.url,
    ...Object.values(server.headers ?? {}),
    ...(server.args ?? []),
    ...Object.values(server.env ?? {}),
  ]
    .filter((value): value is string => typeof value === 'string' && value.length >= 4)
    .sort((a, b) => b.length - a.length);
  return secrets.reduce(
    (result, secret) =>
      result.split(secret).join(secret === server.url ? publicTarget(server) : '…'),
    text
  );
}
