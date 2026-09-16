import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { ImageLightbox } from './ImageLightbox';

const images = [
  { id: 'a', url: 'https://example.com/a.png', filename: 'a.png' },
  { id: 'b', url: 'https://example.com/b.png', filename: 'b.png' },
];

describe('ImageLightbox', () => {
  it('closes on Escape and restores body overflow', async () => {
    document.body.style.overflow = 'auto';
    const onClose = jest.fn();
    const { rerender } = render(<ImageLightbox open onClose={onClose} images={images} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<ImageLightbox open={false} onClose={onClose} images={images} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('clamps the active image when the list shrinks', () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <ImageLightbox open onClose={onClose} images={images} initialIndex={1} />
    );
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'b.png');
    rerender(<ImageLightbox open onClose={onClose} images={[images[0]]} initialIndex={0} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'a.png');
  });

  it('returns focus to the previously focused element on close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const onClose = jest.fn();
    const { rerender } = render(<ImageLightbox open onClose={onClose} images={images} />);
    rerender(<ImageLightbox open={false} onClose={onClose} images={images} />);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
