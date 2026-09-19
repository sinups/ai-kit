import React from 'react';
import { Stack } from '@mantine/core';
import type { ToolCallStep } from '../types/timeline';
import { ActionRow } from './ActionRow';
import { GenericTool, GenericToolRow } from './GenericTool';
import { IconEye } from '@tabler/icons-react';

export default { title: 'Tools/ActionRow' };

const step: ToolCallStep = {
  id: 's1',
  type: 'tool-call',
  toolName: 'Lint',
  toolDetail: 'package/src',
  duration: Number.MAX_SAFE_INTEGER,
};

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <ActionRow step={step} state="animating" onComplete={() => {}} index={0} />
      <ActionRow step={step} state="animating" onComplete={() => {}} index={1} />
      <ActionRow step={step} state="complete" onComplete={() => {}} index={2} />
      <GenericToolRow step={step} state="animating" onComplete={() => {}} />
      <GenericToolRow step={step} state="complete" onComplete={() => {}} />
      <GenericTool icon={IconEye} title="Reading" subtitle="package.json" isPending />
      <GenericTool icon={IconEye} title="Read" subtitle="package.json" isPending={false} />
    </Stack>
  );
}
