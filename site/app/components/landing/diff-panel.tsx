"use client";

import { useState } from "react";
import { Group, ScrollArea, SegmentedControl, Stack, Text } from "@mantine/core";
import { DiffFileView, DiffStats } from "@sinups/ai-kit";
import { PREVIEW_DIFF_SOURCES } from "./preview-data";
import { previewHighlighter } from "./preview-highlighter";

export function DiffPanel() {
  const [sourceId, setSourceId] = useState(PREVIEW_DIFF_SOURCES[0].id);
  const source =
    PREVIEW_DIFF_SOURCES.find((item) => item.id === sourceId) ?? PREVIEW_DIFF_SOURCES[0];
  const additions = source.changes.reduce((sum, change) => sum + (change.additions ?? 0), 0);
  const deletions = source.changes.reduce((sum, change) => sum + (change.deletions ?? 0), 0);

  return (
    <div className="flex size-full min-h-0 flex-col">
      <Group justify="space-between" wrap="nowrap" gap="sm" px="md" h={48} className="shrink-0 border-b border-border">
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" fw={600}>
            Changes
          </Text>
          <DiffStats additions={additions} deletions={deletions} />
        </Group>
        <SegmentedControl
          size="xs"
          value={sourceId}
          onChange={setSourceId}
          data={PREVIEW_DIFF_SOURCES.map((item) => ({ value: item.id, label: item.label }))}
          aria-label="Changes source"
        />
      </Group>
      <ScrollArea className="min-h-0 flex-1" type="hover">
        <Stack gap="sm" p="sm">
          {source.changes.map((change) => (
            <DiffFileView
              key={`${source.id}-${change.path}`}
              change={change}
              highlighter={previewHighlighter}
              contextLines={2}
            />
          ))}
        </Stack>
      </ScrollArea>
    </div>
  );
}
