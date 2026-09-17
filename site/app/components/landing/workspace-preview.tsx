"use client";

import { useMemo, useState } from "react";
import { ActionIcon, Badge, Group, Text, Tooltip } from "@mantine/core";
import { IconEdit, IconGitBranch } from "@tabler/icons-react";
import {
  AgentChat,
  SessionList,
  type ChatMessage,
  type ChatStatus,
} from "@sinups/ai-kit";
import { DiffPanel } from "./diff-panel";
import { previewHighlighter } from "./preview-highlighter";
import {
  ACTIVE_SESSION_ID,
  PREVIEW_MESSAGES,
  createPreviewSessions,
} from "./preview-data";

const REPLY =
  "This is a static preview, so nothing runs here. The installation page shows how to connect AgentChat to your own model.";

export function WorkspacePreview() {
  const [now] = useState(() => new Date());
  const sessions = useMemo(() => createPreviewSessions(now), [now]);
  const [selectedId, setSelectedId] = useState(ACTIVE_SESSION_ID);
  const [messages, setMessages] = useState<ChatMessage[]>(PREVIEW_MESSAGES);
  const [status, setStatus] = useState<ChatStatus>("ready");

  const send = ({ content }: { role: "user"; content: string }) => {
    const id = Date.now().toString(36);
    setMessages((current) => [
      ...current,
      { id: `user-${id}`, role: "user", parts: [{ type: "text", text: content }] },
    ]);
    setStatus("submitted");
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { id: `assistant-${id}`, role: "assistant", parts: [{ type: "text", text: REPLY }] },
      ]);
      setStatus("ready");
    }, 700);
  };

  const active = sessions.find((session) => session.id === selectedId) ?? sessions[0];

  return (
    <div className="grid size-full grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)_minmax(0,1.08fr)]">
      <aside
        aria-label="Sessions"
        className="hidden min-h-0 flex-col border-r border-border bg-muted/30 md:flex lg:hidden xl:flex"
      >
        <Group justify="space-between" wrap="nowrap" px="sm" h={48} className="shrink-0">
          <Text size="sm" fw={600}>
            Sessions
          </Text>
          <Tooltip label="New chat">
            <ActionIcon variant="subtle" color="gray" aria-label="New chat">
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <SessionList
            sessions={sessions}
            now={now}
            selectedId={selectedId}
            onSelect={(session) => setSelectedId(session.id)}
            withFilter={false}
          />
        </div>
      </aside>
      <section aria-label="Conversation" className="flex min-h-0 min-w-0 flex-col">
        <Group
          justify="space-between"
          wrap="nowrap"
          gap="sm"
          px="md"
          h={48}
          className="shrink-0 border-b border-border"
        >
          <Text size="sm" fw={500} truncate>
            {active.title}
          </Text>
          {active.branch && (
            <Badge
              variant="light"
              color="gray"
              radius="sm"
              leftSection={<IconGitBranch size={12} />}
              tt="none"
              className="hidden shrink-0 sm:inline-flex"
            >
              {active.branch}
            </Badge>
          )}
        </Group>
        <div className="min-h-0 flex-1">
          <AgentChat
            messages={messages}
            status={status}
            onSend={send}
            onStop={() => setStatus("ready")}
            highlighter={previewHighlighter}
            wrapLines
            initialScrollBehavior="top"
          />
        </div>
      </section>
      <section
        aria-label="Changes"
        className="hidden min-h-0 min-w-0 flex-col border-l border-border lg:flex"
      >
        <DiffPanel />
      </section>
    </div>
  );
}
