import { runAgent } from '@/lib/agent';
import type { ChatRequest } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { prompt, sessionId }: ChatRequest = await request.json();

  return new Response(runAgent(prompt, sessionId, request.signal), {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
