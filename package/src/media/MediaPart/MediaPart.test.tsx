import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import type { FilePart } from '../../types';
import { createMediaPartRenderers, MediaPart } from './MediaPart';

function part(overrides: Partial<FilePart>): FilePart {
  return { type: 'file', filename: 'report', ...overrides };
}

describe('media/MediaPart', () => {
  it('picks the element by media type', () => {
    const { container } = render(
      <>
        <MediaPart
          messageId="a1"
          index={0}
          part={part({
            mediaType: 'image/png',
            url: 'https://cdn.example/a.png',
            filename: 'chart.png',
          })}
        />
        <MediaPart
          messageId="a1"
          index={1}
          part={part({
            mediaType: 'audio/mpeg',
            url: 'https://cdn.example/a.mp3',
            filename: 'call.mp3',
          })}
        />
        <MediaPart
          messageId="a1"
          index={2}
          part={part({
            mediaType: 'video/mp4',
            url: 'https://cdn.example/a.mp4',
            filename: 'demo.mp4',
          })}
        />
        <MediaPart
          messageId="a1"
          index={3}
          part={part({
            mediaType: 'application/pdf',
            url: 'https://cdn.example/a.pdf',
            filename: 'spec.pdf',
          })}
        />
      </>
    );
    expect(screen.getByRole('img', { name: 'chart.png' })).toHaveAttribute(
      'src',
      'https://cdn.example/a.png'
    );
    expect(container.querySelector('audio')).toHaveAttribute('aria-label', 'Audio: call.mp3');
    expect(container.querySelector('audio')).not.toHaveAttribute('autoplay');
    expect(container.querySelector('video')).toHaveAttribute('aria-label', 'Video: demo.mp4');
    expect(screen.getByRole('link', { name: 'Download spec.pdf' })).toHaveAttribute(
      'href',
      'https://cdn.example/a.pdf'
    );
  });

  it('keeps unsafe addresses out of the page', () => {
    const { container } = render(
      <>
        <MediaPart
          messageId="a1"
          index={0}
          part={part({
            mediaType: 'image/svg+xml',
            url: ['java', 'script:alert(1)'].join(''),
            filename: 'x.svg',
          })}
        />
        <MediaPart
          messageId="a1"
          index={1}
          part={part({
            mediaType: 'text/html',
            url: 'data:text/html,<b>x</b>',
            filename: 'page.html',
          })}
        />
        <MediaPart
          messageId="a1"
          index={2}
          part={part({
            mediaType: 'video/mp4',
            url: 'blob:https://example.com/1',
            filename: 'clip.mp4',
          })}
        />
      </>
    );
    expect(container.querySelector('img, video, audio')).toBeNull();
    expect(container.querySelector('a[href]')).toBeNull();
  });

  it('allows a data image and opens it in the preview', () => {
    render(
      <MediaPart
        messageId="a1"
        index={0}
        part={part({ mediaType: 'image/png', data: 'iVBORw0KGgo=', filename: 'dot.png' })}
      />
    );
    const image = screen.getByRole('img', { name: 'dot.png' });
    expect(image.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    fireEvent.click(screen.getByRole('button', { name: 'Open image preview' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('hands other files to onOpenFile and takes the labels', () => {
    const onOpenFile = jest.fn();
    const renderers = createMediaPartRenderers({
      onOpenFile,
      labels: { audio: (name) => `Аудио: ${name}` },
    });
    const FilePartRenderer = renderers.file;
    const pdf = part({
      mediaType: 'application/pdf',
      url: 'https://cdn.example/a.pdf',
      filename: 'spec.pdf',
    });
    const { container } = render(
      <>
        <FilePartRenderer messageId="a1" index={0} part={pdf} />
        <FilePartRenderer
          messageId="a1"
          index={1}
          part={part({
            mediaType: 'audio/ogg',
            url: 'https://cdn.example/a.ogg',
            filename: 'memo.ogg',
          })}
        />
      </>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open spec.pdf' }));
    expect(onOpenFile).toHaveBeenCalledWith(pdf, 'a1');
    expect(container.querySelector('audio')).toHaveAttribute('aria-label', 'Аудио: memo.ogg');
  });

  it('takes a relative address and loads captions across origins', () => {
    const { container } = render(
      <>
        <MediaPart
          messageId="a1"
          index={0}
          part={part({ mediaType: 'image/png', url: '/files/chart.png', filename: 'chart.png' })}
        />
        <MediaPart
          messageId="a1"
          index={1}
          part={part({
            mediaType: 'video/mp4',
            url: 'https://cdn.example/demo.mp4',
            captions: 'https://cdn.example/demo.vtt',
            filename: 'demo.mp4',
          })}
        />
      </>
    );
    expect(screen.getByRole('img', { name: 'chart.png' })).toHaveAttribute(
      'src',
      '/files/chart.png'
    );
    expect(container.querySelector('video')).toHaveAttribute('crossorigin', 'anonymous');
    expect(container.querySelector('track')).toHaveAttribute('src', 'https://cdn.example/demo.vtt');
  });
});
