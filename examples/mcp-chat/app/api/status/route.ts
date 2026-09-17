import { config, mcpTarget, sampleDir } from '@/lib/config';
import type { StatusResponse } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const body: StatusResponse = {
    server: config.serverName,
    transport: config.transport,
    target: mcpTarget(),
    model: config.model,
    sampleDir: config.transport === 'stdio' ? sampleDir : undefined,
  };

  return Response.json(body);
}
