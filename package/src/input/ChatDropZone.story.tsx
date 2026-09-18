import React, { useState } from 'react';
import { expect, fireEvent, waitFor, within } from '@storybook/test';
import { Stack, Text } from '@mantine/core';
import { WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import type { AttachedFile, AttachedImage } from '../types';
import { ChatDropZone } from './ChatDropZone';
import { useFileIntake, type FileRejection } from './file-intake';
import { InputBar } from './InputBar';

export default { title: 'input/ChatDropZone' };

type Canvas = { canvasElement: HTMLElement };

const IMAGE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="seagreen"/></svg>';
const IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(IMAGE_SVG)}`;

let uploadId = 0;

function IntakeComposer() {
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [rejected, setRejected] = useState<FileRejection[]>([]);
  const intake = useFileIntake({
    accept: ['image/*', '.pdf', '.md', 'text/plain'],
    maxFiles: 4,
    maxFileSize: 5 * 1024 * 1024,
    current: files.length + images.length,
    onFiles: (picked) => {
      for (const file of picked) {
        const id = `upload-${uploadId++}`;
        if (file.type.startsWith('image/')) {
          setImages((current) => [
            ...current,
            { id, filename: file.name, size: file.size, url: IMAGE_URL },
          ]);
        } else {
          setFiles((current) => [...current, { id, filename: file.name, size: file.size }]);
        }
      }
    },
    onReject: setRejected,
  });

  return (
    <ChatDropZone onFiles={intake.onDrop}>
      {({ isDragOver }) => (
        <Stack gap="xs" p="md" mih={240} justify="flex-end" data-testid="drop-target">
          {rejected.length > 0 && (
            <Text size="xs" c="dimmed" data-testid="rejected">
              {rejected.map((item) => `${item.file.name}: ${item.reason}`).join(', ')}
            </Text>
          )}
          <InputBar
            status="ready"
            onSend={() => {}}
            onStop={() => {}}
            onAttach={intake.open}
            onPaste={intake.onPaste}
            leftActions={intake.input}
            isDragOver={isDragOver}
            attachedFiles={files}
            attachedImages={images}
            onRemoveFile={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
            onRemoveImage={(id) =>
              setImages((current) => current.filter((image) => image.id !== id))
            }
            contentWidth="100%"
          />
        </Stack>
      )}
    </ChatDropZone>
  );
}

export const FileIntake = {
  render: () => (
    <WidthFrame width={WIDE_WIDTH}>
      <IntakeComposer />
    </WidthFrame>
  ),
  play: async ({ canvasElement }: Canvas) => {
    const canvas = within(canvasElement);
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!;
    await expect(input).toHaveAttribute('tabindex', '-1');
    fireEvent.change(input, {
      target: {
        files: [
          new File(['# Notes'], 'notes.md', { type: 'text/markdown' }),
          new File(['zip'], 'archive.zip', { type: 'application/zip' }),
        ],
      },
    });
    await expect(await canvas.findByText('notes.md')).toBeInTheDocument();
    await expect(canvas.getByTestId('rejected')).toHaveTextContent('archive.zip: type');
  },
};

export const DropOnChat = {
  render: () => (
    <WidthFrame width={WIDE_WIDTH}>
      <IntakeComposer />
    </WidthFrame>
  ),
  play: async ({ canvasElement }: Canvas) => {
    const canvas = within(canvasElement);
    const zone = canvas.getByTestId('drop-target');
    const transfer = new DataTransfer();
    transfer.items.add(new File(['%PDF'], 'spec.pdf', { type: 'application/pdf' }));
    const drag = (type: string) =>
      zone.dispatchEvent(
        new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer })
      );

    drag('dragenter');
    drag('dragover');
    await expect(await canvas.findByText('Drop files to attach', { selector: 'p' })).toBeVisible();
    drag('drop');
    await expect(await canvas.findByText('spec.pdf')).toBeInTheDocument();
    await waitFor(() =>
      expect(canvas.queryByText('Drop files to attach', { selector: 'p' })).toBeNull()
    );
  },
};
