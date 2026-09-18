import React, { useMemo } from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Box } from '@mantine/core';
import { AgentChat } from '../../AgentChat/AgentChat';
import { Markdown } from '../../Markdown/Markdown';
import { MarkdownLinksProvider } from '../../Markdown/markdown-links';
import { ChatInspectorLayout } from '../../primitives/ChatInspectorLayout/ChatInspectorLayout';
import type { ChatMessage } from '../../types';
import { createArtifactPartRenderer } from '../ArtifactCard/ArtifactCard';
import { ArtifactPanel } from './ArtifactPanel';
import { useArtifactPanel } from '../use-artifact-panel';

export default { title: 'artifacts/ArtifactPanel', parameters: { layout: 'fullscreen' } };

const DOCUMENTS: Record<string, string> = {
  'release-notes': `# Release notes 0.4

- Custom parts in the transcript
- A question can stay at the top while the answer grows
- Media and artifacts in answers`,
};

const MESSAGES: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Draft the release notes' }] },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: 'Here is a first draft. You can also open [the notes](artifact:release-notes) from this link.',
      },
      {
        type: 'artifact',
        id: 'release-notes',
        title: 'Release notes 0.4',
        kind: 'Document',
        version: 1,
      } as never,
    ],
  },
];

function Demo({ compact }: { compact?: boolean }) {
  const artifacts = useArtifactPanel();
  const partRenderers = useMemo(
    () => createArtifactPartRenderer({ onOpen: artifacts.open }),
    [artifacts.open]
  );
  const openFromLink = (href: string) => {
    const id = href.slice('artifact:'.length);
    artifacts.open({ id, title: 'Release notes 0.4', kind: 'Document', version: 1 });
  };
  return (
    <Box h="100dvh" display="flex" style={{ flexDirection: 'column' }}>
      <ChatInspectorLayout
        {...artifacts.layoutProps}
        compact={compact}
        inspector={
          <ArtifactPanel artifact={artifacts.current} onClose={artifacts.close}>
            {artifacts.current && <Markdown content={DOCUMENTS[artifacts.current.id] ?? ''} />}
          </ArtifactPanel>
        }
      >
        <MarkdownLinksProvider onLinkClick={openFromLink} linkSchemes={['artifact']}>
          <AgentChat
            messages={MESSAGES}
            status="ready"
            onSend={() => {}}
            onStop={() => {}}
            partRenderers={partRenderers}
            contentWidth={640}
          />
        </MarkdownLinksProvider>
      </ChatInspectorLayout>
    </Box>
  );
}

export const Usage = {
  render: () => <Demo compact={false} />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('button', { name: 'Open Release notes 0.4' });
    await userEvent.click(card);
    const panel = await canvas.findByRole('region', { name: 'Release notes 0.4' });
    await expect(panel).toHaveTextContent('Custom parts in the transcript');
    await userEvent.click(within(panel).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(card).toHaveFocus());
    await userEvent.click(canvas.getByRole('link', { name: 'the notes' }));
    await expect(await canvas.findByRole('region', { name: 'Release notes 0.4' })).toBeVisible();
  },
};

export function Mobile() {
  return <Demo compact />;
}
