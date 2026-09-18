import type { PermissionRequest } from '@/lib/events';
import {
  deleteRule,
  permissionState,
  resetPermissions,
  saveRule,
  setAutoApprove,
} from '@/lib/permissions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { chatId, auto, reset, save, remove }: PermissionRequest = await request.json();

  if (reset) {
    resetPermissions(chatId);
  }
  if (auto !== undefined) {
    setAutoApprove(chatId, auto);
  }
  if (save) {
    saveRule(chatId, save);
  }
  if (remove) {
    deleteRule(chatId, remove);
  }

  return Response.json(permissionState(chatId));
}
