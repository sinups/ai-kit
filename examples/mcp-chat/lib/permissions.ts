import type { PermissionRule } from '@sinups/ai-kit';
import type { PermissionMode, PermissionState } from './events';

type ChatPermissions = {
  rules: PermissionRule[];
  mode: PermissionMode;
};

/** Chats kept in memory; the least recently used one is dropped past this number */
const MAX_CHATS = 200;

const DEFAULT_MODE: PermissionMode = 'ask-writes';

const globalKey = Symbol.for('ai-kit-example.chat-permissions');
const store = globalThis as unknown as Record<symbol, Map<string, ChatPermissions> | undefined>;
const chats: Map<string, ChatPermissions> = store[globalKey] ?? new Map();
store[globalKey] = chats;

function touch(chatId: string, chat: ChatPermissions): ChatPermissions {
  chats.delete(chatId);
  chats.set(chatId, chat);
  while (chats.size > MAX_CHATS) {
    const oldest = chats.keys().next().value;
    if (oldest === undefined) {
      break;
    }
    chats.delete(oldest);
  }
  return chat;
}

function forChat(chatId: string): ChatPermissions {
  return touch(chatId, chats.get(chatId) ?? { rules: [], mode: DEFAULT_MODE });
}

export function permissionState(chatId: string): PermissionState {
  const chat = chats.get(chatId);
  return chat ? { rules: chat.rules, mode: chat.mode } : { rules: [], mode: DEFAULT_MODE };
}

export function matchingRule(
  chatId: string,
  toolName: string,
  behavior: PermissionRule['behavior']
): PermissionRule | undefined {
  return chats
    .get(chatId)
    ?.rules.find(
      (rule) => rule.behavior === behavior && rule.toolName === toolName && !rule.specifier
    );
}

export function addRule(chatId: string, toolName: string, scope: PermissionRule['scope']): void {
  const chat = forChat(chatId);
  if (chat.rules.some((rule) => rule.toolName === toolName && rule.behavior === 'allow')) {
    return;
  }
  chat.rules = [
    ...chat.rules,
    {
      id: `${toolName}-${Date.now()}`,
      behavior: 'allow',
      toolName,
      scope,
      createdAt: new Date().toISOString(),
      source: 'this chat',
    },
  ];
}

export function saveRule(chatId: string, rule: PermissionRule): void {
  const chat = forChat(chatId);
  const known = chat.rules.some((item) => item.id === rule.id);
  chat.rules = known
    ? chat.rules.map((item) => (item.id === rule.id ? rule : item))
    : [...chat.rules, rule];
}

export function deleteRule(chatId: string, ruleId: string): void {
  const chat = forChat(chatId);
  chat.rules = chat.rules.filter((rule) => rule.id !== ruleId);
}

export function setPermissionMode(chatId: string, mode: PermissionMode): void {
  forChat(chatId).mode = mode;
}

export function resetPermissions(chatId: string): void {
  touch(chatId, { rules: [], mode: DEFAULT_MODE });
}
