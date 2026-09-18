import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { ArtifactCard, createArtifactPartRenderer } from './ArtifactCard';

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

describe('artifacts/ArtifactCard', () => {
  it('is one button named after the artifact with its kind and version', () => {
    const onOpen = jest.fn();
    render(<ArtifactCard artifact={REPORT} onOpen={onOpen} />, { wrapper });
    expect(screen.getByText('Document · v2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Quarterly report' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('turns artifact parts into cards and reports a streaming one politely', () => {
    const onOpen = jest.fn();
    const { artifact: Card } = createArtifactPartRenderer({
      onOpen,
      labels: { streaming: 'Пишу…', open: (title) => `Открыть ${title}` },
    });
    render(<Card messageId="a1" index={0} part={{ ...REPORT, status: 'streaming' }} />, {
      wrapper,
    });
    expect(screen.getByText('Пишу…').closest('[aria-live]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Открыть Quarterly report' }));
    expect(onOpen).toHaveBeenCalledWith({
      id: 'report',
      title: 'Quarterly report',
      kind: 'Document',
      version: 2,
    });
  });
});
