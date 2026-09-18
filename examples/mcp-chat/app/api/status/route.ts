import { config, servers, targetOf } from '@/lib/config';
import type { StatusResponse } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const body: StatusResponse = {
    servers: servers.map((server) => ({
      name: server.name,
      transport: server.transport,
      target: targetOf(server),
    })),
    model: config.model,
  };

  return Response.json(body);
}
