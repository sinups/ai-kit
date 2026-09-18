import type { PermissionState } from './events';

type ChatPermissions = {
  allowed: Set<string>;
  auto: boolean;
};

const globalKey = Symbol.for('ai-kit-example.chat-permissions');
const store = globalThis as unknown as Record<symbol, Map<string, ChatPermissions> | undefined>;
const chats: Map<string, ChatPermissions> = store[globalKey] ?? new Map();
store[globalKey] = chats;

function forChat(chatId: string): ChatPermissions {
  const existing = chats.get(chatId);
  if (existing) {
    return existing;
  }
  const created: ChatPermissions = { allowed: new Set(), auto: false };
  chats.set(chatId, created);
  return created;
}

export function permissionState(chatId: string): PermissionState {
  const chat = forChat(chatId);
  return { allowed: [...chat.allowed].sort(), auto: chat.auto };
}

export function isPreApproved(chatId: string, toolName: string): boolean {
  const chat = forChat(chatId);
  return chat.auto || chat.allowed.has(toolName);
}

export function rememberTool(chatId: string, toolName: string): void {
  forChat(chatId).allowed.add(toolName);
}

export function setAutoApprove(chatId: string, auto: boolean): void {
  forChat(chatId).auto = auto;
}

export function resetPermissions(chatId: string): void {
  chats.set(chatId, { allowed: new Set(), auto: false });
}
