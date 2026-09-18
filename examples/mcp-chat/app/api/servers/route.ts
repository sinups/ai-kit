import { mcpServerInfo } from '@/lib/mcp-tools';
import { guardRequest } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const rejected = guardRequest(request, { json: false });
  if (rejected) {
    return rejected;
  }
  const refresh = new URL(request.url).searchParams.has('refresh');

  return Response.json(await mcpServerInfo(refresh));
}
