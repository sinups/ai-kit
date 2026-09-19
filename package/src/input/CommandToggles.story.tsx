import React, { useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { IconBrush, IconSearch, IconSparkles } from '@tabler/icons-react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { CommandToggles, type CommandToggle } from './CommandToggles';
import { InputBar } from './InputBar';

export default { title: 'Input/CommandToggles' };

type Canvas = { canvasElement: HTMLElement };

const COMMANDS: CommandToggle[] = [
  {
    id: 'search',
    label: 'Search',
    icon: <IconSearch size={14} />,
    description: 'Look things up on the web before answering',
  },
  { id: 'image', label: 'Image', icon: <IconBrush size={14} />, description: 'Draw a picture' },
  { id: 'think', label: 'Think', icon: <IconSparkles size={14} />, disabled: true },
];

function Composer({ onSend }: { onSend: (message: { content: string }) => void }) {
  const [command, setCommand] = useState<string | null>(null);
  return (
    <InputBar
      status="ready"
      onStop={() => {}}
      onSend={(message) =>
        onSend({ content: command ? `/${command} ${message.content}` : message.content })
      }
      contentWidth="100%"
      leftActions={<CommandToggles commands={COMMANDS} value={command} onChange={setCommand} />}
    />
  );
}

export function Usage() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Composer onSend={() => {}} />
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Composer onSend={() => {}} />
    </WidthFrame>
  );
}

export const PickCommandFlow = {
  args: { onSend: fn() },
  render: ({ onSend }: { onSend: (message: { content: string }) => void }) => (
    <WidthFrame width={WIDE_WIDTH}>
      <Composer onSend={onSend} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: { onSend: ReturnType<typeof fn> } }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole('button', { name: 'Search' });
    await userEvent.click(search);
    await expect(search).toHaveAttribute('aria-pressed', 'true');
    await userEvent.type(canvas.getByRole('textbox'), 'mantine splitter{Enter}');
    await expect(args.onSend).toHaveBeenCalledWith({ content: '/search mantine splitter' });
    await userEvent.click(search);
    await expect(search).toHaveAttribute('aria-pressed', 'false');
  },
};
