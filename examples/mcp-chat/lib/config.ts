import path from 'node:path';

const DATA_DIR = '{dataDir}';

export type ServerConfig = {
  name: string;
  transport: 'stdio' | 'http';
  url?: string;
  headers?: Record<string, string>;
  command?: string;
  args?: string[];
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
    return {
      name: name ?? 'mcp',
      url: url ?? 'http://localhost:8091/mcp',
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
  | { command: string; args?: string[] };

export function mcpServers(): Record<string, SdkServer> {
  return Object.fromEntries(
    servers.map((server): [string, SdkServer] => [
      server.name,
      server.transport === 'http'
        ? { type: 'http', url: server.url ?? '', headers: server.headers }
        : { command: server.command ?? '', args: server.args },
    ])
  );
}

export function targetOf(server: ServerConfig): string {
  return server.transport === 'http'
    ? (server.url ?? '')
    : [server.command, ...(server.args ?? [])].join(' ');
}
