import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { FileAttachment } from './FileAttachment';

describe('input/FileAttachment', () => {
  it('formats the size and names the remove button in English by default', () => {
    render(<FileAttachment id="a" filename="notes.txt" size={2048} onRemove={() => {}} />);
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove attachment' })).toBeInTheDocument();
  });

  it('takes the size and the remove button from labels', () => {
    render(
      <FileAttachment
        id="a"
        filename="notes.txt"
        size={2048}
        onRemove={() => {}}
        labels={{ remove: 'Entfernen', size: (bytes) => `${bytes} Bytes` }}
      />
    );
    expect(screen.getByText('2048 Bytes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entfernen' })).toBeInTheDocument();
  });
});
