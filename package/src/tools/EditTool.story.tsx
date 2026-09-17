import React from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { EditTool } from './EditTool';
import { demoHighlighter, editPart, NEW_CODE } from './_stories-shared';

export default { title: 'tools/EditTool' };

export function Usage() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <EditTool part={editPart('input-streaming', { input: {} })} />
      <EditTool part={editPart('input-available')} />
      <EditTool part={editPart('output-available', { output: { success: true } })} />
      <EditTool
        part={{
          type: 'tool-Write',
          toolCallId: 'write-1',
          state: 'output-available',
          input: { file_path: '/project/src/new-file.json', content: '{\n  "a": 1,\n  "b": 2\n}' },
          output: { success: true },
        }}
      />
      <EditTool
        part={editPart('output-available', {
          output: {
            structuredPatch: [{ lines: ['-const a = 1;', '+const a = 2;', ' export { a };'] }],
          },
        })}
      />
    </Stack>
  );
}

export function Collapsible() {
  const longNew = Array.from(
    { length: 30 },
    (_, i) => `line ${i + 1}: ${NEW_CODE.split('\n')[i % 4]}`
  ).join('\n');
  return (
    <Stack p={40} maw={420} gap={16}>
      <EditTool
        isCollapsible
        part={editPart('output-available', {
          input: { file_path: '/project/src/long.ts', old_string: '', new_string: longNew },
          output: { success: true },
        })}
      />
    </Stack>
  );
}

export function WithApproval() {
  return (
    <Stack p={40} maw={420} gap={16}>
      <EditTool
        part={editPart('input-available', {
          input: {
            file_path: '/project/src/utils/greet.ts',
            old_string: 'a',
            new_string: 'b',
            approval: { onApprove: () => console.log('approve') },
          },
        })}
      />
    </Stack>
  );
}

export function WordAndSyntaxHighlight() {
  return (
    <Stack p={40} maw={520} gap={16}>
      <EditTool wordHighlight part={editPart('output-available', { output: { success: true } })} />
      <EditTool
        wordHighlight
        part={editPart('output-available', { output: { success: true } })}
        highlighter={demoHighlighter}
      />
    </Stack>
  );
}

type EditApprovalArgs = { onApprove: (scope?: string) => void; onReject: () => void };
type FlowContext<A> = { canvasElement: HTMLElement; args: A };

function EditApprovalCard({ onApprove, onReject }: EditApprovalArgs) {
  return (
    <Stack p={40} maw={420}>
      <EditTool
        wordHighlight
        part={editPart('input-available', {
          toolCallId: 'edit-approval-flow',
          input: {
            file_path: '/project/src/utils/greet.ts',
            old_string: 'const a = 1;',
            new_string: 'const a = 2;',
            approval: { approveLabel: 'Apply', rejectLabel: 'Discard', onApprove, onReject },
          },
        })}
      />
    </Stack>
  );
}

export const ApproveEditFlow = {
  args: { onApprove: fn(), onReject: fn() },
  render: (args: EditApprovalArgs) => <EditApprovalCard {...args} />,
  play: async ({ canvasElement, args }: FlowContext<EditApprovalArgs>) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelectorAll('mark').length).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await expect(args.onApprove).toHaveBeenCalledWith();
    await expect(canvas.getByRole('button', { name: 'Discard' })).toBeDisabled();
  },
};

export const RejectEditFlow = {
  args: { onApprove: fn(), onReject: fn() },
  render: (args: EditApprovalArgs) => <EditApprovalCard {...args} />,
  play: async ({ canvasElement, args }: FlowContext<EditApprovalArgs>) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Discard' }));
    await expect(args.onReject).toHaveBeenCalledTimes(1);
    await expect(args.onApprove).not.toHaveBeenCalled();
  },
};
