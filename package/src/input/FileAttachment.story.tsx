import React, { useEffect, useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import type { AttachedFile } from '../types';
import { FileAttachment } from './FileAttachment';
import { InputBar } from './InputBar';

export default { title: 'Input/FileAttachment' };

type Canvas = { canvasElement: HTMLElement };

const IMAGE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="seagreen"/></svg>';
const IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(IMAGE_SVG)}`;

function States() {
  return (
    <Stack gap="md">
      <FileAttachment id="a" filename="quarterly-report.pdf" size={482_000} onRemove={() => {}} />
      <FileAttachment
        id="b"
        filename="dataset.csv"
        status="uploading"
        progress={64}
        onCancel={() => {}}
      />
      <FileAttachment id="c" filename="recording.m4a" status="uploading" onCancel={() => {}} />
      <FileAttachment
        id="d"
        filename="archive.zip"
        status="error"
        error="The file is larger than 20 MB"
        onRetry={() => {}}
        onRemove={() => {}}
      />
      <FileAttachment
        id="f"
        filename="photo.png"
        isImage
        url={IMAGE_URL}
        display="image-only"
        status="uploading"
        progress={40}
      />
    </Stack>
  );
}

export function Usage() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <States />
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <States />
    </WidthFrame>
  );
}

function UploadingComposer({ onSend }: { onSend: (message: { content: string }) => void }) {
  const [files, setFiles] = useState<AttachedFile[]>([
    {
      id: 'report',
      filename: 'quarterly-report.pdf',
      size: 482_000,
      status: 'uploading',
      progress: 0,
    },
  ]);
  const [value, setValue] = useState('Summarize the attached report');
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    timer.current = setInterval(() => {
      setFiles((current) =>
        current.map((file) => {
          if (file.status !== 'uploading') {
            return file;
          }
          const progress = Math.min(100, (file.progress ?? 0) + 25);
          return progress === 100
            ? { ...file, status: 'done', progress: undefined }
            : { ...file, progress };
        })
      );
    }, 250);
    return () => clearInterval(timer.current);
  }, []);

  return (
    <InputBar
      status="ready"
      value={value}
      onChange={setValue}
      onSend={onSend}
      onStop={() => {}}
      attachedFiles={files}
      onRemoveFile={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
      onCancelFile={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
      contentWidth="100%"
    />
  );
}

export const UploadStatesFlow = {
  args: { onSend: fn() },
  render: ({ onSend }: { onSend: (message: { content: string }) => void }) => (
    <WidthFrame width={WIDE_WIDTH}>
      <UploadingComposer onSend={onSend} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: Canvas & { args: { onSend: ReturnType<typeof fn> } }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Wait for uploads to finish' }));
    await expect(args.onSend).not.toHaveBeenCalled();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Send' })).toBeInTheDocument(), {
      timeout: 3000,
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(args.onSend).toHaveBeenCalledWith({
      role: 'user',
      content: 'Summarize the attached report',
    });
  },
};
