import { config, sampleDir } from '@/lib/config';
import type { StatusResponse } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const body: StatusResponse = {
    server: config.serverName,
    command: [config.command, ...config.args].join(' '),
    model: config.model,
    sampleDir,
  };

  return Response.json(body);
}
