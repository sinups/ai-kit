import {
  deleteRule,
  permissionState,
  resetPermissions,
  saveRule,
  setPermissionMode,
} from '@/lib/permissions';
import { guardRequest } from '@/lib/request-guard';
import { badRequest, parsePermissionRequest } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rejected = guardRequest(request);
  if (rejected) {
    return rejected;
  }
  try {
    const { chatId, mode, reset, save, remove } = await parsePermissionRequest(request);
    if (reset) {
      resetPermissions(chatId);
    }
    if (mode) {
      setPermissionMode(chatId, mode);
    }
    if (save) {
      saveRule(chatId, save);
    }
    if (remove) {
      deleteRule(chatId, remove);
    }
    return Response.json(permissionState(chatId));
  } catch (error) {
    return badRequest(error);
  }
}
