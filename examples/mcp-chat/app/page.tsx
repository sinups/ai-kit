'use client';

import { ActionIcon, Box, Group, Menu, Tooltip, useMantineColorScheme } from '@mantine/core';
import { IconLanguage, IconLayoutSidebarRight, IconMoon, IconSun } from '@tabler/icons-react';
import {
  AgentChat,
  ChatHeader,
  ChatInspectorLayout,
  ContextUsage,
  type McpServer,
  type PermissionRule,
  type ToolApprovals,
  ModeSelector,
  ModelPicker,
  quietPresentation,
} from '@sinups/ai-kit';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ApprovalDetails,
  ApprovalOutcome,
  PermissionMode,
  StatusResponse,
} from '@/lib/events';
import { MODELS } from '@/lib/models';
import { buildToolCatalog } from '@/lib/tool-catalog';
import { buildToolArgs } from './tool-args';
import { useAgentChat } from '@/lib/use-agent-chat';
import type { Messages } from './i18n/en';
import { useLocale } from './i18n/locale';
import { MESSAGES, type Locale } from './i18n/locales';
import { useInspectorPanels } from './inspector';
import { welcomeActions, welcomeSuggestions } from './welcome';

const CONTEXT_FILE = 'onboarding.md';

const REJECTED_OUTCOMES = new Set<ApprovalOutcome>(['deny', 'blocked', 'interrupted']);

