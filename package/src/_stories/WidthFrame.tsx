import React from 'react';
import { Box, Stack, Text } from '@mantine/core';

export const NARROW_WIDTH = 360;
export const WIDE_WIDTH = 900;

export function WidthFrame({ width, children }: { width: number; children: React.ReactNode }) {
  return (
    <Stack p="xl" gap="xs">
      <Text size="xs" c="dimmed">
        {width}px
      </Text>
      <Box w={width} maw="100%">
        {children}
      </Box>
    </Stack>
  );
}
