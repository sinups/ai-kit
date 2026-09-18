import { runAgent, withContext } from '@/lib/agent';
import { guardRequest } from '@/lib/request-guard';
import { badRequest, parseChatRequest } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rejected = guardRequest(request);
  if (rejected) {
    return rejected;
  }
  try {
    const { chatId, prompt, sessionId, model, contextFile } = await parseChatRequest(request);
    return new Response(
      runAgent(chatId, withContext(prompt, contextFile), sessionId, model, request.signal),
      {
        headers: {
          'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return badRequest(error);
  }
}
