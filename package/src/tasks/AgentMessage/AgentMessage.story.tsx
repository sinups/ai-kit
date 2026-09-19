import React from 'react';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { createTaskFixtures } from '../fixtures';
import type { AgentMessageData } from '../types';
import { AgentMessage } from './AgentMessage';

export default { title: 'Sessions & tasks/AgentMessage' };

const MESSAGES: AgentMessageData[] = [
  ...(createTaskFixtures()[0].messages ?? []),
  { id: 'm3', from: { name: 'lead', color: 'blue' }, summary: 'Wrap up and report in 5 minutes' },
];

function Demo() {
  return (
    <Stack gap="lg">
      {MESSAGES.map((message, index) => (
        <AgentMessage key={message.id} message={message} defaultExpanded={index === 0} />
      ))}
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={520}>
      <Demo />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}
