import { mcpServerInfo } from '@/lib/mcp-tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const refresh = new URL(request.url).searchParams.has('refresh');

  return Response.json(await mcpServerInfo(refresh));
}
