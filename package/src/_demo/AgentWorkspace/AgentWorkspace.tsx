import React, { useState } from 'react';
import {
  ActionIcon,
  AppShell,
  Badge,
  Burger,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconBug,
  IconCommand,
  IconFileDiff,
  IconDownload,
  IconListCheck,
  IconMessagePlus,
  IconMoonStars,
  IconRocket,
  IconSettings,
  IconSparkles,
} from '@tabler/icons-react';
import { AgentChat } from '../../AgentChat/AgentChat';
import { DiffReviewModal } from '../../diff/DiffReview/DiffReviewModal';
import { DIFF_FIXTURES } from '../../diff/fixtures';
import type { FileChange, FileDecision } from '../../diff/types';
import { CommandPalette } from '../../primitives/CommandPalette/CommandPalette';
import type { PaletteCommand } from '../../primitives/CommandPalette/command-palette';
import { ShortcutHint } from '../../primitives/ShortcutHint/ShortcutHint';
import { ExportDialog } from '../../sessions/ExportDialog';
import { createSessionFixtures } from '../../sessions/fixtures';
import { SessionList } from '../../sessions/SessionList';
import type { SessionSummary } from '../../sessions/types';
import { BackgroundTasksDrawer } from '../../tasks/BackgroundTasksPanel/BackgroundTasksDrawer';
import { createTaskFixtures } from '../../tasks/fixtures';
import { TaskStatusPill } from '../../tasks/TaskStatusPill/TaskStatusPill';
import type { BackgroundTask } from '../../tasks/types';
import { AgentStatus } from '../../AgentStatus/AgentStatus';
import { ContextUsage } from '../../ContextUsage/ContextUsage';
import { EffortSelector } from '../../model-settings/EffortSelector/EffortSelector';
import { AiKitProvider } from '../../theme/AiKitProvider';
import type { ChatMessage } from '../../types';
import { createConversationHistory, DEMO_COMPLETIONS } from './demo-script';
import { DEMO_TOOL_RENDERERS } from './demo-tool-renderers';
import { useDemoChat } from './use-demo-chat';
import { useWorkspaceSettings, wait } from './use-workspace-settings';
import {
  WORKSPACE_SETTINGS_SECTIONS,
  WorkspaceSettings,
  type WorkspaceSettingsSection,
} from './WorkspaceSettings';
import classes from './AgentWorkspace.module.css';

export interface AgentWorkspaceProps {
  /** Forces the mobile layout regardless of the viewport, for rendering inside a narrow frame */
  mobile?: boolean;
}

const CURRENT_SESSION_ID = 'current';
const NARROW_QUERY_MOBILE = '(min-width: 0px)';

function mapTask(
  tasks: BackgroundTask[],
  id: string,
  patch: Partial<BackgroundTask>
): BackgroundTask[] {
  return tasks.map((task) =>
    task.id === id
      ? { ...task, ...patch }
      : task.children
        ? { ...task, children: mapTask(task.children, id, patch) }
        : task
  );
}

function createCurrentSession(): SessionSummary {
  return {
    id: CURRENT_SESSION_ID,
    title: 'Fix flaky checkout e2e test',
    preview: 'The submit click happens before the payment iframe finishes loading.',
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 2,
    model: 'qwen-2.5-coder-32b',
    branch: 'fix/checkout-e2e',
  };
}

/** Example host that assembles a full agent product from the kit on top of Mantine `AppShell` */
export function AgentWorkspace(props: AgentWorkspaceProps) {
  return (
    <AiKitProvider persistKey="ai-kit-demo-theme">
      <Workspace {...props} />
    </AiKitProvider>
  );
}

