import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { DEFAULT_FILE_ATTACHMENT_LABELS, FileAttachment } from './FileAttachment';

describe('input/FileAttachment upload states', () => {
  it('cancels instead of removing while uploading and shows the progress', async () => {
    const user = userEvent.setup({ delay: null });
    const onRemove = jest.fn();
    const onCancel = jest.fn();
    render(
      <FileAttachment
        id="f1"
        filename="report.pdf"
        status="uploading"
        progress={42}
        onRemove={onRemove}
        onCancel={onCancel}
      />
    );

    const bar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuetext', '42%');
    await user.click(screen.getByRole('button', { name: 'Cancel upload' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('offers a retry after a failure and announces it', async () => {
    const user = userEvent.setup({ delay: null });
    const onRetry = jest.fn();
    render(
      <FileAttachment
        id="f1"
        filename="report.pdf"
        status="error"
        error="File is too large"
        onRetry={onRetry}
        onRemove={() => {}}
      />
    );

    expect(screen.getByText('File is too large')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Upload failed: report.pdf. File is too large'
    );
    expect(screen.getByRole('button', { name: 'Remove attachment' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry upload' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('draws a ring with its value over an image thumbnail and turns its preview off', () => {
    const { rerender } = render(
      <FileAttachment
        id="i1"
        filename="shot.png"
        isImage
        url="https://example.com/shot.png"
        display="image-only"
        status="uploading"
        progress={40}
      />
    );
    expect(screen.queryByRole('button', { name: 'Preview image' })).not.toBeInTheDocument();
    const ring = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(ring).toHaveAttribute('aria-valuenow', '40');
    expect(ring).toHaveAttribute('aria-valuetext', '40%');

    rerender(
      <FileAttachment
        id="i1"
        filename="shot.png"
        isImage
        url="https://example.com/shot.png"
        display="image-only"
        status="uploading"
      />
    );
    expect(screen.getByRole('progressbar', { name: 'Uploading' })).not.toHaveAttribute(
      'aria-valuenow'
    );
  });

  it('reports no value while the amount is unknown', () => {
    render(<FileAttachment id="f1" filename="recording.m4a" status="uploading" />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).not.toHaveAttribute('aria-valuetext');
  });

  it('keeps the English defaults and the plain chip unchanged', () => {
    expect(DEFAULT_FILE_ATTACHMENT_LABELS).toMatchObject({
      uploading: 'Uploading',
      uploadFailed: 'Upload failed',
      cancelUpload: 'Cancel upload',
      retryUpload: 'Retry upload',
    });
    expect(DEFAULT_FILE_ATTACHMENT_LABELS.progress(7)).toBe('7%');
    expect(DEFAULT_FILE_ATTACHMENT_LABELS.uploadFailedStatus('a.pdf')).toBe('Upload failed: a.pdf');
    const { container } = render(<FileAttachment id="f1" filename="notes.md" size={2048} />);
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveAttribute('data-status');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
