import React from 'react';
import { Paper, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { AGENT_MODELS, AGENTS, TOOL_CATALOG } from '../fixtures';
import { AgentDetail, type AgentDetailProps } from './AgentDetail';

export default { title: 'Agents & skills/AgentDetail' };

function Demo(props: Partial<AgentDetailProps>) {
  return (
    <Paper withBorder radius="md">
      <AgentDetail
        agent={AGENTS[0]}
        catalog={TOOL_CATALOG}
        models={AGENT_MODELS}
        onUseInChat={() => {}}
        onEdit={() => {}}
        onDuplicate={() => {}}
        onDelete={() => {}}
        {...props}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={720}>
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
      <Demo agent={AGENTS[2]} />
    </WidthFrame>
  );
}

export function ReadOnly() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo agent={AGENTS[3]} />
    </WidthFrame>
  );
}

export function BuiltIn() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo agent={AGENTS[4]} />
    </WidthFrame>
  );
}
