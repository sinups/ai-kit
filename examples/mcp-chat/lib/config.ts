import path from 'node:path';

const DATA_DIR = '{dataDir}';

function list(value: string | undefined, fallback: string[]): string[] {
  const parts = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : fallback;
}

function headers(): Record<string, string> {
  const result: Record<string, string> = {};
  if (process.env.MCP_TOKEN) {
    result.Authorization = `Bearer ${process.env.MCP_TOKEN}`;
  }
  for (const pair of list(process.env.MCP_HEADERS, [])) {
    const [name, ...rest] = pair.split(':');
    if (name && rest.length > 0) {
      result[name.trim()] = rest.join(':').trim();
    }
  }
  return result;
}

export const sampleDir = path.join(process.cwd(), 'data');

const transport: 'stdio' | 'http' = process.env.MCP_TRANSPORT === 'http' ? 'http' : 'stdio';

export const config = {
  serverName: process.env.MCP_SERVER_NAME || 'files',
  transport,
  url: process.env.MCP_URL || 'http://localhost:8091/mcp',
  headers: headers(),
  command: process.env.MCP_COMMAND || 'npx',
  args: list(process.env.MCP_ARGS, ['-y', '@modelcontextprotocol/server-filesystem', DATA_DIR]).map(
    (arg) => arg.replace(DATA_DIR, sampleDir)
  ),
  model: process.env.AGENT_MODEL || 'claude-sonnet-5',
  maxTurns: Number(process.env.AGENT_MAX_TURNS || 12),
};

export const mcpServer =
  transport === 'http'
    ? ({ type: 'http', url: config.url, headers: config.headers } as const)
    : ({ command: config.command, args: config.args } as const);

export function mcpTarget(): string {
  return transport === 'http' ? config.url : [config.command, ...config.args].join(' ');
}
