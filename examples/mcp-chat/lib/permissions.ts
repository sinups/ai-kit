import type { PermissionRule } from '@sinups/ai-kit';
import type { PermissionState } from './events';

type ChatPermissions = {
  rules: PermissionRule[];
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
  const created: ChatPermissions = { rules: [], auto: false };
  chats.set(chatId, created);
  return created;
}

export function permissionState(chatId: string): PermissionState {
  const chat = forChat(chatId);
  return { rules: chat.rules, auto: chat.auto };
}

export function matchingRule(chatId: string, toolName: string): PermissionRule | undefined {
  return forChat(chatId).rules.find(
    (rule) => rule.behavior === 'allow' && rule.toolName === toolName
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

export function setAutoApprove(chatId: string, auto: boolean): void {
  forChat(chatId).auto = auto;
}

export function resetPermissions(chatId: string): void {
  chats.set(chatId, { rules: [], auto: false });
}
