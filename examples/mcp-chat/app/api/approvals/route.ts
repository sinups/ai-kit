import { settleApproval } from '@/lib/approvals';
import type { ApprovalRequest } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { requestId, decision }: ApprovalRequest = await request.json();
  const settled = settleApproval(requestId, decision);

  return Response.json({ settled }, { status: settled ? 200 : 404 });
}
