import path from 'node:path';

const DATA_DIR = '{dataDir}';

function list(value: string | undefined, fallback: string[]): string[] {
  const parts = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : fallback;
}

export const sampleDir = path.join(process.cwd(), 'data');

export const config = {
  serverName: process.env.MCP_SERVER_NAME || 'files',
  command: process.env.MCP_COMMAND || 'npx',
  args: list(process.env.MCP_ARGS, ['-y', '@modelcontextprotocol/server-filesystem', DATA_DIR]).map(
    (arg) => arg.replace(DATA_DIR, sampleDir)
  ),
  model: process.env.AGENT_MODEL || 'claude-sonnet-5',
  maxTurns: Number(process.env.AGENT_MAX_TURNS || 12),
};
