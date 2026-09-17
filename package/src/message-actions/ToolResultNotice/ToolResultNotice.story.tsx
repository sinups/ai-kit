import React from 'react';
import { Stack } from '@mantine/core';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { ToolResultNotice } from './ToolResultNotice';

export default { title: 'message-actions/ToolResultNotice' };

function Demo() {
  return (
    <Stack gap="sm">
      <ToolResultNotice
        variant="rejected"
        toolName="Edit"
        detail="src/auth/session.ts"
        feedback="Don't touch the session store, add the retry in the client instead."
      />
      <ToolResultNotice variant="cancelled" toolName="Bash" detail="yarn test --watch" />
      <ToolResultNotice
        variant="error"
        toolName="Bash"
        detail="yarn build"
        errorText={
          "src/auth/client.ts:118:7 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.\n\nFound 1 error in src/auth/client.ts:118"
        }
      />
      <ToolResultNotice
        variant="interrupted"
        toolName="git_search"
        reason="The conversation was stopped before the tool returned."
      />
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

export function Expanded() {
  return (
    <Stack p="xl" maw={520}>
      <ToolResultNotice
        variant="error"
        toolName="Read"
        detail="config/secrets.yml"
        errorText="ENOENT: no such file or directory, open 'config/secrets.yml'"
        defaultExpanded
      />
    </Stack>
  );
}

export const ExpandFlow = {
  render: () => (
    <Stack p="xl" maw={520} gap="sm">
      <ToolResultNotice
        variant="rejected"
        toolName="Edit"
        detail="src/auth/session.ts"
        feedback="Add the retry in the client instead."
      />
      <ToolResultNotice
        variant="error"
        toolName="Bash"
        detail="yarn build"
        errorText="exit code 2"
      />
      <ToolResultNotice variant="cancelled" toolName="Bash" detail="yarn test --watch" />
    </Stack>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const [rejected, failed] = canvas.getAllByRole('button');
    await expect(canvas.getAllByRole('button')).toHaveLength(2);
    await userEvent.click(rejected);
    await expect(rejected).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() =>
      expect(canvas.getByText('Add the retry in the client instead.')).toBeVisible()
    );
    await userEvent.click(failed);
    await waitFor(() => expect(canvas.getByText('exit code 2')).toBeVisible());
  },
};
