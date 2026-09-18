import type { PermissionRequest } from '@/lib/events';
import { permissionState, resetPermissions, setAutoApprove } from '@/lib/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { chatId, auto, reset }: PermissionRequest = await request.json();

  if (reset) {
    resetPermissions(chatId);
  }
  if (auto !== undefined) {
    setAutoApprove(chatId, auto);
  }

  return Response.json(permissionState(chatId));
}
