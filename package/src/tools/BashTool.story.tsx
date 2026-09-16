import React from 'react';
import { Stack } from '@mantine/core';
import { BashTool } from './BashTool';
import { bashPart } from './_stories-shared';

export default { title: 'tools/BashTool' };

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <BashTool part={bashPart('input-streaming')} />
      <BashTool part={bashPart('input-available')} />
      <BashTool
        part={bashPart('output-available', {
          output: { stdout: 'src/index.ts(12,5): error TS2322\nFound 1 error.', exitCode: 1 },
        })}
      />
      <BashTool
        part={bashPart('output-available', {
          output: { stdout: 'Done in 3.2s.', exitCode: 0 },
        })}
      />
      <BashTool
        part={bashPart('output-error', {
          errorText: 'Command failed',
        })}
      />
    </Stack>
  );
}

export function WithApproval() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <BashTool
        part={bashPart('input-available', {
          input: {
            command: 'rm -rf dist && yarn build',
            approval: {
              onApprove: () => console.log('approve'),
              onReject: () => console.log('reject'),
            },
          },
        })}
      />
      <BashTool
        part={bashPart('output-available', {
          input: {
            command: 'yarn build',
            approval: { approveLabel: 'Run', rejectLabel: 'Cancel' },
          },
          output: { stdout: 'Built in 2.1s', exitCode: 0 },
        })}
      />
    </Stack>
  );
}
