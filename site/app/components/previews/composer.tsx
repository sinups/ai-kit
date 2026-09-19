"use client";

import React, { useEffect, useState } from "react";
import { Group, Paper, Stack, Text } from "@mantine/core";
import {
  AgentChat,
  ChatDropZone,
  CommandToggles,
  FileAttachment,
  InputBar,
  MicButton,
  SpeakingIndicator,
  StarterCategories,
  VoiceLevel,
  useFileIntake,
  type AttachedFile,
  type CommandToggle,
  type FileRejection,
  type MicState,
  type StarterCategory,
} from "@sinups/ai-kit";
import { IconBook2, IconBrush, IconBug, IconCode, IconSearch } from "@tabler/icons-react";
import { ResultBlock, WideFrame, noop } from "./frames";

function useWobble(active: boolean, bars: number): number[] {
  const [levels, setLevels] = useState<number[]>(() => Array(bars).fill(0));
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      setLevels(
        Array.from({ length: bars }, (_, index) => 0.5 + 0.45 * Math.sin(tick / 2 + index * 1.3)),
      );
    }, 120);
    return () => window.clearInterval(timer);
  }, [active, bars]);
  return active ? levels : Array(bars).fill(0);
}

function UploadStatesPreview() {
  return (
    <Group gap="md" className="w-full">
      <FileAttachment id="1" filename="dataset.csv" status="uploading" progress={64} onCancel={noop} />
      <FileAttachment id="2" filename="recording.m4a" status="uploading" onCancel={noop} />
      <FileAttachment
        id="3"
        filename="archive.zip"
        status="error"
        error="The file is larger than 20 MB"
        onRetry={noop}
        onRemove={noop}
      />
    </Group>
  );
}

let fileId = 0;

function DropZonePreview() {
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [rejected, setRejected] = useState<FileRejection[]>([]);
  const intake = useFileIntake({
    accept: ["image/*", ".pdf", ".md", "text/plain"],
    maxFiles: 4,
    current: files.length,
    onFiles: (picked) =>
      setFiles((current) => [
        ...current,
        ...picked.map((file) => ({ id: `file-${fileId++}`, filename: file.name, size: file.size })),
      ]),
    onReject: setRejected,
  });
  return (
    <WideFrame height={280}>
      <ChatDropZone onFiles={intake.onDrop} style={{ height: "100%" }}>
        {({ isDragOver }) => (
          <Stack gap="xs" p="md" h="100%" justify="flex-end">
            <Text size="sm" c="dimmed">
              Drop files anywhere here, pick them with + or paste them into the field.
            </Text>
            <InputBar
              status="ready"
              onSend={noop}
              onStop={noop}
              onAttach={intake.open}
              onPaste={intake.onPaste}
              leftActions={intake.input}
              isDragOver={isDragOver}
              attachedFiles={files}
              onRemoveFile={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
              contentWidth="100%"
            />
            <ResultBlock
              value={
                rejected.length > 0
                  ? rejected.map((item) => `${item.file.name}: ${item.reason}`).join("\n")
                  : null
              }
            />
          </Stack>
        )}
      </ChatDropZone>
    </WideFrame>
  );
}

const COMMANDS: CommandToggle[] = [
  {
    id: "search",
    label: "Search",
    icon: <IconSearch size={14} />,
    description: "Look things up on the web first",
  },
  { id: "image", label: "Image", icon: <IconBrush size={14} /> },
];

function CommandTogglesPreview() {
  const [command, setCommand] = useState<string | null>("search");
  const [sent, setSent] = useState<string | null>(null);
  return (
    <Stack gap="sm" className="w-full max-w-2xl">
      <InputBar
        status="ready"
        onStop={noop}
        onSend={({ content }) => setSent(command ? `/${command} ${content}` : content)}
        leftActions={<CommandToggles commands={COMMANDS} value={command} onChange={setCommand} />}
        contentWidth="100%"
      />
      <ResultBlock value={sent} />
    </Stack>
  );
}

const CATEGORIES: StarterCategory[] = [
  {
    id: "code",
    label: "Code",
    icon: <IconCode size={14} />,
    starters: [
      { id: "tests", label: "Write tests for a file", value: "Write tests for " },
      { id: "review", label: "Review my branch", value: "Review the changes in my branch." },
    ],
  },
  {
    id: "bugs",
    label: "Bugs",
    icon: <IconBug size={14} />,
    starters: [{ id: "flaky", label: "Find a flaky test", value: "Find why this test is flaky: " }],
  },
  {
    id: "docs",
    label: "Docs",
    icon: <IconBook2 size={14} />,
    starters: [{ id: "readme", label: "Draft a README" }],
  },
];

function StarterCategoriesPreview() {
  const [draft, setDraft] = useState("");
  return (
    <WideFrame height={420}>
      <AgentChat
        messages={[]}
        status="ready"
        onSend={noop}
        onStop={noop}
        draft={draft}
        onDraftChange={setDraft}
        contentWidth="100%"
        emptyState={{
          layout: "center",
          title: "What are we working on?",
          content: (
            <StarterCategories
              categories={CATEGORIES}
              onSelect={(item) => setDraft(item.value ?? item.label)}
            />
          ),
        }}
      />
    </WideFrame>
  );
}

const MIC_STATES: MicState[] = ["idle", "requesting", "listening", "processing", "error", "unsupported"];

function MicStatesPreview() {
  const [level] = useWobble(true, 1);
  return (
    <Group gap="lg">
      {MIC_STATES.map((state) => (
        <Stack key={state} gap={6} align="center">
          <MicButton state={state} level={level} error="Permission denied" />
          <Text size="xs" c="dimmed">
            {state}
          </Text>
        </Stack>
      ))}
    </Group>
  );
}

function VoiceLevelPreview() {
  const input = useWobble(true, 5);
  const output = useWobble(true, 3);
  return (
    <Group gap="xl">
      <VoiceLevel levels={input} />
      <VoiceLevel levels={output} source="assistant" />
      <VoiceLevel levels={0.7} size="xs" />
    </Group>
  );
}

function SpeakingPreview() {
  const [speaking, setSpeaking] = useState(true);
  const levels = useWobble(speaking, 3);
  return (
    <Paper withBorder radius="md" p="sm">
      {speaking ? (
        <SpeakingIndicator speaking levels={levels} onStop={() => setSpeaking(false)} />
      ) : (
        <Text size="sm" c="dimmed" component="button" onClick={() => setSpeaking(true)}>
          Stopped. Click to speak again.
        </Text>
      )}
    </Paper>
  );
}

export function renderComposerPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "FileAttachment/uploads":
      return <UploadStatesPreview />;
    case "ChatDropZone":
    case "ChatDropZone/basic":
      return <DropZonePreview />;
    case "CommandToggles":
    case "CommandToggles/basic":
      return <CommandTogglesPreview />;
    case "StarterCategories":
    case "StarterCategories/basic":
      return <StarterCategoriesPreview />;
    case "MicButton":
    case "MicButton/states":
      return <MicStatesPreview />;
    case "VoiceLevel":
    case "VoiceLevel/basic":
      return <VoiceLevelPreview />;
    case "SpeakingIndicator":
    case "SpeakingIndicator/basic":
      return <SpeakingPreview />;
    default:
      return undefined;
  }
}
