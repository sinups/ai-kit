import React from 'react';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { FILESYSTEM_SERVER, GIT_SERVER } from './fixtures';
import { McpToolDetail } from './McpToolDetail';

export default { title: 'MCP/McpToolDetail' };

const SEARCH = GIT_SERVER.tools![0];
const EDIT = FILESYSTEM_SERVER.tools![2];

export function Usage() {
  return (
    <Stack p="xl" maw={760}>
      <McpToolDetail tool={SEARCH} serverName="git" onBack={() => {}} onTry={() => {}} />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <McpToolDetail tool={EDIT} serverName="filesystem" onBack={() => {}} />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <McpToolDetail tool={SEARCH} serverName="git" onTry={() => {}} />
    </WidthFrame>
  );
}

export function NoArguments() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <McpToolDetail
        tool={{
          name: 'list_allowed_directories',
          description: 'Directories the server can access.',
          annotations: { readOnlyHint: true },
        }}
      />
    </WidthFrame>
  );
}
