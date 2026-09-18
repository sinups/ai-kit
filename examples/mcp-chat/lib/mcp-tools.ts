import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { McpServer, McpToolDefinition } from '@sinups/ai-kit';
import { config } from './config';

const globalKey = Symbol.for('ai-kit-example.mcp-server');
const store = globalThis as unknown as Record<symbol, Promise<McpServer> | undefined>;

function transportFor() {
  if (config.transport === 'http') {
    return new StreamableHTTPClientTransport(new URL(config.url), {
      requestInit: { headers: config.headers },
    });
  }
  return new StdioClientTransport({ command: config.command, args: config.args });
}

async function describeServer(): Promise<McpServer> {
  const client = new Client({ name: 'ai-kit-example', version: '0.0.0' });
  const base: McpServer = {
    id: config.serverName,
    name: config.serverName,
    transport: config.transport,
    status: 'connecting',
    scope: 'local',
    ...(config.transport === 'http'
      ? { url: config.url }
      : { command: config.command, args: config.args }),
  };

  try {
    await client.connect(transportFor());
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
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await client.close().catch(() => {});
  }
}

export function mcpServerInfo(refresh = false): Promise<McpServer> {
  if (refresh || !store[globalKey]) {
    store[globalKey] = describeServer();
  }
  return store[globalKey];
}

export async function toolDefinition(toolName: string): Promise<McpToolDefinition | undefined> {
  const server = await mcpServerInfo();
  const bare = toolName.replace(`mcp__${server.name}__`, '');
  return server.tools?.find((tool) => tool.name === bare || tool.name === toolName);
}
