import React from 'react';
import { Box, Stack } from '@mantine/core';
import { ToolApprovalFooter } from './ToolApprovalFooter';

export default { title: 'tools/ToolApprovalFooter' };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Box
      style={{
        border: '1px solid var(--ae-border)',
        borderRadius: 'var(--ae-tool-radius)',
        overflow: 'hidden',
      }}
    >
      <Box p={10} fz={12} c="var(--ae-fg-muted)">
        Card body
      </Box>
      {children}
    </Box>
  );
}

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <Frame>
        <ToolApprovalFooter onApprove={() => console.log('approve')} />
      </Frame>
      <Frame>
        <ToolApprovalFooter isPending approveLabel="Run" rejectLabel="Cancel" />
      </Frame>
    </Stack>
  );
}
