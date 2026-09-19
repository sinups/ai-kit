import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  getDefaultEnvironment,
  StdioClientTransport,
} from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { McpServer, McpToolDefinition } from '@sinups/ai-kit';
import { publicTarget, redact, type ServerConfig, servers } from './config';

const globalKey = Symbol.for('ai-kit-example.mcp-servers');
const store = globalThis as unknown as Record<symbol, Promise<McpServer[]> | undefined>;

function transportFor(server: ServerConfig) {
  if (server.transport === 'http') {
    return new StreamableHTTPClientTransport(new URL(server.url ?? ''), {
      requestInit: { headers: server.headers },
    });
  }
  return new StdioClientTransport({
    command: server.command ?? '',
    args: server.args ?? [],
    env: server.env ? { ...getDefaultEnvironment(), ...server.env } : undefined,
  });
}

async function describe(server: ServerConfig): Promise<McpServer> {
  const client = new Client({ name: 'ai-kit-example', version: '0.0.0' });
  const base: McpServer = {
    id: server.name,
    name: server.name,
    transport: server.transport,
    status: 'connecting',
    scope: 'local',
    ...(server.transport === 'http' ? { url: publicTarget(server) } : { command: server.command }),
  };

  try {
    await client.connect(transportFor(server));
    const info = client.getServerVersion();
    const capabilities = client.getServerCapabilities();
    const { tools } = await client.listTools();
    return {
      ...base,
      status: 'connected',
      version: info?.version,
      instructions: client.getInstructions(),
      capabilities: {
        tools: Boolean(capabilities?.tools),
        resources: Boolean(capabilities?.resources),
        prompts: Boolean(capabilities?.prompts),
        logging: Boolean(capabilities?.logging),
      },
      tools: tools as McpToolDefinition[],
      toolCount: tools.length,
    };
  } catch (error) {
    return {
      ...base,
      status: 'error',
      error: `${publicTarget(server)}: ${redact(error instanceof Error ? error.message : String(error), server)}`,
    };
  } finally {
    await client.close().catch(() => {});
  }
}

export function mcpServerInfo(refresh = false): Promise<McpServer[]> {
  if (refresh || !store[globalKey]) {
    store[globalKey] = Promise.all(servers.map(describe));
  }
  return store[globalKey];
}

export async function toolDefinition(toolName: string): Promise<McpToolDefinition | undefined> {
  for (const server of await mcpServerInfo()) {
    const bare = toolName.replace(`mcp__${server.name}__`, '');
    const found = server.tools?.find((tool) => tool.name === bare || tool.name === toolName);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/**
 * Whether a tool only reads, by its MCP annotations alone: `readOnlyHint` defaults to `false`, so a
 * tool the server did not mark as read-only is treated as one that changes data
 */
export async function isReadOnlyTool(toolName: string): Promise<boolean> {
  return (await toolDefinition(toolName))?.annotations?.readOnlyHint === true;
}