export default function Page() {
  const { locale, messages: t, setLocale } = useLocale();
  const {
    messages,
    status,
    error,
    send,
    stop,
    retry,
    approvals,
    decide,
    permissions,
    updatePermissions,
    usage,
    model,
    setModel,
  } = useAgentChat(t.chat);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [serverStatus, setServerStatus] = useState<StatusResponse | null>(null);
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [loadingServers, setLoadingServers] = useState(true);
  const toolArgs = useMemo(() => buildToolArgs(t.me), [t.me]);
  const toolCatalog = useMemo(
    () => buildToolCatalog(mcpServers, t.toolTitles),
    [mcpServers, t.toolTitles]
  );
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [contextRemoved, setContextRemoved] = useState(false);
  const [classicStream, setClassicStream] = useState(false);

  useEffect(() => {
    setClassicStream(new URLSearchParams(window.location.search).has('classic'));
  }, []);

  const loadServers = useCallback(async (refresh = false) => {
    setLoadingServers(true);
    try {
      const response = await fetch(`/api/servers${refresh ? '?refresh' : ''}`);
      setMcpServers((await response.json()) as McpServer[]);
    } finally {
      setLoadingServers(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/status')
      .then((response) => response.json() as Promise<StatusResponse>)
      .then(setServerStatus)
      .catch(() => {});
    void loadServers();
  }, [loadServers]);

  const connected = useMemo(
    () => mcpServers.filter((server) => server.status === 'connected').map((server) => server.name),
    [mcpServers]
  );
  const unreachable = useMemo(
    () => mcpServers.filter((server) => server.status === 'error'),
    [mcpServers]
  );

  const chatApprovals = useMemo<ToolApprovals>(
    () =>
      Object.fromEntries(
        Object.values(approvals).map((approval) => [
          approval.toolCallId,
          {
            reason: approval.details
              ? t.approval.effect[approval.details.effect](approval.details.server)
              : undefined,
            approveOptions: t.approval.options,
            requestedBy: approval.details ? { name: approval.details.server } : undefined,
            matchedRule: approval.matchedRule,
            ruleSuggestion: approval.details
              ? {
                  value: approval.details.ruleSuggestion,
                  label: t.approval.alwaysAllowTool,
                }
              : undefined,
            labels: t.kit?.approval,
            onExplain: approval.details
              ? async () => ({
                  risk: approval.details!.risk,
                  explanation: explainCall(t, approval.details!),
                  reasoning: approval.details!.reasoning,
                })
              : undefined,
            onApprove: (scope?: string) =>
              decide(
                approval.requestId,
                scope === 'always' ? 'always' : scope === 'session' ? 'session' : 'once'
              ),
            onReject: () => decide(approval.requestId, 'deny'),
            outcome: approval.outcome
              ? {
                  decision: REJECTED_OUTCOMES.has(approval.outcome)
                    ? ('rejected' as const)
                    : ('approved' as const),
                  scope:
                    approval.outcome === 'interrupted'
                      ? t.approval.interrupted
                      : REJECTED_OUTCOMES.has(approval.outcome)
                        ? undefined
                        : approval.outcome === 'rule'
                          ? t.approval.byRule
                          : approval.outcome === 'auto'
                            ? t.approval.automatic
                            : approval.outcome,
                }
              : undefined,
          },
        ])
      ),
    [approvals, decide, t]
  );

  const reconnect = useCallback(() => void loadServers(true), [loadServers]);
  const saveRule = useCallback(
    (rule: PermissionRule) => updatePermissions({ save: rule }),
    [updatePermissions]
  );
  const removeRule = useCallback(
    (rule: PermissionRule) => updatePermissions({ remove: rule.id }),
    [updatePermissions]
  );

  const inspectorPanels = useInspectorPanels({
    messages: t,
    servers: mcpServers,
    loading: loadingServers,
    rules: permissions.rules,
    onReconnect: reconnect,
    onSaveRule: saveRule,
    onDeleteRule: removeRule,
  });

  const header = (
    <ChatHeader
      title={t.title}
      labels={t.kit?.chatHeader}
      rightSection={
        <Group gap="xs" wrap="nowrap">
          <Tooltip label={t.header.inspector}>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => setInspectorOpen((open) => !open)}
              aria-label={t.header.showInspector}
            >
              <IconLayoutSidebarRight size={18} />
            </ActionIcon>
          </Tooltip>
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" aria-label={t.header.language}>
                <IconLanguage size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {(Object.keys(MESSAGES) as Locale[]).map((option) => (
                <Menu.Item
                  key={option}
                  onClick={() => setLocale(option)}
                  fw={option === locale ? 600 : undefined}
                  lang={option}
                >
                  {MESSAGES[option].languageName}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={toggleColorScheme}
            aria-label={t.header.toggleTheme}
          >
            {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Group>
      }
    />
  );

  const lostServer = unreachable[0];
  const contextFile = connected.includes('files') ? CONTEXT_FILE : undefined;
  const contextItems = contextFile
    ? [
        {
          id: contextFile,
          label: contextFile,
          description: t.context.description,
          removed: contextRemoved,
        },
      ]
    : undefined;
  const sendWithContext = useCallback(
    (message: { content: string }) =>
      send({ ...message, contextFile: contextRemoved ? undefined : contextFile }),
    [send, contextRemoved, contextFile]
  );

  const inputBarProps = {
    contextItems,
    onRemoveContext: () => setContextRemoved(true),
    onRestoreContext: () => setContextRemoved(false),
    placeholder: t.composer.placeholder,
    labels: t.kit?.input,
    infoBar: lostServer
      ? {
          title: t.serverLost.title(lostServer.name),
          description: lostServer.error ?? t.serverLost.fallback,
          position: 'top' as const,
          action: { label: t.serverLost.reconnect, onClick: reconnect },
        }
      : undefined,
    leftActions: (
      <>
        <ModeSelector
          modes={t.approvalModes}
          value={permissions.mode}
          onChange={(mode) =>
            void updatePermissions({ mode: mode as PermissionMode }).catch(() => {})
          }
          labels={{ trigger: t.composer.approvalMode, title: t.composer.approvalModeTitle }}
          shortcuts
        />
        <ModelPicker
          models={MODELS}
          value={model ?? serverStatus?.model}
          onChange={setModel}
          labels={{ trigger: t.composer.chooseModel, placeholder: t.composer.model }}
        />
      </>
    ),
    rightActions: usage ? (
      <ContextUsage
        used={usage.contextTokens}
        total={usage.contextWindow}
        ariaLabel={t.composer.contextUsage}
        labels={t.kit?.contextUsage}
      />
    ) : undefined,
  };

  return (
    <ChatInspectorLayout
      panels={inspectorPanels}
      opened={inspectorOpen}
      onOpenedChange={setInspectorOpen}
      defaultOpened={false}
      style={{ height: '100dvh' }}
    >
      <Box h="100%" display="flex" style={{ flexDirection: 'column' }}>
        {header}
        <Box style={{ flex: 1, minHeight: 0 }}>
          <AgentChat
            messages={messages}
            status={status}
            error={error}
            onSend={sendWithContext}
            onStop={stop}
            onRetry={retry}
            approvals={chatApprovals}
            toolCatalog={toolCatalog}
            toolArgs={toolArgs}
            locale={t.locale}
            evenSpacing
            presentation={quietPresentation}
            sendScroll={classicStream ? 'bottom' : 'prompt-top'}
            streamingCaret={!classicStream}
            lazyTurns={!classicStream}
            labels={t.kit?.chat}
            suggestions={welcomeSuggestions(t, connected)}
            withSearch
            inputBarProps={inputBarProps}
            contentWidth={760}
            wrapLines
            responsiveTables
            emptySuggestionsPlacement="input"
            emptyState={{
              layout: 'welcome',
              title: t.welcome.title,
              description: t.welcome.description,
              actions: welcomeActions(t, connected, (text) => send({ content: text })),
              labels: t.kit?.welcome,
            }}
          />
        </Box>
      </Box>
    </ChatInspectorLayout>
  );
}

function explainCall(t: Messages, details: ApprovalDetails): string {
  const effect = t.approval.effect[details.effect](details.server);
  const why = details.effect === 'read' ? t.approval.askedForEveryCall : t.approval.needsPermission;
  return `${effect} ${why}`;
}
