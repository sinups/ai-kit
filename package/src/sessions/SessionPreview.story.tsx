import React from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Paper } from '@mantine/core';
import { prepareFlow } from '../_stories/flow-helpers';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { createSessionFixtures, sessionConversation } from './fixtures';
import { SessionPreview, type SessionPreviewProps } from './SessionPreview';

export default { title: 'sessions/SessionPreview' };

const SESSION = createSessionFixtures()[0];

function Demo({ width, ...props }: Partial<SessionPreviewProps> & { width: number }) {
  return (
    <WidthFrame width={width}>
      <Paper withBorder radius="md">
        <SessionPreview
          session={SESSION}
          messages={sessionConversation}
          onResume={() => {}}
          onExport={() => {}}
          {...props}
        />
      </Paper>
    </WidthFrame>
  );
}

export function Usage() {
  return <Demo width={640} />;
}

export function Narrow() {
  return <Demo width={NARROW_WIDTH} maxMessages={3} />;
}

export function Wide() {
  return <Demo width={WIDE_WIDTH} />;
}

export function Loading() {
  return <Demo width={640} loading />;
}

export const ErrorState = {
  name: 'Error',
  render: () => <Demo width={640} error="Could not load the conversation." onRetry={() => {}} />,
};

type PreviewFlowArgs = Required<Pick<SessionPreviewProps, 'onResume' | 'onExport'>>;

export const ResumeExportFlow = {
  args: { onResume: fn(), onExport: fn() },
  render: (args: PreviewFlowArgs) => <Demo width={640} {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: PreviewFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: SESSION.title })).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Resume' }));
    await expect(args.onResume).toHaveBeenCalledWith(SESSION);
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }));
    await expect(args.onExport).toHaveBeenCalledWith(SESSION);
    await expect(args.onResume).toHaveBeenCalledTimes(1);
  },
};
