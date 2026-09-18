import { config, publicTarget, servers } from '@/lib/config';
import type { StatusResponse } from '@/lib/events';
import { guardRequest } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const rejected = guardRequest(request, { json: false });
  if (rejected) {
    return rejected;
  }
  const body: StatusResponse = {
    servers: servers.map((server) => ({
      name: server.name,
      transport: server.transport,
      target: publicTarget(server),
    })),
    model: config.model,
  };

  return Response.json(body);
}
