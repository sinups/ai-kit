import React from 'react';
import { useGlobals } from '@storybook/preview-api';
import { Box, Grid, Paper, Stack, Text } from '@mantine/core';
import { NARROW_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { InputBar } from '../input/InputBar';
import { ToolApprovalFooter } from '../tools/ToolApprovalFooter';
import type { ChatMessage } from '../types';
import { UserMessage } from '../UserMessage/UserMessage';
import type { AiKitThemeSettings } from './ai-kit-settings';
import { AiKitThemeCustomizer } from './AiKitThemeCustomizer';

export default { title: 'theme/ThemeCustomizer' };

const MESSAGE: ChatMessage = {
  id: 'theme-user',
  role: 'user',
  parts: [{ type: 'text', text: 'Add a retry to the upload queue and cover it with a test.' }],
} as ChatMessage;

function Preview() {
  return (
    <Stack gap="md">
      <UserMessage message={MESSAGE} />
      <Paper withBorder radius="var(--ae-tool-radius)" style={{ overflow: 'hidden' }}>
        <Text size="xs" c="dimmed" p="xs">
          npm test -- upload-queue
        </Text>
        <ToolApprovalFooter onApprove={() => {}} onReject={() => {}} />
      </Paper>
      <InputBar status="ready" onSend={() => {}} onStop={() => {}} onAttach={() => {}} />
    </Stack>
  );
}

function useSchemeSync() {
  const [, updateGlobals] = useGlobals();
  return (settings: AiKitThemeSettings) => {
    if (settings.colorScheme === 'light' || settings.colorScheme === 'dark') {
      updateGlobals({ theme: settings.colorScheme });
    }
  };
}

export function Usage() {
  const syncScheme = useSchemeSync();
  return (
    <Box p="xl" maw={1100}>
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <AiKitThemeCustomizer onChange={syncScheme} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Preview />
        </Grid.Col>
      </Grid>
    </Box>
  );
}

export function Narrow() {
  const syncScheme = useSchemeSync();
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <AiKitThemeCustomizer onChange={syncScheme} />
    </WidthFrame>
  );
}

export function Controlled() {
  const [value, setValue] = React.useState<AiKitThemeSettings>({
    accent: 'violet',
    radius: 'round',
  });
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Stack gap="xs">
        <AiKitThemeCustomizer value={value} onChange={setValue} sections={{ mode: false }} />
        <Text size="xs" c="dimmed">
          {JSON.stringify(value)}
        </Text>
      </Stack>
    </WidthFrame>
  );
}
