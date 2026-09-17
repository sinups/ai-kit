"use client";

import React, { useMemo, useState } from "react";
import { Button, Code, Stack } from "@mantine/core";
import {
  CommandPalette,
  CommandsHelp,
  toPaletteCommands,
  type CommandHelpItem,
  type ShortcutHelpItem,
} from "@sinups/ai-kit";
import { NarrowFrame, WideFrame } from "./frames";

const COMMANDS: CommandHelpItem[] = [
  { name: "review", args: "<path> [--staged]", description: "Review changes in a path", group: "Code", shortcut: "mod+shift+R" },
  { name: "init", description: "Create a AGENTS.md with project instructions", group: "Code" },
  { name: "compact", args: "[instructions]", description: "Summarize the conversation to free context", group: "Session" },
  { name: "clear", description: "Start a new conversation", group: "Session", shortcut: "mod+L" },
  { name: "rewind", description: "Return to an earlier message", group: "Session" },
  { name: "model", args: "[name]", description: "Switch the model", group: "Settings" },
  { name: "mcp", description: "Manage MCP servers", group: "Settings" },
];

const SHORTCUTS: ShortcutHelpItem[] = [
  { keys: "mod+K", description: "Open the command palette", group: "General" },
  { keys: "mod+/", description: "Show this help", group: "General" },
  { keys: "Enter", description: "Send the message", group: "Composer" },
  { keys: ["shift", "enter"], description: "New line", group: "Composer" },
  { keys: "Escape", description: "Stop the agent", group: "Composer" },
];

function CommandsHelpPreview({ narrow = false }: { narrow?: boolean }) {
  const [picked, setPicked] = useState("");
  const help = (
    <div className="p-3">
      {picked && (
        <Code block mb="sm">
          {picked}
        </Code>
      )}
      <CommandsHelp
        commands={COMMANDS}
        shortcuts={SHORTCUTS}
        onCommandSelect={(command) => setPicked(`/${command.name} `)}
      />
    </div>
  );
  return narrow ? <NarrowFrame>{help}</NarrowFrame> : <WideFrame>{help}</WideFrame>;
}

function CommandsPalettePreview() {
  const [opened, setOpened] = useState(false);
  const [picked, setPicked] = useState("");
  const commands = useMemo(() => toPaletteCommands(COMMANDS, (command) => setPicked(`/${command.name}`)), []);
  return (
    <Stack align="center" gap="sm" className="w-full">
      <Button onClick={() => setOpened(true)}>Open palette</Button>
      {picked && <Code>{picked}</Code>}
      <CommandPalette opened={opened} onClose={() => setOpened(false)} commands={commands} />
    </Stack>
  );
}

export function renderHelpPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "CommandsHelp":
    case "CommandsHelp/wide":
      return <CommandsHelpPreview />;
    case "CommandsHelp/narrow":
      return <CommandsHelpPreview narrow />;
    case "CommandsHelp/palette":
      return <CommandsPalettePreview />;
    default:
      return undefined;
  }
}
