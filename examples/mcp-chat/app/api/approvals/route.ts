import { settleApproval } from '@/lib/approvals';
import { guardRequest } from '@/lib/request-guard';
import { badRequest, parseApprovalRequest } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rejected = guardRequest(request);
  if (rejected) {
    return rejected;
  }
  try {
    const { chatId, requestId, choice } = await parseApprovalRequest(request);
    const settled = settleApproval(chatId, requestId, choice);
    return Response.json({ settled }, { status: settled ? 200 : 404 });
  } catch (error) {
    return badRequest(error);
  }
}
