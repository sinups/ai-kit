import type { McpServer, McpToolDefinition } from '@sinups/ai-kit';

export type ToolCatalogEntry = Pick<
  McpToolDefinition,
  'title' | 'description' | 'annotations' | 'inputSchema' | 'outputSchema'
> & {
  /** Server the tool belongs to */
  server: string;
};

/**
 * Tool definitions keyed by the name a call carries in the transcript, `mcp__<server>__<tool>`;
 * `titles` replaces the title a server sends, keyed by `server/tool`
 */
export function buildToolCatalog(
  servers: McpServer[],
  titles: Record<string, string> = {}
): Record<string, ToolCatalogEntry> {
  const catalog: Record<string, ToolCatalogEntry> = {};
  for (const server of servers) {
    for (const tool of server.tools ?? []) {
      catalog[`mcp__${server.name}__${tool.name}`] = {
        server: server.name,
        title: titles[`${server.name}/${tool.name}`] ?? tool.title,
        description: tool.description,
        annotations: tool.annotations,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      };
    }
  }
  return catalog;
}