function Workspace({ mobile = false }: AgentWorkspaceProps) {
  const settings = useWorkspaceSettings();
  const { toggleColorScheme } = useMantineColorScheme();
  const chat = useDemoChat({
    initialMessages: createConversationHistory(),
    onAlwaysAllow: settings.permissions.addAllowRule,
  });

  const [navOpened, setNavOpened] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>(() => [
    createCurrentSession(),
    ...createSessionFixtures(),
  ]);
  const [activeSessionId, setActiveSessionId] = useState(CURRENT_SESSION_ID);
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [settingsSection, setSettingsSection] = useState<WorkspaceSettingsSection>('general');
  const [paletteOpened, setPaletteOpened] = useState(false);
  const [tasksOpened, setTasksOpened] = useState(false);
  const [tasks, setTasks] = useState<BackgroundTask[]>(() => createTaskFixtures());
  const [diffOpened, setDiffOpened] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, FileDecision>>({});
  const [exporting, setExporting] = useState<{ title: string; messages: ChatMessage[] } | null>(
    null
  );
  const [contextUsed, setContextUsed] = useState(142_000);

  const activeSession = sessions.find((session) => session.id === activeSessionId);
  const pendingChanges = DIFF_FIXTURES.filter((change) => !decisions[change.path]).length;

  const openSettings = (section: WorkspaceSettingsSection = settingsSection) => {
    setSettingsSection(section);
    setSettingsOpened(true);
    setNavOpened(false);
  };

  const switchSession = (sessionId: string) => {
    if (sessionId === activeSessionId) {
      setNavOpened(false);
      return;
    }
    setConversations((current) => ({ ...current, [activeSessionId]: chat.messages }));
    chat.reset(
      conversations[sessionId] ??
        (sessionId === CURRENT_SESSION_ID
          ? createConversationHistory()
          : createConversationHistory().slice(0, 2))
    );
    setActiveSessionId(sessionId);
    setNavOpened(false);
  };

  const newChat = () => {
    const session: SessionSummary = {
      id: `session-${Date.now().toString(36)}`,
      title: 'New chat',
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
    };
    setConversations((current) => ({
      ...current,
      [activeSessionId]: chat.messages,
      [session.id]: [],
    }));
    setSessions((current) => [session, ...current]);
    chat.reset([]);
    setActiveSessionId(session.id);
    setNavOpened(false);
  };

  const decide = (decision: FileDecision) => async (change: FileChange) => {
    await wait(400);
    setDecisions((current) => ({ ...current, [change.path]: decision }));
  };
  const decideAll = (decision: FileDecision) => async () => {
    await wait(600);
    setDecisions(Object.fromEntries(DIFF_FIXTURES.map((change) => [change.path, decision])));
  };

  const paletteCommands: PaletteCommand[] = [
    {
      id: 'new-chat',
      label: 'New chat',
      group: 'Chat',
      icon: <IconMessagePlus size={16} />,
      onSelect: newChat,
    },
    {
      id: 'review-changes',
      label: 'Review changes',
      description: `${pendingChanges} files waiting for review`,
      group: 'Chat',
      icon: <IconFileDiff size={16} />,
      onSelect: () => setDiffOpened(true),
    },
    {
      id: 'export',
      label: 'Export conversation',
      group: 'Chat',
      icon: <IconDownload size={16} />,
      onSelect: () =>
        setExporting({ title: activeSession?.title ?? 'Conversation', messages: chat.messages }),
    },
    {
      id: 'tasks',
      label: 'Show tasks',
      group: 'Workspace',
      icon: <IconListCheck size={16} />,
      onSelect: () => setTasksOpened(true),
    },
    {
      id: 'theme',
      label: 'Toggle theme',
      group: 'Workspace',
      icon: <IconMoonStars size={16} />,
      onSelect: toggleColorScheme,
    },
    ...WORKSPACE_SETTINGS_SECTIONS.map((section) => ({
      id: `settings:${section.id}`,
      label: `Open settings: ${section.label}`,
      description: section.description,
      group: 'Settings',
      icon: section.icon,
      keywords: ['settings', 'preferences'],
      onSelect: () => openSettings(section.id),
    })),
  ];

  const isAnswering = chat.status === 'submitted' || chat.status === 'streaming';
  const statusBar = isAnswering ? (
    <AgentStatus
      label={chat.waitingFor ?? (chat.status === 'submitted' ? 'Thinking' : 'Working')}
      startedAt={chat.startedAt}
      lastActivityAt={chat.lastActivityAt}
      tokens={chat.tokens}
      paused={chat.waitingFor !== null}
      onStop={chat.stop}
    />
  ) : null;

  const taskPill = (
    <TaskStatusPill tasks={tasks} onOpen={() => setTasksOpened(true)} showWhenEmpty />
  );

  return (
    <>
      <AppShell
        className={classes.shell}
        data-mobile={mobile || undefined}
        header={{ height: 48 }}
        navbar={{
          width: 300,
          breakpoint: mobile ? 100_000 : 'sm',
          collapsed: { mobile: !navOpened },
        }}
        padding={0}
      >
        <AppShell.Header>
          <Group h="100%" px="md" gap="xs" wrap="nowrap">
            <Burger
              opened={navOpened}
              onClick={() => setNavOpened((value) => !value)}
              hiddenFrom={mobile ? undefined : 'sm'}
              size="sm"
              aria-label="Toggle navigation"
            />
            <Text fw={500} size="sm" truncate flex={1}>
              {activeSession?.title ?? 'New chat'}
            </Text>
            <Button
              size="compact-sm"
              variant="light"
              leftSection={<IconFileDiff size={14} />}
              rightSection={
                pendingChanges > 0 ? (
                  <Badge size="xs" circle>
                    {pendingChanges}
                  </Badge>
                ) : undefined
              }
              onClick={() => setDiffOpened(true)}
              className={classes.noShrink}
            >
              {mobile ? (
                'Review'
              ) : (
                <>
                  <Text component="span" inherit visibleFrom="sm">
                    Review changes
                  </Text>
                  <Text component="span" inherit hiddenFrom="sm">
                    Review
                  </Text>
                </>
              )}
            </Button>
            <Tooltip label={<ShortcutHint keys="mod+K" label="Command palette" />}>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Command palette"
                onClick={() => setPaletteOpened(true)}
              >
                <IconCommand size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar className={classes.navbar}>
          <AppShell.Section px="xs" pt="md" pb="xs">
            <Stack gap="xs">
              <Group gap="sm" px="sm" wrap="nowrap">
                <ThemeIcon variant="light" size="md">
                  <IconSparkles size={16} />
                </ThemeIcon>
                <Text size="sm" fw={500}>
                  Acme Agent
                </Text>
              </Group>
              <Button
                leftSection={<IconMessagePlus size={16} />}
                variant="subtle"
                color="gray"
                justify="flex-start"
                onClick={newChat}
              >
                New chat
              </Button>
            </Stack>
          </AppShell.Section>
          <AppShell.Section grow component={ScrollArea} px="xs">
            <SessionList
              sessions={sessions}
              selectedId={activeSessionId}
              onSelect={(session) => switchSession(session.id)}
              onRename={async (session, title) => {
                await wait(400);
                setSessions((current) =>
                  current.map((item) => (item.id === session.id ? { ...item, title } : item))
                );
              }}
              onPin={(session, pinned) =>
                setSessions((current) =>
                  current.map((item) => (item.id === session.id ? { ...item, pinned } : item))
                )
              }
              onArchive={(session, archived) =>
                setSessions((current) =>
                  current.map((item) => (item.id === session.id ? { ...item, archived } : item))
                )
              }
              onDelete={async (session) => {
                await wait(400);
                setSessions((current) => current.filter((item) => item.id !== session.id));
              }}
              onExport={(session) =>
                setExporting({
                  title: session.title,
                  messages:
                    session.id === activeSessionId
                      ? chat.messages
                      : (conversations[session.id] ?? createConversationHistory()),
                })
              }
            />
          </AppShell.Section>
          <AppShell.Section px="xs" py="sm" className={classes.navFooter}>
            <Stack gap="xs" align="stretch">
              <Button
                variant="subtle"
                color="gray"
                justify="flex-start"
                leftSection={<IconSettings size={16} />}
                onClick={() => openSettings()}
              >
                Settings
              </Button>
              <Group gap="xs" px="sm" wrap="nowrap">
                <IconListCheck size={16} className={classes.noShrink} />
                {taskPill}
              </Group>
            </Stack>
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main className={classes.main}>
          <AgentChat
            messages={chat.messages}
            status={chat.status}
            onSend={(message) => chat.send(message.content)}
            onStop={chat.stop}
            contentWidth={760}
            collapseToolRuns
            alignComposer
            statusBar={statusBar}
            inputBarProps={{
              placeholder: 'Ask anything, / for commands, @ for agents',
              completions: DEMO_COMPLETIONS,
              leftActions: (
                <EffortSelector
                  variant="inline"
                  value={settings.effort.value}
                  onChange={settings.effort.onChange}
                  thinking={settings.effort.thinking}
                  onThinkingChange={settings.effort.onThinkingChange}
                />
              ),
              rightActions: (
                <ContextUsage
                  used={contextUsed}
                  total={200_000}
                  segments={[
                    { label: 'System prompt', value: 18_000, color: 'gray' },
                    { label: 'Tools', value: 34_000, color: 'violet' },
                    { label: 'Messages', value: Math.max(0, contextUsed - 52_000), color: 'blue' },
                  ]}
                  onCompact={() => setContextUsed(64_000)}
                />
              ),
            }}
            toolRenderers={DEMO_TOOL_RENDERERS}
            onToolAction={chat.handleToolAction}
            onRetry={chat.retryLast}
            messageActions={{
              onRetry: chat.retry,
              onEdit: chat.edit,
              onFeedback: () => {},
            }}
            emptyState={{
              avatar: <IconSparkles size={22} />,
              title: 'What should we work on?',
              description:
                'The agent reads the repository, runs tools and asks before changing files.',
              actions: [
                { id: 'explore', label: 'Find why the auth test is flaky', icon: <IconBug /> },
                {
                  id: 'deploy',
                  label: 'Deploy the release build',
                  icon: <IconRocket />,
                  badge: 'New',
                },
                { id: 'plan', label: 'Plan the token refresh refactor', icon: <IconListCheck /> },
                { id: 'error', label: 'Simulate an error', icon: <IconAlertTriangle /> },
              ],
            }}
            className={classes.chat}
          />
        </AppShell.Main>
      </AppShell>

      <WorkspaceSettings
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
        section={settingsSection}
        onSectionChange={setSettingsSection}
        settings={settings}
        onCommandSelect={() => setSettingsOpened(false)}
      />

      <CommandPalette
        opened={paletteOpened}
        onClose={() => setPaletteOpened(false)}
        onOpen={() => setPaletteOpened(true)}
        hotkey="mod+K"
        commands={paletteCommands}
        placeholder="Search commands and settings"
      />

      <BackgroundTasksDrawer
        opened={tasksOpened}
        onClose={() => setTasksOpened(false)}
        tasks={tasks}
        narrowQuery={mobile ? NARROW_QUERY_MOBILE : undefined}
        onStop={async (task) => {
          await wait(500);
          setTasks((current) =>
            mapTask(current, task.id, { status: 'cancelled', endedAt: Date.now() })
          );
        }}
        onRetryTask={async (task) => {
          await wait(500);
          setTasks((current) =>
            mapTask(current, task.id, {
              status: 'running',
              startedAt: Date.now(),
              endedAt: undefined,
              error: undefined,
            })
          );
        }}
        onRemove={(task) => setTasks((current) => current.filter((item) => item.id !== task.id))}
      />

      <DiffReviewModal
        opened={diffOpened}
        onClose={() => setDiffOpened(false)}
        changes={DIFF_FIXTURES}
        decisions={decisions}
        onAccept={decide('accepted')}
        onReject={decide('rejected')}
        onAcceptAll={decideAll('accepted')}
        onRejectAll={decideAll('rejected')}
        narrowQuery={mobile ? NARROW_QUERY_MOBILE : undefined}
      />

      <ExportDialog
        opened={exporting !== null}
        onClose={() => setExporting(null)}
        title={exporting?.title}
        messages={exporting?.messages ?? []}
        onDownload={() => setExporting(null)}
      />
    </>
  );
}
