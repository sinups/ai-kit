import React from 'react';
import { Box, Stack, Text } from '@mantine/core';
import { AgentWorkspace } from './AgentWorkspace';
import classes from './AgentWorkspace.module.css';

export default { title: 'Demos/AgentWorkspace', parameters: { layout: 'fullscreen' } };

export function Desktop() {
  return <AgentWorkspace />;
}

export function Mobile() {
  return (
    <Stack p="xl" gap="xs" align="flex-start">
      <Text size="xs" c="dimmed">
        390px
      </Text>
      <Box w={390} maw="100%" h={720} className={classes.frame}>
        <AgentWorkspace mobile />
      </Box>
    </Stack>
  );
}
