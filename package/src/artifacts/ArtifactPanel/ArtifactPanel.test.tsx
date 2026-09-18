import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ChatInspectorLayout } from '../../primitives/ChatInspectorLayout/ChatInspectorLayout';
import { ArtifactCard } from '../ArtifactCard/ArtifactCard';
import { ArtifactPanel } from './ArtifactPanel';
import { useArtifactPanel } from '../use-artifact-panel';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

const REPORT = {
  type: 'artifact' as const,
  id: 'report',
  title: 'Quarterly report',
  kind: 'Document',
  version: 2,
};

function Chat({ compact }: { compact?: boolean }) {
  const artifacts = useArtifactPanel();
  return (
    <ChatInspectorLayout
      {...artifacts.layoutProps}
      compact={compact}
      inspector={
        <ArtifactPanel artifact={artifacts.current} onClose={artifacts.close}>
          <p>Report body</p>
          <button
            type="button"
            onClick={() => artifacts.open({ ...REPORT, id: 'appendix', title: 'Appendix' })}
          >
            Open the appendix
          </button>
          <button type="button" onClick={() => artifacts.open({ ...REPORT, version: 3 })}>
            Next version
          </button>
        </ArtifactPanel>
      }
    >
      <textarea aria-label="Message" />
      <ArtifactCard artifact={REPORT} onOpen={artifacts.open} />
    </ChatInspectorLayout>
  );
}

describe('artifacts', () => {
  it('opens the artifact from its card, moves the focus in and gives it back on close', async () => {
    render(<Chat compact={false} />, { wrapper });
    const card = screen.getByRole('button', { name: 'Open Quarterly report' });
    card.focus();
    fireEvent.click(card);

    const panel = await screen.findByRole('region', { name: 'Quarterly report' });
    expect(panel).toHaveTextContent('Document · v2');
    expect(screen.getByText('Report body')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Quarterly report' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('region', { name: 'Quarterly report' })).toBeNull();
    await waitFor(() => expect(card).toHaveFocus());
  });

  it('shows the artifact in a drawer on a narrow screen', async () => {
    render(<Chat compact />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Open Quarterly report' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Report body');
  });

  it('renders nothing without an artifact', () => {
    render(<ArtifactPanel artifact={null} onClose={() => {}} />, { wrapper });
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('keeps the focus where it is when only the version changes', async () => {
    render(<Chat compact={false} />, { wrapper });
    fireEvent.click(screen.getByRole('button', { name: 'Open Quarterly report' }));
    await screen.findByRole('region', { name: 'Quarterly report' });
    const field = screen.getByRole('textbox', { name: 'Message' });
    field.focus();
    fireEvent.click(screen.getByRole('button', { name: 'Next version' }));
    expect(await screen.findByText('Document · v3')).toBeInTheDocument();
    expect(field).toHaveFocus();
  });

  it('returns the focus to the card that opened the panel, not to a link inside it', async () => {
    render(<Chat compact={false} />, { wrapper });
    const card = screen.getByRole('button', { name: 'Open Quarterly report' });
    card.focus();
    fireEvent.click(card);
    const inner = await screen.findByRole('button', { name: 'Open the appendix' });
    inner.focus();
    fireEvent.click(inner);
    expect(await screen.findByRole('region', { name: 'Appendix' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(card).toHaveFocus());
  });
});
