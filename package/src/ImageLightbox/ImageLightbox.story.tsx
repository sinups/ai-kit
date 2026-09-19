import React, { useState } from 'react';
import { Button, Group, Stack } from '@mantine/core';
import { ImageLightbox, LightboxImage } from './ImageLightbox';
import { AiKitHostScope } from '../theme/AiKitProvider';

export default { title: 'Messages/ImageLightbox' };

function svgImage(fill: string, label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="${fill}"/><text x="400" y="260" font-family="sans-serif" font-size="48" fill="white" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const IMAGES: LightboxImage[] = [
  { id: 'img-1', url: svgImage('steelblue', 'screenshot-1.png'), filename: 'screenshot-1.png' },
  { id: 'img-2', url: svgImage('darkolivegreen', 'diagram.png'), filename: 'diagram.png' },
  { id: 'img-3', url: svgImage('indianred', 'error.png'), filename: 'error.png' },
];

export function Usage() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  return (
    <Stack p={32} gap={16}>
      <AiKitHostScope>
        <Group>
          {IMAGES.map((image, idx) => (
            <Button
              key={image.id}
              variant="default"
              size="xs"
              onClick={() => {
                setIndex(idx);
                setOpen(true);
              }}
            >
              Open {image.filename}
            </Button>
          ))}
        </Group>
      </AiKitHostScope>
      <ImageLightbox
        open={open}
        onClose={() => setOpen(false)}
        images={IMAGES}
        initialIndex={index}
      />
    </Stack>
  );
}

export function SingleImage() {
  const [open, setOpen] = useState(false);
  return (
    <Stack p={32} gap={16}>
      <AiKitHostScope>
        <Button variant="default" size="xs" onClick={() => setOpen(true)} w="fit-content">
          Open preview
        </Button>
      </AiKitHostScope>
      <ImageLightbox open={open} onClose={() => setOpen(false)} images={[IMAGES[0]]} />
    </Stack>
  );
}
